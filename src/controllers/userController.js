const prisma = require('../prismaClient');

exports.getUsers = async (req, res) => {
  try {
    console.log("Fetching all users");
    // console.log(prisma.user);
    const users = await prisma.User.findMany({});
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
    const user = await prisma.user.findUnique({ where: { 'id' : id }});
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createUser = async (req, res) => {
  const { email, name, passwordHash } = req.body;
  if (!email || !passwordHash) return res.status(400).json({ error: 'email and password required' });

  // if (profile && profile.phoneNo != null) {
  //   const phone = String(profile.phoneNo);
  //   if (!/^\d{1,10}$/.test(phone)) {
  //     return res.status(400).json({ error: 'phoneNo must be up to 10 digits (numbers only)' });
  //   }
  // }

  try {
    const created = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash
      }
    });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Server error' });
  }
};