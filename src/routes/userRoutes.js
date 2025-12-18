const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

//Importing Middleware
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, userController.getUsers);
router.get('/:id', authMiddleware, userController.getUserById);
router.post('/', userController.createUser);

module.exports = router;