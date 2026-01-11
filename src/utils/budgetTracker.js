const prisma = require('../prismaClient');

/**
 * Update budget spent for a specific category and user
 * Call this after creating/updating/deleting expense transactions
 * 
 * How it works:
 * 1. Find active budget for this category and date
 * 2. Calculate total expenses in that category within budget period
 * 3. Update budget.spent with the total
 * 
 * @param {string} userId - User ID
 * @param {string} category - Transaction category (e.g., "food")
 * @param {Date|string} transactionDate - Transaction date
 * @returns {Object|null} Updated budget or null if no budget found
 */
const updateBudgetSpent = async (userId, category, transactionDate) => {
    try {
        const budget = await prisma.budget.findFirst({
            where: {
                userId: userId,
                category: category.toLowerCase(),
                startDate: { lte: transactionDate },
                endDate: { gte: transactionDate }
            }
        });

        if (!budget) {
            console.log(`ℹ️  No budget found for category: ${category} on ${transactionDate}`);
            return null;
        }

        const transactions = await prisma.transaction.findMany({
            where: {
                userId: userId,
                category: category.toLowerCase(),
                type: 'debit',
                date: { gte: budget.startDate, lte: budget.endDate }
            }
        });

         const totalSpent = transactions.reduce((sum, txn) => {
            return sum + Math.abs(Number(txn.amount));
        }, 0);

        //Update budget.spent in database
        const updatedBudget = await prisma.budget.update({
            where: { id: budget.id },
            data: { spent: totalSpent }
        });

        console.log(`✅ Budget updated: ${category} - Spent: ${totalSpent}/${budget.amount}`);

        // Step 5: Check if over budget (log warning)
        const percentSpent = (totalSpent / Number(budget.amount)) * 100;
        if (percentSpent > 100) {
            const overAmount = totalSpent - Number(budget.amount);
            console.log(`⚠️  ALERT: Budget exceeded for ${category}! Over by ${overAmount.toFixed(2)}`);
        } else if (percentSpent >= 80) {
            console.log(`⚠️  WARNING: ${category} budget at ${percentSpent.toFixed(0)}%`);
        }

        return updatedBudget;

    } catch (err) {
        console.error(err);
    }
}



/**
 * Recalculate all budgets for a user
 * Useful for:
 * - Data integrity checks
 * - Fixing incorrect spent values
 * - Bulk updates after data migration
 * 
 * @param {string} userId - User ID
 * @returns {Object} { success: true, count: number }
 */
async function recalculateAllBudgets(userId) {
    try {
        // Get all budgets for user
        const budgets = await prisma.budget.findMany({
            where: { userId }
        });

        console.log(`🔄 Recalculating ${budgets.length} budgets for user ${userId}...`);

        let successCount = 0;

        // Loop through each budget and recalculate
        for (const budget of budgets) {
            try {
                // Use middle date of budget period for recalculation
                const middleDate = new Date(
                    (budget.startDate.getTime() + budget.endDate.getTime()) / 2
                );
                
                await updateBudgetSpent(userId, budget.category, middleDate);
                successCount++;
            } catch (error) {
                console.error(`Failed to recalculate budget ${budget.id}:`, error);
            }
        }

        console.log(`✅ Recalculated ${successCount}/${budgets.length} budgets successfully`);
        
        return { 
            success: true, 
            total: budgets.length,
            successful: successCount,
            failed: budgets.length - successCount
        };

    } catch (error) {
        console.error('Error recalculating budgets:', error);
        throw error;
    }
}

module.exports = {
    updateBudgetSpent,
    recalculateAllBudgets
};