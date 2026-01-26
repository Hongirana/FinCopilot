const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

//Importing Middleware
const authMiddleware = require('../middleware/authMiddleware');

// Validtors middlware 
const { userValidators, handleValidationErrors } = require('../middleware/validators');

// router.get('/', authMiddleware ,  userController.getUsers);
// router.post('/', userController.createUser);


router.get('/me/profile', authMiddleware, userController.getMyProfile);
router.get('/me/stats', authMiddleware, userController.getMyStats);
router.put('/me', authMiddleware, userValidators.updateProfile, handleValidationErrors, userController.updateMyProfile);
router.put('/me/password', authMiddleware,userValidators.updatePassword, handleValidationErrors, userController.updatePassword);
router.delete('/me', authMiddleware, userController.deleteMyAccount);
// router.get('/:id', authMiddleware, userController.getUserById);

module.exports = router;