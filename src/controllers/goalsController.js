const prisma = require('../prismaClient');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { asyncHandler } = require('../middleware/errorHandler');
const { NotFoundError, ValidationError, BadRequestError } = require('../utils/customErrors');

//Create Goals 

const createGoals = asyncHandler(async (req, res) => {

    const { title, description, targetAmount, deadline, category, priority } = req.body;
    console.log("Creating Goal");
    const validatedData = await validateValuesforCreate(title, targetAmount, deadline, category);
    console.log(validatedData);
    if (validatedData.status === false && validatedData.message) {
        throw new ValidationError(validatedData.message);
    }

    const data = {
        title,
        description,
        targetAmount,
        deadline: new Date(deadline),
        category,
        priority,
        status: 'ACTIVE',
        userId: req.user.id
    }

    const goal = await prisma.goal.create({ data });
    console.log("Goal created successfully");
    return successResponse(res, 201, 'Goal Created Successfully', goal);

});

//Fetch All Goals of
const getAllGoals = asyncHandler(async (req, res) => {

    const userId = req.user.id;
    const { status, category } = req.query;
    console.log("Fetching all Goals");

    const filter = {
        where: {
            userId: userId,
            ...(category && { category: category.toLowerCase() }),
            ...(status && { status: status.toUpperCase() })
        },
        orderBy:
            { deadline: 'asc' }

    }
    // console.log(prisma.user);
    const userGoals = await prisma.goal.findMany(filter);

    const updatedGoals = await addAddtionalDtls(userGoals);

    return successResponse(res, 200, 'Goals Fetched Successfully', {
        count: updatedGoals.length,
        goals: updatedGoals
    });

});

// Fetch Goals by ID
const getGoalById = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const goalId = req.params.id;


    const goal = await prisma.goal.findFirst({
        where: {
            id: goalId,
            userId: userId
        }
    });

    if (!goal) {
        throw new NotFoundError('Goal not found');
    }
    const updatedGoals = await addAddtionalDtls([goal]);
    return successResponse(res, 200, 'Goal Fetched Successfully', updatedGoals);
})

//Delete Goals by ID
const deleteGoalById = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const goalId = req.params.id;


    const goal = await prisma.goal.findFirst({
        where: {
            id: goalId,
            userId: userId
        }
    });

    if (!goal) {
        throw new NotFoundError('Goal not found');
    }

    await prisma.goal.delete({
        where: {
            id: goalId
        }
    });

    return successResponse(res, 200, 'Goal Deleted Successfully');

})

//Update Goal Progress 
const updateGoalProgress = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const goalId = req.params.id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
        return errorResponse(res, 400, 'Amount should be greater than 0');
    }

    const goalData = await prisma.goal.findFirst({
        where: {
            id: goalId,
            userId: userId
        }
    });

    if (!goalData) {
        throw new NotFoundError('Goal not found');
    }

    const updatedAmount = Number(goalData.currentAmount) + Number(amount);
    let newStatus = goalData.status;

    if (updatedAmount >= Number(goalData.targetAmount) && goalData.status === 'ACTIVE') {
        newStatus = 'COMPLETED';
    }
    const updateData = {
        where: {
            userId,
            id: goalId
        },
        data: {
            currentAmount: updatedAmount,
            status: newStatus
        }
    }

    const updateGoal = await prisma.goal.update(updateData);

    const message = updateData.data.status === 'COMPLETED'
        ? 'Congratulations! Goal achieved! 🎉'
        : 'Progress Updated Successfully';
    return successResponse(res, 200, message, updateGoal);
})


//Update Goal Detials 
const updateGoalDetails = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const goalId = req.params.id;
    const { title, description, targetAmount, deadline, category, priority } = req.body;

    const validatedValues = await validateValuesforUpdate(title, targetAmount, deadline, category);
    if (validatedValues.status === false && validatedValues.message) {
        throw new ValidationError(validatedValues.message);
    }

    const goalExists = await prisma.goal.findFirst({
        where: {
            id: goalId,
            userId: userId
        }
    });
    console.log('Goal Exists', goalExists);
    if (!goalExists) {
        throw new NotFoundError('Goal not found');
    }
    const updateData = {
        data: {
            ...(title && String(title).length > 0 && { title }),
            ...(description && String(description).length > 0 && { description }),
            ...(targetAmount && Number(targetAmount) > 0 && { targetAmount }),
            ...(deadline && new Date(deadline) > new Date() && { deadline: new Date(deadline) }),
            ...(category && String(category).length > 0 && { category }),
            ...(priority && String(priority).length > 0 && { priority })
        }
    }

    const updateGoal = await prisma.goal.update({
        ...updateData,
        where: {
            id: goalId,
            userId: userId
        }
    })
    return successResponse(res, 200, 'Goal Updated Successfully', updateGoal);
})

//Get Goal Statistics

const getGoalStats = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const goalStats = await getGoalStatus(userId);
    return successResponse(res, 200, 'Goal Fetched Successfully', goalStats);
})


module.exports = {
    createGoals,
    getAllGoals,
    getGoalById,
    deleteGoalById,
    updateGoalProgress,
    updateGoalDetails,
    getGoalStats
}


//Helper Functions 

function validateValuesforCreate(title, targetAmount, deadline, category) {
    if (!title) {
        return { status: false, message: 'Title is required' };
    }

    if (!targetAmount || Number(targetAmount) <= 0) {
        return { status: false, message: 'Target amount must be greater than 0' };
    }

    if (!deadline) {
        return { status: false, message: 'Deadline is required' };
    }

    const deadlineDate = new Date(deadline);
    const today = new Date();
    deadlineDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (deadlineDate < today) {
        return { status: false, message: 'Deadline must be in the future' };
    }

    if (!category) {
        return { status: false, message: 'Category is required' };
    }

    return { status: true, message: null };
}

function validateValuesforUpdate(title, targetAmount, deadline, category) {

    if (title !== undefined && (!title || !title.trim())) {
        return { status: false, message: 'Title cannot be empty' };
    }

    // TargetAmount validation
    if (targetAmount !== undefined && (!targetAmount || Number(targetAmount) <= 0)) {
        return { status: false, message: 'Target amount must be greater than 0' };
    }

    // Deadline validation
    if (deadline !== undefined) {
        if (!deadline) {
            return { status: false, message: 'Deadline is required' };
        }
        const deadlineDate = new Date(deadline);
        const today = new Date();
        deadlineDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        if (deadlineDate < today) {
            return { status: false, message: 'Deadline cannot be in the past' };
        }
    }
    // Category validation
    if (category !== undefined && (!category || !category.trim())) {
        return { status: false, message: 'Category cannot be empty' };
    }

    return { status: true, message: null };
}

function addAddtionalDtls(goalsData) {
    return new Promise((resolve, reject) => {
        const updatedGoals = goalsData.map(goal => ({
            ...goal,
            progressPercentage: ((goal.currentAmount / goal.targetAmount) * 100).toFixed(2),
            remaining: goal.targetAmount - goal.currentAmount,
            daysRemaining: Math.ceil((goal.deadline - new Date()) / (1000 * 60 * 60 * 24))
        }));

        resolve(updatedGoals);
    })

}

async function getGoalStatus(userId) {
    const totalGoals = await prisma.goal.count({ where: { userId } });
    const completedGoals = await prisma.goal.count({ where: { userId, status: 'COMPLETED' } });
    const activeGoals = await prisma.goal.count({ where: { userId, status: 'ACTIVE' } });
    const cancelledGoals = await prisma.goal.count({ where: { userId, status: 'CANCELLED' } });

    const totalTargetResult = await prisma.goal.aggregate({
        where: { userId, status: 'ACTIVE' },
        _sum: { targetAmount: true }
    });

    const totalSavedResult = await prisma.goal.aggregate({
        where: { userId, status: 'ACTIVE' },
        _sum: { currentAmount: true }
    });

    const totalTargetAmount = totalTargetResult._sum.targetAmount || 0;
    const totalSavedAmount = totalSavedResult._sum.currentAmount || 0;

    // ✅ Fixed division by zero
    const overallProgress = totalTargetAmount > 0
        ? ((Number(totalSavedAmount) / Number(totalTargetAmount)) * 100).toFixed(2)
        : "0.00";

    const remaining = Number(totalTargetAmount) - Number(totalSavedAmount);

    return {
        totalGoals,
        completedGoals,
        activeGoals,
        cancelledGoals,
        totalTargetAmount: Number(totalTargetAmount),
        totalSavedAmount: Number(totalSavedAmount),
        overallProgress: `${overallProgress}%`,
        remaining: Number(remaining)
    };
}