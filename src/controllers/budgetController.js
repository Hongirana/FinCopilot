const prisma = require('../prismaClient');
const { successResponse, errorResponse } = require('../utils/responseHelper.js');
const categoryRules = require('../lib/catergoryRules.json');
const budgetPeriod = ['daily', 'weekly', 'monthly', 'yearly'];

const { asyncHandler } = require('../middleware/errorHandler');
const { NotFoundError, ValidationError, BadRequestError } = require('../utils/customErrors');

// **Features to Build:**
// 1. **Create Budget**: Set spending limits per category
// 2. **List Budgets**: Get all budgets for user (with filters)
// 3. **Update Budget**: Modify budget amounts/periods
// 4. **Delete Budget**: Remove budget
// 5. **Budget Status**: Calculate spent vs budget per category
// 6. **Budget Alerts**: Identify over-budget categories

//Main Fetature functions
const createBudget = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { category, amount, period, startDate, endDate } = req.body;

    if (!category || !amount || !period || !startDate || !endDate) {
        return errorResponse(res, 400, 'Missing required fields');
    }


    const validateValues = await validateBudgetValues(category, amount, period, startDate, endDate);

    if (!validateValues.status && validateValues.message) {
        throw new ValidationError(validateValues.message);
    }

    const overLappedBugdet = await overLappingBudget(category, userId, startDate, endDate);

    if (overLappedBugdet) {
        throw new ConflictError('Budget already exists for this category in the specified period');
    }

    const budget = await prisma.budget.create({
        data: {
            category: category.toLowerCase(),
            amount,
            period: period.toUpperCase(),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            userId
        }
    });

    return successResponse(res, 201, 'Budget created successfully', budget);

})

const listUserBudgets = asyncHandler(async (req, res) => {
    const { period, category, active } = req.query;
    const userId = req.user.id;
    const filter = {
        where: {
            userId: userId,
            ...(category && { category: category.toLowerCase() }),
            ...(period && { period: period.toUpperCase() }),
        }
    }
    if (active === 'true') {
        filter.where.startDate = { lte: new Date() };
        filter.where.endDate = { gte: new Date() };
    }
    const validateValues = await validateBudgetValues(category, null, period, null, null);
    if (!validateValues.status && validateValues.message) {
        throw new ValidationError(validateValues.message);
    }

    const budgets = await prisma.budget.findMany(filter);
    const budgetDatawithStatus = await getbudgetStatus(budgets);
    return successResponse(res, 200, 'Budgets fetched successfully', budgetDatawithStatus);
})


const getBudgetById = asyncHandler(async (req, res) => {
    const budgetId = req.params.id;
    const userId = req.user.id;

    const budgets = await prisma.budget.findFirst({
        where: {
            id: budgetId,
            userId: userId
        }
    });
    if (!budgets) { throw new NotFoundError('Budget not found'); }
    else {
        const budgetDatawithStatus = await getbudgetStatus([budgets]);

        return successResponse(res, 200, 'Budgets fetched successfully', budgetDatawithStatus);
    }
})


const updateBudget = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const budgetId = req.params.id;

    const { category, amount, period, startDate, endDate } = req.body;

    if (!category || !amount || !period || !startDate || !endDate) {
        return errorResponse(res, 400, 'Missing required fields');
    }
    const validateValues = await validateBudgetValues(category, amount, period, startDate, endDate);
    if (!validateValues.status && validateValues.message) {
        throw new ValidationError(validateValues.message);
    }

    const budgetData = await prisma.budget.findFirst({ where: { id: budgetId, userId: userId } });
    if (!budgetData) throw new NotFoundError('Budget not found');

    const updateData = {
        ...(category && { category: category.toLowerCase() }),
        ...(amount && { amount }),
        ...(period && { period: period.toUpperCase() }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
    }

    const updateBudget = await prisma.budget.update({ where: { id: budgetId }, data: updateData });
    return successResponse(res, 200, 'Budget updated successfully', updateBudget);
})


const deleteBudget = asyncHandler(async (req, res) => {
    const budgetId = req.params.id;
    const userId = req.user.id;

    const budgetData = await prisma.budget.findFirst({ where: { id: budgetId, userId: userId } });
    if (!budgetData) throw new NotFoundError('Budget not found');

    await prisma.budget.delete({ where: { id: budgetId } });
    return successResponse(res, 200, 'Budget deleted successfully');
})

const budgetAlerts = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const threshold = parseInt(req.query.threshold) || 80; // Default 80%

    const budgetData = await prisma.budget.findMany({
        where: {
            userId,
            startDate: { lte: new Date() },
            endDate: { gte: new Date() }
        }
    });

    const alerts = budgetData
        .map(budget => {
            const percentSpent = (Number(budget.spent) / Number(budget.amount)) * 100;

            return {
                ...budget,
                percentSpent: percentSpent.toFixed(2),
                isOverBudget: percentSpent > 100,
                isNearLimit: percentSpent >= threshold && percentSpent <= 100
            };
        })
        .filter(budget => budget.isOverBudget || budget.isNearLimit);

    return successResponse(res, 200, 'Budgets fetched successfully', alerts);
})


const recalculateBudgets = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { recalculateAllBudgets } = require('../utils/budgetTracker');
    const result = await recalculateAllBudgets(userId);
    return successResponse(res, 200, 'Budgets recalculated successfully', result);
});


module.exports = {
    createBudget,
    getBudgetById,
    listUserBudgets,
    updateBudget,
    deleteBudget,
    budgetAlerts,
    recalculateBudgets
}




//Helper Functions 
const isValidDate = (dateString) => {
    const dateRegex = /^(\d{4}-\d{2}-\d{2})$/;
    if (!dateRegex.test(dateString)) return false;;

    const date = new Date(dateString);
    return !isNaN(date.getTime());
}





const overLappingBudget = async (category, userId, startDate, endDate) => {
    const data = {
        where: {
            category: category,
            userId: userId,
            OR: [  // ✅ OR inside where
                {
                    AND: [
                        { startDate: { lte: startDate } },
                        { endDate: { gte: startDate } }
                    ]
                },
                {
                    AND: [
                        { startDate: { lte: endDate } },
                        { endDate: { gte: endDate } }
                    ]
                }
            ]
        }

    }
    const bugdetData = await prisma.budget.findFirst(data);
    return bugdetData ? true : false;
}


const validateBudgetValues = async (category, amount, period, startDate, endDate) => {
    if (amount < 0) {
        return { status: false, message: 'Amount cannot be negative' };
    }

    if (categoryRules.hasOwnProperty(category.toLowerCase()) === false) {
        return { status: false, message: `${category} 'Invalid category'` };
    }

    if (budgetPeriod.indexOf(period.toLowerCase()) === -1) {
        return { status: false, message: 'Invalid period' };
    }

    if (new Date(startDate) > new Date(endDate)) {
        return { status: false, mesage: 'Start date cannot be after end date' };
    }

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
        return { status: false, message: 'Invalid date format' };
    }

    return { status: true };

}

const getbudgetStatus = async (budgetData) => {

    const budgetsWithStatus = budgetData.map(budget => ({
        ...budget,
        percentSpent: ((budget.spent / budget.amount) * 100).toFixed(2),
        remaining: budget.amount - budget.spent,
        isOverBudget: budget.spent > budget.amount,
        daysRemaining: Math.ceil(
            (budget.endDate - new Date()) / (1000 * 60 * 60 * 24)
        )
    }));

    return budgetsWithStatus;
}