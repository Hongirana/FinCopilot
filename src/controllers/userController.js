const prisma = require('../prismaClient');
const bcrypt = require('bcrypt');
const saltRounds = 10;

exports.getUsers = async (req, res) => {
  try {
    console.log("Fetching all users");
    // console.log(prisma.user);
    const users = await prisma.user.findMany({});
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getUserById = async (req, res) => {
  const id = req.params.id;
  // if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const user = await prisma.user.findUnique({ where: { 'id': id } });
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const passwordHash = await bcrypt.hash(password, saltRounds);
    const created = await prisma.user.create({
      data: {
        email,
        name,
        password: passwordHash
      }
    });
    res.status(201).json({success: true, message: 'User created successfully', data: created});
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Server error' });
  }
};