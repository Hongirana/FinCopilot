const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

router.get('/', transactionController.getTransactionData);
router.get('/:id', transactionController.getUserById);
router.post('/', transactionController.createTransaction);
module.exports = router;