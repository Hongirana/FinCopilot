const prisma = require('../prismaClient');

exports.getTransactionData = async (req, res) => {
  try {
    console.log("Fetching all Transactions");
    // console.log(prisma.user);
    const users = await prisma.transaction.findMany({});
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getUserById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const user = await prisma.user.findUnique({ where: { id }, include: { profile: true } });
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createTransaction = async (req, res) => {
  const { amount, type, description, accountId } = req.body;
  
  try {
    const created = await prisma.transaction.create({
      data: {
        amount,
        type,
        description,
        accountId
      }
    });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
   