const prisma = require('../prismaClient');
const bcrypt = require('bcrypt');
const saltRounds = 10;

exports.signUpForm = async (req, res) => {
 try{
  const { email, name, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const newUser = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword
    }
  });

  return res.status(201).json({ message: 'User created successfully' });
}catch (err) {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
}
};
