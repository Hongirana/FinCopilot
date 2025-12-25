const prisma = require('../prismaClient');
const transtionModel = require('../models/transaction');
const categorizeTransaction = require('../utils/categorizer');


// exports.getTransactionData = async (req, res) => {
//   try {
//     console.log("Fetching all Transactions");
//     // console.log(prisma.user);
//     const users = await prisma.transaction.findMany({});
//     res.json(users);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// exports.getUserById = async (req, res) => {
//   const id = parseInt(req.params.id, 10);
//   if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
//   try {
//     const user = await prisma.user.findUnique({ where: { id }, include: { profile: true } });
//     if (!user) return res.status(404).json({ error: 'Not found' });
//     res.json(user);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// // exports.createTransaction = async (req, res) => {
//   const { amount, type, description, accountId } = req.body;

//   try {
//     const created = await prisma.transaction.create({
//       data: {
//         amount,
//         type,
//         description,
//         accountId
//       }
//     });
//     res.status(201).json({success: true, message: 'Transaction created successfully', data: created});
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };


let listTransactions = async (req, res) => {
  try {
    const { dateFrom, dateTo, category, merchant, minAmount, maxAmount, search, page, limit } = req.query;

    const dataFromObj = dateFrom ? new Date(dateFrom) : null;
    const dataToObj = dateTo ? new Date(dateTo) : null;

    //Build query
    const query = {
      where: {
        ...(dataFromObj && { date: { gte: dataFromObj } }),
        ...(dataToObj && { date: { lte: dataToObj } }),
        ...(category && { category: category }),
        ...(merchant && { merchant: merchant }),
        ...(minAmount && { amount: { gte: minAmount } }),
        ...(maxAmount && { amount: { lte: maxAmount } }),
        ...(search && { description: { contains: search } })
      }
    }

    //Add pagination. 
    const skip = (page - 1) * limit;
    const pageLimit = limit || 20;

    // query.skip = skip;
    // query.take = pageLimit;

    //Fetch Transactions
    const transactions = await prisma.transaction.findMany({ skip: skip, take: pageLimit, ...query });
    const total = await prisma.transaction.count({ where: { query } });

    //Response to user
    res.json({ success: true, data: transactions, total, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// [ ] Function: `createTransaction(req, res)`
let createTransaction = async (req, res) => {
  const { amount, type, category, merchant, description, date, accountId } = req.body;
  try {

    if (amount < 0) return res.status(400).json({ error: 'Amount cannot be negative' });

    const { TransactionType, Category } = prisma;

    if(!category){ 
        category = await categorizeTransaction(merchant || null , description || null);
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
    const user = await prisma.user.findUnique({ where: { id: accountId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const account = await prisma.account.findUnique({ where: { id: accountId } });
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
        accountId
      }
    });
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

    const transaction = await prisma.transaction.findUnique({ where: { id } });

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
    const transaction = await prisma.transaction.findUnique({ where: { id }, select: { userId: true, accountId: true } });

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
    res.status(200).json({ success: true, message: 'Transaction updated successfully', data: updateData });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  listTransactions,
  createTransaction,
  getTransactionById,
  updateTransaction
}