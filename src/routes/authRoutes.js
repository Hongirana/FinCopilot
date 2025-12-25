const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authValidators, handleValidationErrors } = require('../middleware/validators');
const { loginLimiter, signupLimiter } = require('../middleware/rateLimiter');

router.post('/login', loginLimiter, authController.login, handleValidationErrors, authValidators.login);
router.post('/signUp', signupLimiter, authController.signUp, handleValidationErrors, authValidators.signup);


/* GET /api/auth/me
 */
// router.get('/me', authenticateToken, authController.getCurrentUser);

// /**
//  * POST /api/auth/logout
//  */
// router.post('/logout', authenticateToken, authController.logout);

module.exports = router;