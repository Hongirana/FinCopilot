const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');
const { transactionValidators, handleValidationErrors } = require('../middleware/validators');
// router.get('/', transactionController.getTransactionData);
// router.get('/:id', transactionController.getUserById);
// router.post('/', transactionController.createTransaction);

// GET /api/transactions?dateFrom=...&dateTo=...&category=...` → `listTransactions`.
//   - [ ] `POST /api/transactions` → `createTransaction`.
//   - [ ] `GET /api/transactions/:id` → `getTransactionById`.
//   - [ ] `PUT /api/transactions/:id` → `updateTransaction`.

router.get('/', authMiddleware, transactionController.listTransactions);
router.post('/', authMiddleware, transactionValidators.create, handleValidationErrors, transactionController.createTransaction);
router.get('/:id', authMiddleware, transactionController.getTransactionById);
router.put('/:id', authMiddleware, transactionValidators.create, handleValidationErrors, transactionController.updateTransaction);

module.exports = router;