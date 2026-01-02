const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');
const { transactionValidators, handleValidationErrors } = require('../middleware/validators');


router.get('/', authMiddleware, transactionController.listTransactions);
router.get('/search', authMiddleware, transactionController.searchTransactions);
router.post('/', authMiddleware, transactionValidators.create, handleValidationErrors, transactionController.createTransaction);
router.get('/:id', authMiddleware, transactionController.getTransactionById);
router.put('/:id', authMiddleware, transactionValidators.create, handleValidationErrors, transactionController.updateTransaction);
router.delete('/:id', authMiddleware, transactionController.deleteTransaction);

module.exports = router;