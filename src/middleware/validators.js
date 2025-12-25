const { body, param, query, validationResult } = require('express-validator');

/**
 * Auth validation rules
 */
const authValidators = {
    signup: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Invalid email address'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters')
            .matches(/[A-Z]/)
            .withMessage('Password must contain uppercase letter')
            .matches(/[0-9]/)
            .withMessage('Password must contain number')
            .matches(/[!@#$%^&*]/)
            .withMessage('Password must contain special character (!@#$%^&*)'),
        body('firstName')
            .trim()
            .notEmpty()
            .withMessage('First name is required'),
        body('lastName')
            .trim()
            .notEmpty()
            .withMessage('Last name is required')
    ],

    login: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Invalid email address'),
        body('password')
            .notEmpty()
            .withMessage('Password is required')
    ]
};

/**
 * Account validation rules
 */
const accountValidators = {
    create: [
        body('name')
            .trim()
            .notEmpty()
            .withMessage('Account name is required')
            .isLength({ max: 100 })
            .withMessage('Account name too long'),
        body('type')
            .isIn(['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'CASH'])
            .withMessage('Invalid account type'),
        body('balance')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Balance must be a positive number'),
        body('currency')
            .optional()
            .isISO4217()
            .withMessage('Invalid currency code')
    ],

    update: [
        body('name')
            .optional()
            .trim()
            .notEmpty()
            .withMessage('Account name cannot be empty'),
        body('type')
            .optional()
            .isIn(['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'CASH'])
            .withMessage('Invalid account type'),
        body('currency')
            .optional()
            .isISO4217()
            .withMessage('Invalid currency code')
    ]
};

/**
 * Transaction validation rules
 */
const transactionValidators = {
    create: [
        body('accountId')
            .notEmpty()
            .withMessage('Account ID is required'),
        body('amount')
            .isFloat({ min: 0.01 })
            .withMessage('Amount must be a positive number'),
        body('type')
            .isIn(['INCOME', 'EXPENSE', 'TRANSFER'])
            .withMessage('Invalid transaction type'),
        body('category')
            .optional()
            .trim(),
        body('description')
            .optional()
            .trim(),
        body('date')
            .optional()
            .isISO8601()
            .withMessage('Invalid date format')
    ]
};

/**
 * Middleware to check validation results
 */
function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Validation failed',
                statusCode: 400,
                errors: errors.array().map(err => ({
                    field: err.param,
                    message: err.msg
                }))
            }
        });
    }

    next();
}

module.exports = {
    authValidators,
    accountValidators,
    transactionValidators,
    handleValidationErrors
};