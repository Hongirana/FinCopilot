require('dotenv').config();
const prisma = require('../prismaClient');
const authUtils = require('../utils/authUtils');
const {successResponse, errorResponse} = require('../utils/responseHelper');
const { asyncHandler } = require('../middleware/errorHandler');
const { NotFoundError, ValidationError, BadRequestError } = require('../utils/customErrors');

exports.login =asyncHandler( async (req, res) => {
    
        console.log("Inside Login Form");
        const { email, password } = req.body;
        if (!email || !password) 
            { throw new BadRequestError('Email and password are required'); }

        const userData = await prisma.user.findUnique({ where: { email } });
        if (!userData) {
            throw new NotFoundError('User not found');
        }

        const comparePassword = await authUtils.verifyPassword(password, userData.password);
        if (!comparePassword) {
            throw new ValidationError('Invalid password');
        }

        const payload = {
            email: userData.email,
            id: userData.id,
            name: userData.name
        }
        const jwtToken = await authUtils.generateToken(payload);
        return successResponse(res, 200, 'Login successful', { token: jwtToken });
})

exports.signUp =asyncHandler( async (req, res) => {
    
        const { email, name, password } = req.body;

        if (!email || !password) {
            throw new BadRequestError('Email and password are required');
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
           throw new ValidationError('User already exists');
        }
        
        const hashedPassword = await authUtils.hashPassword(password);

        const newUser = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword
            }
        });

       return successResponse(res, 201, 'User created successfully', { user: newUser });
});