require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { error } = require('node:console');
const saltRounds = 10;


function hashPassword(password) {
     return new Promise((resolve, reject) => {
        if (!password) {
            return reject(new Error('Password is required for hashing'));
        }
        resolve(bcrypt.hash(password, saltRounds));
    });
}

function verifyPassword(password, hashedPassword) {

    return new Promise((resolve, reject) => {
        if (!password || !hashedPassword) {
            return reject(new Error('Password and hashed password are required for verification'));
        }
        bcrypt.compare(password, hashedPassword, (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
            
        });
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
        jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
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
    
    passwordRegex.test(password , (error, result) => {
        if (error) {
            return {isValid : false , error : error};
        }
        return {isValid : result , error : null};
    });
}

module.exports = {
    hashPassword,
    verifyPassword,
    generateToken,  
    verifyToken,
    validatePaswordStrength
};  