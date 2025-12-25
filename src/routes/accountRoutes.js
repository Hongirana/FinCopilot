const accountController = require('../controllers/accountController');
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, accountController.listAccounts);
router.post('/', authMiddleware, accountController.createAccount);
router.get('/:id', authMiddleware, accountController.getAccount);
router.put('/:id', authMiddleware, accountController.updateAccount);
router.delete('/:id', authMiddleware, accountController.deleteAccount);

module.exports = router;    