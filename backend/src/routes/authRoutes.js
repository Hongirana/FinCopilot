const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authValidators, handleValidationErrors } = require('../middleware/validators');
const { strictRateLimiter } = require('../middleware/rateLimitMiddleware');

router.post('/login', strictRateLimiter, authValidators.login, handleValidationErrors, authController.login);
router.post('/signUp', strictRateLimiter, authValidators.signUp, handleValidationErrors, authController.signUp);


/* GET /api/auth/me
 */
// router.get('/me', authenticateToken, authController.getCurrentUser);

// /**
//  * POST /api/auth/logou
//  */
// router.post('/logout', authenticateToken, authController.logout);

module.exports = router;