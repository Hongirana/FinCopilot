const prisma = require('../prismaClient');
const categorizeTransaction = require('../utils/categorizer');
const { updateBudgetSpent } = require('../utils/budgetTracker');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { buildTransactionFilters } = require('../utils/queryBuilder');

let listTransactions = async (req, res) => {
  try {

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
  } catch (err) {
    console.error('List transactions error:', err);
    return errorResponse(res, 500, 'Failed to fetch transactions');
  }
};

// [ ] Function: `createTransaction(req, res)`
let createTransaction = async (req, res) => {
  const { amount, type, category, merchant, description, date, accountId } = req.body;
  try {

    if (amount < 0) return res.status(400).json({ error: 'Amount cannot be negative' });

    const { TransactionType, Category } = prisma;

    if (!category) {
      category = await categorizeTransaction(merchant || null, description || null);
    }

    if (!TransactionType.includes(type)) {
      return res.status(400).json({
        error: 'Invalid transaction type',
        message: 'Type must be either debit or credit'
      });
    }
    if (!Category.includes(category)) {
      return res.status(400).json({
        error: 'Invalid category',
        message: 'Category must be one of: food, rent, utilities, etc.'
      });
    }
    if (date && new Date() < date) {
      return res.status(400).json({
        error: 'Invalid Date '
      });
    }

    //Verifying account of User.
    const user = await prisma.user.findFirst({ where: { id: accountId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const account = await prisma.account.findFirst({ where: { id: accountId } });
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });;
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

    res.status(201).json({ success: true, message: 'Transaction created successfully', data: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// [ ] Function: `getTransactionById(req, res)`.
let getTransactionById = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;

    const transaction = await prisma.transaction.findFirst({ where: { id, userId } });

    if (!transaction) return res.status(404).json({ error: 'Not found' });
    res.json(transaction);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
// - [ ] Function: `updateTransaction(req, res)`.

let updateTransaction = async (req, res) => {
  try {
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

    if (!transaction) return res.status(404).json({ error: 'Transaction Not found' });

    const { TransactionType, Category } = prisma;

    if (!TransactionType.includes(type)) {
      return res.status(400).json({
        error: 'Invalid transaction type',
        message: 'Type must be either debit or credit'
      });
    }
    if (!Category.includes(category)) {
      return res.status(400).json({
        error: 'Invalid category',
        message: 'Category must be one of: food, rent, utilities, etc.'
      });
    }

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
      try {
        await updateBudgetSpent(req.user.id, transaction.category, transaction.date);
      } catch (budgetError) {
        // Log error but don't fail transaction creation
        console.error('Failed to update budget:', budgetError);
      }
    }

    if (updatedTransaction.type === 'debit' && updatedTransaction.category) {
      try {
        await updateBudgetSpent(req.user.id, updatedTransaction.category, updatedTransaction.date);
      } catch (budgetError) {
        console.error('Failed to update new budget:', budgetError);
      }
    }


    res.status(200).json({ success: true, message: 'Transaction updated successfully', data: updateData });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}


let deleteTransaction = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;

    // ✅ Get transaction details BEFORE deleting
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
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

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully'
    });

  } catch (err) {
    console.error('Delete transaction error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

let searchTransactions = async (req, res) => {
  try {
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

    if (!search) return errorResponse(res, 400, 'Search query is required');

    if (search.length < 3) {
      return errorResponse(res, 400, 'Search term must be at least 3 characters');
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
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, 'Server error');
  }
}

module.exports = {
  listTransactions,
  createTransaction,
  searchTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction
}