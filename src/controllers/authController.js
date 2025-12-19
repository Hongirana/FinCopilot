require('dotenv').config();
const prisma = require('../prismaClient');
const authUtils = require('../utils/authUtils');

exports.login = async (req, res) => {
    try {
        console.log("Inside Login Form");
        const { email, password } = req.body;
        if (!email || !password) { return res.status(400).json({ error: 'email and password required to Login' }); }

        const userData = await prisma.user.findUnique({ where: { email } });
        if (!userData) {
            return res.status(404).json({ error: 'User does not exist' });
        }

        const comparePassword = await authUtils.verifyPassword(password, userData.password);
        if (!comparePassword) {
            return res.status(401).json({ error: 'Invalid Credentials' });
        }

        const payload = {
            email: userData.email,
            id: userData.id,
            name: userData.name
        }
        const jwtToken = await authUtils.generateToken(payload);//jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '1hr' })
        return res.status(200).json({ success: true, title: 'login', message: 'Login Successful', token: jwtToken });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
}

exports.signUp = async (req, res) => {
    try {
        const { email, name, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }
        //Validate Password Strength
        // const {isValid , error} = authUtils.validatePaswordStrength(password);
        // if (!isValid) {
        //     return res.status(400).json({ error: 'Password does not meet strength requirements', details: error });
        // }   
        
        const hashedPassword = await authUtils.hashPassword(password);

        const newUser = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword
            }
        });

        return res.status(201).json({ success: true, id: newUser.id, message: 'User created successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};