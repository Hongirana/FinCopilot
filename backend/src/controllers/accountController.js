const prisma = require('../prismaClient');
const accountModel = require('../models/accountModel');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { asyncHandler } = require('../middleware/errorHandler');
const { NotFoundError, ValidationError, BadRequestError  } = require('../utils/customErrors');
const { invalidateUserCache } = require('../services/cacheService');


const listAccounts = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const accounts = await accountModel.getAccountsByUserId(userId);
  
    return successResponse(res, 200, 'Accounts fetched successfully', accounts);
})

const createAccount = asyncHandler(async (req, res, next) => {

    const userId = req.user.id;
    const { name, type, balance, currency } = req.body;

    // Validate required fields
    if (!name || !type) {
        throw new ValidationError('Missing required fields');
    }

    // Validate account type
    const validTypes = ['checking', 'savings', 'credit_card', 'investment', 'cash'];
    if (!validTypes.includes(type)) {
        throw new ValidationError('Invalid account type');
    }

    // Validate balance
    if (balance !== undefined && (typeof balance !== 'number' || balance < 0)) {
        throw new ValidationError('Invalid balance');
    }

    // Create account
    const account = await accountModel.createAccount(userId, {
        name,
        type,
        balance: balance || 0,
        currency: currency || 'INR'
    });
    await invalidateUserCache(userId);
    //sendSuccess(res, 201, 'Account created successfully', { account });
    return successResponse(res, 201, 'Account created successfully', { account });
})


const getAccount = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const { id } = req.params;

    const account = await accountModel.getAccountById(id, userId);
    if (!account) {
        throw new NotFoundError('Account not found or does not belong to you');
    }
    // sendSuccess(res, 200, 'Account fetched successfully', { account });
    return successResponse(res, 200, 'Account fetched successfully', { account} );
})


const updateAccount = asyncHandler(async (req, res, next) => {

    const userId = req.user.id;
    const { id } = req.params;
    const { name , type , bankName , currency , balance} = req.body;

    // Verify account exists and belongs to user
    const account = await accountModel.getAccountById(id, userId);
    if (!account) {
        throw new NotFoundError('Account not found or does not belong to you');
    }

    if (name === undefined && type === undefined && bankName === undefined && currency === undefined && balance === undefined) {
        throw new ValidationError('At least one field must be provided for update');
    }

    if (balance !== undefined) {
        console.warn(`[Security] User ${userId} attempted to update restricted field 'balance'. Blocked.`);
        return errorResponse(res, 403, 'Balance cannot be updated directly. Use transactions instead.');
    }

    const updateData = {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(bankName !== undefined && { bankName }),
        ...(currency !== undefined && { currency })
    };
    // Update account
    await accountModel.updateAccount(id, userId, updateData);

    // Fetch updated account
    const updatedAccount = await accountModel.getAccountById(id, userId);
    
    await invalidateUserCache(userId);
    //sendSuccess(res, 200, 'Account updated successfully', { account: updatedAccount });
    return successResponse(res, 200, 'Account updated successfully', { account : updatedAccount });
})

/**
 * Delete account
 * DELETE /api/accounts/:id
 */
const deleteAccount = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const { id } = req.params;
    // Verify account exists and belongs to user
    const account = await accountModel.getAccountById(id, userId);
    if (!account) {
        throw new NotFoundError('Account not found or does not belong to you');
    }

    const transactionCount = await prisma.transaction.count({
        where: { accountId: id }
    });

    if (transactionCount > 0) {
        throw new BadRequestError('Cannot delete account with existing transactions');
    }

    // Delete account
    await accountModel.deleteAccount(id, userId);
    await invalidateUserCache(userId);
    //sendSuccess(res, 200, 'Account deleted successfully');
    return successResponse(res, 200, 'Account deleted successfully');

})

module.exports = {
    listAccounts,
    createAccount,
    getAccount,
    updateAccount,
    deleteAccount
}