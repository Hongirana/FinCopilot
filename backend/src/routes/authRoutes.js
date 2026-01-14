const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authValidators, handleValidationErrors } = require('../middleware/validators');
const { strictRateLimiter } = require('../middleware/rateLimitMiddleware');

router.post('/login', strictRateLimiter, authController.login, handleValidationErrors, authValidators.login);
router.post('/signUp', strictRateLimiter, authController.signUp, handleValidationErrors, authValidators.signup);


/* GET /api/auth/me
 */
// router.get('/me', authenticateToken, authController.getCurrentUser);

// /**
//  * POST /api/auth/logout
//  */
// router.post('/logout', authenticateToken, authController.logout);

module.exports = router;