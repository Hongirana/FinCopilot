const prisma = require('../prismaClient');
const categorizeTransaction = require('../utils/categorizer');
const { updateBudgetSpent } = require('../utils/budgetTracker');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { buildTransactionFilters } = require('../utils/queryBuilder');

const { asyncHandler } = require('../middleware/errorHandler');
const { NotFoundError, ValidationError, BadRequestError } = require('../utils/customErrors');
const { user } = require('../middleware/userMiddleware');

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
  const userId = req.user.id;
  let { amount, type, category, merchant, description, date, accountId } = req.body;

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount < 0) {
    throw new ValidationError('Amount must be a non-negative number');
  }


  let txDate = date ? new Date(date) : new Date();
  if (Number.isNaN(txDate.getTime())) {
    throw new ValidationError('Invalid date');
  }
  if (txDate > new Date()) {
    throw new ValidationError('Date cannot be in the future');
  }

  if (!category) {
    category = await categorizeTransaction(merchant || null, description || null);
  }

  if (date && new Date() < date) {
    throw new ValidationError('Date cannot be in the future');
  }

  //Verifying account of User.
  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
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
      date: txDate || new Date(),
      accountId,
      userId: req.user.id
    }
  });

  // ✅ ADD THIS: Update budget if expense transaction
  if (created.type === 'debit' && created.category) {
    try {
      await updateBudgetSpent(req.user.id, created.category, created.txDate);
    } catch (budgetError) {
      // Log error but don't fail transaction creation
      console.error('Failed to update budget:', budgetError);
    }
  }
  console.log("Transaction Created Successfully",created);
  return successResponse(res, 201, 'Transaction created successfully', { transaction: created });
});

// [ ] Function: `getTransactionById(req, res)`.
const getTransactionById = asyncHandler(async (req, res) => {

  const id = req.params.id;
  const userId = req.user.id;

  const transaction = await prisma.transaction.findFirst({ where: { id, userId } });

  if (!transaction) throw new NotFoundError('Transaction not found');

  return successResponse(res, 200, 'Transaction fetched successfully', { transaction });

})
// - [ ] Function: `updateTransaction(req, res)`.

const updateTransaction = asyncHandler(async (req, res) => {
  const userId = req.user.id;
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
  const transaction = await prisma.transaction.findFirst({ where: { id: id, userId: userId } });

  if (!transaction) throw new NotFoundError('Transaction not found');


  const updateData = {
    ...(amount !== undefined && { amount: Number(amount).toFixed(2) }),
    ...(type !== undefined && { type }),
    ...(category !== undefined && { category }),
    ...(merchant !== undefined && { merchant }),
    ...(description !== undefined && { description }),
    ...(date !== undefined && { date: new Date(date) }),
  };
  console.log(updateData);
  //Updating transaction
  const updatedTransaction = await prisma.transaction.update({ where: { id , userId }, data: updateData });

  // ✅ ADD THIS: Update budget if expense transaction
  if (transaction.type === 'debit' && transaction.category) {
    updateBudgetSpent(req.user.id, transaction.category, transaction.date);
  }

  if (updatedTransaction.type === 'debit' && updatedTransaction.category) {
    updateBudgetSpent(req.user.id, updatedTransaction.category, updatedTransaction.date);
  }
  console.log("Transaction Updated Successfully",updatedTransaction);
  return successResponse(res, 200, 'Transaction updated successfully', {transaction: updatedTransaction } );
})


const deleteTransaction = asyncHandler(async (req, res) => {

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

const searchTransactions = asyncHandler(async (req, res) => {

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