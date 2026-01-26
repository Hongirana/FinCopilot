const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/customErrors');
/**
 * Handle validation errors
 * Converts express-validator errors to custom ValidationError
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  console.log('Validation errors from Validator:', errors.array());
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
      location: err.location
    }));

    throw new ValidationError('Validation failed with Data', formattedErrors);
  }

  next();
}

/**
 * Auth validation rules
 */
const authValidators = {
  signUp: [
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
      .notEmpty()
      .withMessage('Account type is required')
      .isIn(['checking', 'savings', 'credit_card', 'investment', 'cash'])
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
    param('id')
      .isUUID()
      .withMessage('Invalid account ID format'),

    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Account name cannot be empty'),

    body('type')
      .optional()
      .isIn(['checking', 'savings', 'credit_card', 'investment', 'cash'])
      .withMessage('Invalid account type'),

    body('currency')
      .optional()
      .isISO4217()
      .withMessage('Invalid currency code'),

    body('bankName')
    .optional()
    .trim()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Bank name too long')
  ],

  getById: [
    param('id')
      .isUUID()
      .withMessage('Invalid account ID format')
  ],

  delete: [
    param('id')
      .isUUID()
      .withMessage('Invalid account ID format')
  ]
};

/**
 * Transaction validation rules - ENHANCED
 */
const transactionValidators = {
  create: [
  body('accountId')
    .notEmpty()
    .withMessage('Account ID is required')
    .isUUID()
    .withMessage('Invalid account ID format'),

  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number greater than 0')
    .toFloat(),

  body('type')
    .notEmpty()
    .withMessage('Transaction type is required')
    .isIn(['debit', 'credit'])
    .withMessage('Type must be either debit or credit'),

  body('category')
    .optional()  // ✅ CHANGED: Make category optional for AI auto-categorization
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),

  body('merchant')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Merchant name too long (max 100 characters)'),

  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description too long (max 500 characters)'),

  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format. Use ISO 8601 format (YYYY-MM-DD)')
    .custom((value) => {
      const inputDate = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (inputDate > today) {
        throw new Error('Transaction date cannot be in the future');
      }
      return true;
    })
    .toDate()
],

  update: [
    param('id')
      .isUUID()
      .withMessage('Invalid transaction ID format'),

    body('amount')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be a positive number')
      .toFloat(),

    body('type')
      .optional()
      .isIn(['credit', 'debit'])
      .withMessage('Type must be either income or expense'),

    body('category')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Category must be between 2 and 50 characters'),

    body('merchant')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Merchant name too long'),

    body('description')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description too long'),

    body('date')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format')
      .custom((value) => {
        if (new Date(value) > new Date()) {
          throw new Error('Date cannot be in the future');
        }
        return true;
      })
      .toDate()
  ],

  list: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),

    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format')
      .toDate(),

    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format')
      .custom((value, { req }) => {
        if (req.query.startDate && new Date(value) < new Date(req.query.startDate)) {
          throw new Error('End date must be after start date');
        }
        return true;
      })
      .toDate(),

    query('minAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum amount must be non-negative')
      .toFloat(),

    query('maxAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum amount must be non-negative')
      .custom((value, { req }) => {
        if (req.query.minAmount && parseFloat(value) < parseFloat(req.query.minAmount)) {
          throw new Error('Maximum amount must be greater than minimum amount');
        }
        return true;
      })
      .toFloat(),

    query('type')
      .optional()
      .isIn(['credit', 'debit'])
      .withMessage('Type must be income or expense'),

    query('search')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Search term must be between 3 and 100 characters'),

    query('sortBy')
      .optional()
      .isIn(['date', 'amount', 'category', 'merchant'])
      .withMessage('Invalid sort field'),

    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc')
  ],

  getById: [
    param('id')
      .isUUID()
      .withMessage('Invalid transaction ID format')
  ],

  delete: [
    param('id')
      .isUUID()
      .withMessage('Invalid transaction ID format')
  ]
};

/**
 * Budget validation rules - NEW
 */
const budgetValidators = {
  create: [
    body('category')
      .notEmpty()
      .withMessage('Category is required')
      .isString()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Category must be between 2 and 50 characters'),

    body('amount')
      .notEmpty()
      .withMessage('Budget amount is required')
      .isFloat({ min: 0.01 })
      .withMessage('Budget amount must be positive')
      .toFloat(),

    body('period')
      .notEmpty()
      .withMessage('Period is required')
      .isIn(['MONTHLY', 'WEEKLY', 'YEARLY', 'CUSTOM'])
      .withMessage('Period must be monthly, weekly, yearly, or custom'),

    body('startDate')
      .if(body('period').equals('custom'))
      .notEmpty()
      .withMessage('Start date required for custom period')
      .isISO8601()
      .withMessage('Invalid start date format')
      .toDate(),

    body('endDate')
      .if(body('period').equals('custom'))
      .notEmpty()
      .withMessage('End date required for custom period')
      .isISO8601()
      .withMessage('Invalid end date format')
      .custom((value, { req }) => {
        if (req.body.startDate && new Date(value) <= new Date(req.body.startDate)) {
          throw new Error('End date must be after start date');
        }
        return true;
      })
      .toDate(),

    body('alertThreshold')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Alert threshold must be between 0 and 100')
      .toFloat()
  ],

  update: [
    param('id')
      .isUUID()
      .withMessage('Invalid budget ID format'),

    body('limit')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Budget limit must be positive')
      .toFloat(),

    body('alertThreshold')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Alert threshold must be between 0 and 100')
      .toFloat()
  ],

  getById: [
    param('id')
      .isUUID()
      .withMessage('Invalid budget ID format')
  ],

  delete: [
    param('id')
      .isUUID()
      .withMessage('Invalid budget ID format')
  ]
};

/**
 * Goal validation rules - NEW
 */
const goalValidators = {
  create: [
    body('name')
      .notEmpty()
      .withMessage('Goal name is required')
      .isString()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Goal name must be between 3 and 100 characters'),

    body('targetAmount')
      .notEmpty()
      .withMessage('Target amount is required')
      .isFloat({ min: 1 })
      .withMessage('Target amount must be at least 1')
      .toFloat(),

    body('currentAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Current amount must be non-negative')
      .custom((value, { req }) => {
        if (req.body.targetAmount && parseFloat(value) > parseFloat(req.body.targetAmount)) {
          throw new Error('Current amount cannot exceed target amount');
        }
        return true;
      })
      .toFloat(),

    body('deadline')
      .notEmpty()
      .withMessage('Deadline is required')
      .isISO8601()
      .withMessage('Invalid deadline format')
      .custom((value) => {
        const deadline = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (deadline <= today) {
          throw new Error('Deadline must be in the future');
        }
        return true;
      })
      .toDate(),

    body('category')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Category too long'),

    body('description')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description too long')
  ],

  update: [
    param('id')
      .isUUID()
      .withMessage('Invalid goal ID format'),

    body('name')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Goal name must be between 3 and 100 characters'),

    body('targetAmount')
      .optional()
      .isFloat({ min: 1 })
      .withMessage('Target amount must be positive')
      .toFloat(),

    body('currentAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Current amount must be non-negative')
      .toFloat(),

    body('deadline')
      .optional()
      .isISO8601()
      .withMessage('Invalid deadline format')
      .toDate(),

    body('status')
      .optional()
      .isIn(['active', 'completed', 'cancelled'])
      .withMessage('Status must be active, completed, or cancelled')
  ],

  getById: [
    param('id')
      .isUUID()
      .withMessage('Invalid goal ID format')
  ],

  delete: [
    param('id')
      .isUUID()
      .withMessage('Invalid goal ID format')
  ]
};

/**
 * User Profile validation rules - NEW
 */
const userValidators = {
  updateProfile: [
    // First Name validation
    body('firstName')
      .optional()
      .isString()
      .withMessage('First name must be a string')
      .trim()
      .notEmpty()
      .withMessage('First name cannot be empty')
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s'-]+$/)
      .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),

    // Last Name validation
    body('lastName')
      .optional()
      .isString()
      .withMessage('Last name must be a string')
      .trim()
      .notEmpty()
      .withMessage('Last name cannot be empty')
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s'-]+$/)
      .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),

    // Email validation (optional - should be restricted for security)
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email format')
      .isLength({ max: 100 })
      .withMessage('Email too long'),

    // Base Currency validation
    body('baseCurrency')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 3, max: 3 })
      .withMessage('Currency code must be 3 characters (e.g., INR, USD)')
      .isISO4217()
      .withMessage('Invalid currency code (use ISO 4217 codes like INR, USD, EUR)'),

    // Monthly Salary validation
    body('monthlySalary')
      .optional()
      .isFloat({ min: 0, max: 99999999.99 })
      .withMessage('Monthly salary must be a positive number (max: 99,999,999.99)')
      .toFloat(),

    // Phone Number validation
    body('phoneNo')
      .optional()
      .isString()
      .trim()
      .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/)
      .withMessage('Invalid phone number format (e.g., +919876543210, 9876543210)')
      .isLength({ min: 10, max: 15 })
      .withMessage('Phone number must be between 10 and 15 digits'),

    // Payday validation
    body('payday')
      .optional()
      .isInt({ min: 1, max: 28 })
      .withMessage('Payday must be a number between 1 and 28')
      .toInt(),

    // ✅ SECURITY: Block restricted fields
    body('password')
      .not().exists()
      .withMessage('Cannot update password here. Use /api/users/me/password endpoint'),

    body('role')
      .not().exists()
      .withMessage('Cannot update role. Contact administrator'),

    body('id')
      .not().exists()
      .withMessage('Cannot update user ID'),

    body('createdAt')
      .not().exists()
      .withMessage('Cannot modify creation date'),

    body('updatedAt')
      .not().exists()
      .withMessage('Updated date is automatically managed'),

    // ✅ Reject unknown fields
    body().custom((value, { req }) => {
      const allowedFields = [
        'firstName', 
        'lastName', 
        'email', 
        'baseCurrency', 
        'monthlySalary', 
        'phoneNo', 
        'payday'
      ];
      
      const receivedFields = Object.keys(req.body);
      const invalidFields = receivedFields.filter(field => !allowedFields.includes(field));
      
      if (invalidFields.length > 0) {
        throw new Error(`Invalid fields: ${invalidFields.join(', ')}. Allowed fields: ${allowedFields.join(', ')}`);
      }
      
      return true;
    })
  ],

  updatePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),

    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/[A-Z]/)
      .withMessage('New password must contain uppercase letter')
      .matches(/[a-z]/)
      .withMessage('New password must contain lowercase letter')
      .matches(/[0-9]/)
      .withMessage('New password must contain number')
      .matches(/[!@#$%^&*]/)
      .withMessage('New password must contain special character (!@#$%^&*)')
      .custom((value, { req }) => {
        if (value === req.body.currentPassword) {
          throw new Error('New password must be different from current password');
        }
        return true;
      })
  ],

  deleteAccount: [
    body('password')
      .notEmpty()
      .withMessage('Password is required to delete account'),

    body('confirmationText')
      .notEmpty()
      .withMessage('Confirmation text is required')
      .equals('DELETE ACCOUNT')
      .withMessage('Confirmation text must be exactly "DELETE ACCOUNT"')
  ]
};


module.exports = {
  handleValidationErrors,
  authValidators,
  accountValidators,
  transactionValidators,
  budgetValidators,
  goalValidators,
  userValidators
};
