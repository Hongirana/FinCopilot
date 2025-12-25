const prisma = require('../prismaClient');
const accountnModel = prisma.account;
// [ ] Functions: `createAccount()`, `getAccountsByUserId()`, `getAccountById()`, `updateAccount()`, `deleteAccount()`.
const createAccount = async (userId, accountData) => {
    return new Promise(async (resolve, reject) => {
        if (!userId) {
            return reject(new Error('User id is required for account creation'));
        }
        resolve(await accountnModel.create(
            {
                data: {
                    userId,
                    name: accountData.name,
                    type: accountData.type,
                    balance: accountData.balance || 0,
                    currency: accountData.currency || 'USD'
                }
            }));
    })

}

const getAccountsByUserId = async (userId) => {
    return new Promise(async (resolve, reject) => {
        if (!userId) {
            return reject(new Error('User id is required for account creation'));
        }

        resolve(await accountnModel.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }));
    })
}

const getAccountById = async (userId, accountId) => {
    return new Promise(async (resolve, reject) => {
        if (!userId || !accountId) {
            return reject(new Error('User id and Account Id  is required for account creation'));
        }

        resolve(await accountnModel.findUnique({ where: { id: accountId, userId } }));
    })
}

const updateAccount = async (userId, accountId, accountData) => {
    return new Promise(async (resolve, reject) => {
        if (!userId || !accountId) {
            return reject(new Error('User id and Account Id  is required for account creation'));
        }
        resolve(await accountnModel.updateMany({ where: { id: accountId, userId }, data: accountData }));
    })
}

const deleteAccount = async (userId) => {
    return new Promise(async (resolve, reject) => {
        if (!userId || !accountId) {
            return reject(new Error('User id and Account Id  is required for account creation'));
        }
        resolve(await accountnModel.deleteMany({ where: { id: accountId, userId } }));
    })
}

module.exports = {
    createAccount,
    getAccountsByUserId,
    getAccountById,
    updateAccount,
    deleteAccount
}