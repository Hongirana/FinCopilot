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
                    currency: accountData.currency || 'INR'
                }
            }));
    })

}

const getAccountsByUserId = async (userId) => {
    return new Promise(async (resolve, reject) => {
        if (!userId) {
            return reject(new Error('User id is required for account creation'));
        }
        const accounts = await accountnModel.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
        const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
        const totalAccounts = accounts.length;
        resolve({ totalAccounts, totalBalance, accounts });
    })
}

const getAccountById = async (accountId, userId) => {
    return new Promise(async (resolve, reject) => {
        if (!userId || !accountId) {
            return reject(new Error('User id and Account Id  is required for account creation'));
        }
        const account = await accountnModel.findFirst({ where: { id: accountId, userId } });
        resolve(account);
    })
}

const updateAccount = async (accountId, userId, accountData) => {
    return new Promise(async (resolve, reject) => {
        if (!userId || !accountId) {
            return reject(new Error('User id and Account Id  is required for account creation'));
        }
        resolve(await accountnModel.updateMany({ where: { id: accountId, userId }, data: accountData }));
    })
}

const deleteAccount = async (accountId , userId) => {
    return new Promise(async (resolve, reject) => {
        if (!userId || !accountId) {
            return reject(new Error('User id and Account Id  is required for account creation'));
        }
        const accountExist = await accountnModel.findFirst({ where: { id: accountId, userId } });
        if (!accountExist) {
            resolve(false);
        }
        await accountnModel.deleteMany({ where: { id: accountId, userId } });
        resolve(true);
    })
}

module.exports = {
    createAccount,
    getAccountsByUserId,
    getAccountById,
    updateAccount,
    deleteAccount
}