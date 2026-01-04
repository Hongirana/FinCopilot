const accountController = require('../controllers/accountController');
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { accountValidators, handleValidationErrors } = require('../middleware/validators');

router.get('/', authMiddleware, accountController.listAccounts);
router.post('/', authMiddleware, ...accountValidators.create, handleValidationErrors, accountController.createAccount);
router.get('/:id', authMiddleware, accountController.getAccount);
router.put('/:id', authMiddleware, ...accountValidators.create, handleValidationErrors, accountController.updateAccount);
router.delete('/:id', authMiddleware, accountController.deleteAccount);

module.exports = router;    