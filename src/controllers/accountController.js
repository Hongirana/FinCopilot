const accountModel = require('../models/accountModel');


async function listAccounts(req, res, next) {
    try {
        const userId = req.user.id;
        const accounts = await accountModel.getAccountsByUserId(userId);
        //sendSuccess(res, 200, 'Accounts fetched successfully', { accounts });
        res.status(200).json({ success: true, message: 'Accounts fetched successfully', data: accounts });
    } catch (err) {
        next(err);
    }
}

async function createAccount(req, res, next) {
    try {
        const userId = req.user.id;
        const { name, type, balance, currency } = req.body;

        // Validate required fields
        if (!name || !type) {
            return res.status(400).json({ error: 'Name and type are required' });//sendError(res, 400, 'Name and type are required');
        }

        // Validate account type
        const validTypes = ['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'CASH'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: `Invalid account type. Must be: ${validTypes.join(', ')}` });//sendError(res, 400, `Invalid account type. Must be: ${validTypes.join(', ')}`);
        }

        // Validate balance
        if (balance !== undefined && (typeof balance !== 'number' || balance < 0)) {
            return res.status(400).json({ error: 'Balance must be a positive number' });//sendError(res, 400, 'Balance must be a positive number');
        }

        // Create account
        const account = await accountModel.createAccount(userId, {
            name,
            type,
            balance: balance || 0,
            currency: currency || 'USD'
        });

        //sendSuccess(res, 201, 'Account created successfully', { account });
        res.status(201).json({ success: true, message: 'Account created successfully', data: account });

    } catch (err) {
        next(err);
    }
}


async function getAccount(req, res, next) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const account = await accountModel.getAccountById(id, userId);

        if (!account) {
            return res.status(404).json({ error: 'Account not found' });//sendError(res, 404, 'Account not found');
        }

        // sendSuccess(res, 200, 'Account fetched successfully', { account });
        res.status(200).json({ success: true, message: 'Account fetched successfully', data: account });
    } catch (err) {
        next(err);
    }
}


async function updateAccount(req, res, next) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { name, type, currency } = req.body;

        // Verify account exists and belongs to user
        const account = await accountModel.getAccountById(id, userId);
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });//sendError(res, 404, 'Account not found');
        }

        // Build update data
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (type !== undefined) updateData.type = type;
        if (currency !== undefined) updateData.currency = currency;

        // Update account
        await accountModel.updateAccount(id, userId, updateData);

        // Fetch updated account
        const updatedAccount = await accountModel.getAccountById(id, userId);

        //sendSuccess(res, 200, 'Account updated successfully', { account: updatedAccount });
        res.status(200).json({ success: true, message: 'Account updated successfully', data: updatedAccount });
    } catch (err) {
        next(err);
    }
}

/**
 * Delete account
 * DELETE /api/accounts/:id
 */
async function deleteAccount(req, res, next) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Verify account exists and belongs to user
        const account = await accountModel.getAccountById(id, userId);
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });//sendError(res, 404, 'Account not found');
        }

        // Delete account
        await accountModel.deleteAccount(id, userId);

        //sendSuccess(res, 200, 'Account deleted successfully');
        res.status(200).json({ success: true, message: 'Account deleted successfully' });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    listAccounts,
    createAccount,
    getAccount,
    updateAccount,
    deleteAccount
}