const prisma = require('../prismaClient');
const categorizeTransaction = require('../utils/categorizer');
const { updateBudgetSpent } = require('../utils/budgetTracker');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { buildTransactionFilters } = require('../utils/queryBuilder');

const { asyncHandler } = require('../middleware/errorHandler');
const { NotFoundError, ValidationError, BadRequestError } = require('../utils/customErrors');

const listTransactions = asyncHandler(async (req, res) => {

  const userId = req.user.id;

  const {
    category,
    type,
    startDate,      // Changed from dateFrom
    endDate,        // Changed from dateTo
    minAmount,
    maxAmount,
    search,
    accountId,
    merchant,
    page = 1,       // Default page 1
    limit = 20,     // Default limit 20
    sortBy = 'date',
    sortOrder = 'desc'
  } = req.query;


  const filters = {
    category,
    type,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    search,
    accountId,
    merchant,
    page,
    limit
  };

  const queryParams = buildTransactionFilters(userId, filters);

  const totalCount = await prisma.transaction.count({ where: queryParams.where });

  //Fetch Transactions
  const transactions = await prisma.transaction.findMany(
    {
      where: queryParams.where,
      skip: queryParams.skip,
      take: queryParams.take,
      orderBy: { [sortBy]: sortOrder }
    }
  );

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalCount / queryParams.take);
  const hasMore = queryParams.page < totalPages;

  //Response to user
  return successResponse(res, 200, 'Transactions fetched successfully', {
    transactions,
    metadata: {
      total: totalCount,
      page: parseInt(queryParams.page),
      limit: parseInt(queryParams.take),
      totalPages,
      hasMore
    }
  })

});

// [ ] Function: `createTransaction(req, res)`
const createTransaction = asyncHandler(async (req, res) => {
  const { amount, type, category, merchant, description, date, accountId } = req.body;


  if (amount < 0) throw new ValidationError('Amount cannot be negative');


  if (!category) {
    category = await categorizeTransaction(merchant || null, description || null);
  }

  if (date && new Date() < date) {
    throw new ValidationError('Date cannot be in the future');
  }

  //Verifying account of User.
  const user = await prisma.user.findFirst({ where: { id: accountId } });
  if (!user) {
   throw new NotFoundError('Account not found or does not belong to you');
  }

  const account = await prisma.account.findFirst({ where: { id: accountId } });
  if (!account) {
    throw new NotFoundError('Account not found or does not belong to you');
  }

  const created = await prisma.transaction.create({
    data: {
      amount,
      type,
      category,
      merchant,
      description,
      date: date || new Date(),
      accountId,
      userId: req.user.id
    }
  });

  // ✅ ADD THIS: Update budget if expense transaction
  if (created.type === 'debit' && created.category) {
    try {
      await updateBudgetSpent(req.user.id, created.category, created.date);
    } catch (budgetError) {
      // Log error but don't fail transaction creation
      console.error('Failed to update budget:', budgetError);
    }
  }
  return successResponse(res, 201, 'Transaction created successfully', created);
});

// [ ] Function: `getTransactionById(req, res)`.
const getTransactionById = asyncHandler(async (req, res) => {

  const id = req.params.id;
  const userId = req.user.id;

  const transaction = await prisma.transaction.findFirst({ where: { id, userId } });

  if (!transaction) throw new NotFoundError('Transaction not found');

  return successResponse(res, 200, 'Transaction fetched successfully', transaction);

})
// - [ ] Function: `updateTransaction(req, res)`.

const updateTransaction = asyncHandler(async (req, res) => {

  const id = req.params.id;
  const {
    amount,
    type,
    category,
    merchant,
    description,
    date
  } = req.body;

  //Checking transaction exists or not
  const transaction = await prisma.transaction.findFirst({ where: { id, userId: req.user.id } });

  if (!transaction)  throw new NotFoundError('Transaction not found');


  const updateData = {
    ...(amount !== undefined && { amount: new prisma.Decimal(amount) }),
    ...(type !== undefined && { type }),
    ...(category !== undefined && { category }),
    ...(merchant !== undefined && { merchant }),
    ...(description !== undefined && { description }),
    ...(date !== undefined && { date: new Date(date) }),
  };

  //Updating transaction
  const updatedTransaction = await prisma.transaction.update({ where: { id }, data: updateData });

  // ✅ ADD THIS: Update budget if expense transaction
  if (transaction.type === 'debit' && transaction.category) {
    updateBudgetSpent(req.user.id, transaction.category, transaction.date);
  }

  if (updatedTransaction.type === 'debit' && updatedTransaction.category) {
    updateBudgetSpent(req.user.id, updatedTransaction.category, updatedTransaction.date);
  }
  return successResponse(res, 200, 'Transaction updated successfully', updatedTransaction);
})


const deleteTransaction =asyncHandler( async (req, res) => {
  
    const id = req.params.id;
    const userId = req.user.id;

    // ✅ Get transaction details BEFORE deleting
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId }
    });

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    // Delete transaction
    await prisma.transaction.delete({
      where: { id }
    });

    // ✅ Update budget after deletion
    if (transaction.type === 'debit' && transaction.category) {
      try {
        await updateBudgetSpent(userId, transaction.category, transaction.date);
      } catch (budgetError) {
        console.error('Failed to update budget after deletion:', budgetError);
      }
    }
    return successResponse(res, 200, 'Transaction deleted successfully');  
});

const searchTransactions =asyncHandler( async (req, res) => {
  
    const userId = req.user.id;
    const { search } = req.query;

    const {
      category,
      type,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      accountId,
      page = 1,
      limit = 50  // Higher default for search
    } = req.query;

    if (!search) throw new NotFoundError('Search term is required');

    if (search.length < 3) {
      throw new ValidationError('Search term must be at least 3 characters long');
    }

    const filters = {
      search,
      category,
      type,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      accountId,
      page,
      limit: Math.min(parseInt(limit), 100) // Cap at 100
    };

    const queryParams = buildTransactionFilters(userId, filters);

    const totalCount = await prisma.transaction.count({ where: queryParams.where });

    const transactions = await prisma.transaction.findMany({
      where: queryParams.where,
      skip: queryParams.skip,
      take: queryParams.take,
      orderBy: {
        date: 'desc'  // Most recent first
      }
    });

    const totalPages = Math.ceil(totalCount / queryParams.take);
    const hasMore = queryParams.page < totalPages;

    return successResponse(res, 200, 'Search results fetched successfully', {
      transactions,
      searchTerm: search,
      metadata: {
        total: totalCount,
        page: parseInt(queryParams.page),
        limit: parseInt(queryParams.take),
        totalPages,
        hasMore
      }
    });
})

module.exports = {
  listTransactions,
  createTransaction,
  searchTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction
}