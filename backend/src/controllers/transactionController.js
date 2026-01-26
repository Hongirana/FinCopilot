const prisma = require('../prismaClient');
const { updateBudgetSpent } = require('../utils/budgetTracker');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { buildTransactionFilters } = require('../utils/queryBuilder');

const { asyncHandler } = require('../middleware/errorHandler');
const { NotFoundError, ValidationError, BadRequestError } = require('../utils/customErrors');
const { invalidateTransactionCache } = require('../services/cacheService');
const aiService = require('../services/aiServices');
const { isValidCategory , getCategoryList} = require('../constant/categories');
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
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  // Validate amount
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new ValidationError('Amount must be a positive number');
  }

  // Validate and parse date
  let txDate = date ? new Date(date) : new Date();
  if (Number.isNaN(txDate.getTime())) {
    throw new ValidationError('Invalid date');
  }
  if (txDate > today) {
    throw new ValidationError('Date cannot be in the future');
  }

  // Verify account belongs to user
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId }
  });

  if (!account) {
    throw new NotFoundError('Account not found or does not belong to you');
  }

  //Validate Category transactions
  if (category && !isValidCategory(category)) {
    throw new ValidationError(`Invalid category. Allowed categories are: ${getCategoryList()}`);
  }

  // ✅ NEW: AI Auto-Categorization if category not provided
  if (!category) {
    
    const aiResult = await aiService.categorizeTransaction({
      description: description || '',
      amount: numericAmount,
      merchant: merchant || '',
      type: type
    });

    if (aiResult.success) {
      category = aiResult.data.category;
    
    } else {
    category = 'other';
    
    }
  }

  // ✅ NEW: Calculate balance change
  const balanceChange = type === 'credit' ? numericAmount : -numericAmount;

  // Start transaction for atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Create transaction record
    const created = await tx.transaction.create({
      data: {
        amount: numericAmount,
        type,
        category,
        merchant,
        description,
        date: txDate,
        accountId,
        userId
      }
    });

    // ✅ NEW: Update account balance
    await tx.account.update({
      where: { id: accountId },
      data: {
        balance: {
          increment: balanceChange
        }
      }
    });

    return created;
  });

  // Invalidate cache after successful creation
  await invalidateTransactionCache(userId);

  // Update budget if expense transaction
  if (result.category) {
    try {
      await updateBudgetSpent(userId, result.category, result.date);
    } catch (budgetError) {
      console.error('Failed to update budget:', budgetError);
    }
  }


  return successResponse(res, 201, 'Transaction created successfully', {
    transaction: result
  });
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
  const { amount, type, category, merchant, description, date } = req.body;

  // Get existing transaction
  const transaction = await prisma.transaction.findFirst({
    where: { id, userId }
  });

  if (!transaction) throw new NotFoundError('Transaction not found');

  // Build update data
  const updateData = {
    ...(amount !== undefined && { amount: Number(amount) }),
    ...(type !== undefined && { type }),
    ...(category !== undefined && { category }),
    ...(merchant !== undefined && { merchant }),
    ...(description !== undefined && { description }),
    ...(date !== undefined && { date: new Date(date) }),
  };

  // ✅ NEW: Calculate balance adjustment if amount or type changed
  let balanceAdjustment = 0;
  const oldBalance = transaction.type === 'credit'
    ? Number(transaction.amount)
    : -Number(transaction.amount);

  const newAmount = updateData.amount !== undefined ? updateData.amount : Number(transaction.amount);
  const newType = updateData.type || transaction.type;

  const newBalance = newType === 'credit' ? newAmount : -newAmount;
  balanceAdjustment = newBalance - oldBalance;

  // Update transaction and account balance atomically
  const result = await prisma.$transaction(async (tx) => {
    // Update transaction
    const updatedTx = await tx.transaction.update({
      where: { id },
      data: updateData
    });

    // ✅ NEW: Update account balance if changed
    if (balanceAdjustment !== 0) {
      await tx.account.update({
        where: { id: transaction.accountId },
        data: {
          balance: {
            increment: balanceAdjustment
          }
        }
      });
    }

    return updatedTx;
  });

  // Invalidate cache
  await invalidateTransactionCache(userId);

  // Update budgets for old and new categories
  if ( transaction.category) {
    updateBudgetSpent(userId, transaction.category, transaction.date);
  }
  if (result.category) {
    updateBudgetSpent(userId, result.category, result.date);
  }

  return successResponse(res, 200, 'Transaction updated successfully', {
    transaction: result
  });
});


const deleteTransaction = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const userId = req.user.id;

  // Get transaction details BEFORE deleting
  const transaction = await prisma.transaction.findFirst({
    where: { id, userId }
  });

  if (!transaction) {
    throw new NotFoundError('Transaction not found');
  }

  // Calculate balance reversal
  const balanceReversal = transaction.type === 'credit'
    ? -Number(transaction.amount)
    : Number(transaction.amount);

  // Delete transaction and update balance atomically
  await prisma.$transaction(async (tx) => {
    // Delete transaction
    await tx.transaction.delete({ where: { id } });

    // ✅ NEW: Reverse balance change
    await tx.account.update({
      where: { id: transaction.accountId },
      data: {
        balance: {
          increment: balanceReversal
        }
      }
    });
  });

  // Invalidate cache
  await invalidateTransactionCache(userId);

  // Update budget after deletion
  if (transaction.category) {
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
