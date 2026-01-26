// require('dotenv').config();
require('dotenv').config( { path: '.env.test' } );
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const saltRounds = 10;


async function hashPassword(password) {
    if (!password) {
        throw new Error('Password is required for hashing');
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
}

async function verifyPassword(password, hashedPassword) {
    return new Promise(async (resolve, reject) => {
        if (!password || !hashedPassword) {
            return reject(new Error('Password and hashed password are required for verification'));
        }
        const comparePassword = await bcrypt.compare(password, hashedPassword);
        resolve(comparePassword);
    });
}

function generateToken(payload) {
    return new Promise((resolve, reject) => {
        if (!payload) {
            return reject(new Error('Payload is required to generate token'));
        }
        resolve(jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '1hr' }));
    });
}

function verifyToken(token) {
   
    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.JWT_SECRET_KEY || 'test-secret-key-fincopilot-2026' , (err, decoded) => {
            if (err) {
                resolve(false);
            }
            resolve(decoded);
        });
    });
}

function validatePaswordStrength(password) {
    // Example: Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number and one special character
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;

    passwordRegex.test(password, (error, result) => {
        if (error) {
            return { isValid: false, error: error };
        }
        return { isValid: result, error: null };
    });
}

module.exports = {
    hashPassword,
    verifyPassword,
    generateToken,
    verifyToken,
    validatePaswordStrength
};  