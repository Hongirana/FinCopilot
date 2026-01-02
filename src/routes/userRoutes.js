const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

//Importing Middleware
const authMiddleware = require('../middleware/authMiddleware');

// Error hanlding middlware 


router.get('/', authMiddleware ,  userController.getUsers);
router.post('/', userController.createUser);
router.get('/:id', authMiddleware, userController.getUserById);

router.get('/me/profile', authMiddleware, userController.getMyProfile);
router.get('/me/stats', authMiddleware, userController.getMyStats);
router.put('/me', authMiddleware, userController.updateMyProfile);
router.put('/me/password', authMiddleware, userController.updatePassword);
router.delete('/me', authMiddleware, userController.deleteMyAccount);


module.exports = router;