require('dotenv').config();
const prisma = require('../prismaClient');
const authUtils = require('../utils/authUtils');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { asyncHandler } = require('../middleware/errorHandler');
const { NotFoundError, ValidationError, } = require('../utils/customErrors');

exports.login = asyncHandler(async (req, res) => {

    const { email, password } = req.body;
    if (!email || !password) { throw new ValidationError('Email and password are required'); }
    
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
        name: userData.firstName
    }
    const jwtToken = await authUtils.generateToken(payload);
    return successResponse(res, 200, 'Login successful', { token: jwtToken });
})

exports.signUp = asyncHandler(async (req, res) => {

    const { email, firstName, lastName, password } = req.body;

    if (!email || !password) {
        throw new ValidationError('Email and password are required');
    }

    const existingUser = await prisma.user.findFirst({ where: { email: email } });
    if (existingUser) {
        throw new ValidationError('User already exists');
    }
    const userData = {
        email,
        firstName,
        lastName,
        password
    }
    const newUser = await prisma.user.create({
        data: userData,
        select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        baseCurrency: true,
        role: true,
        createdAt: true,
        updatedAt: true
        // ✅ NO password field here!
    }
    });
    return successResponse(res, 201, 'User created successfully', { user: newUser });
});