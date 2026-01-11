const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const authMiddleware = require('../middleware/authMiddleware');
const { budgetValidators, handleValidationErrors } = require('../middleware/validators');

router.post('/recalculate', authMiddleware, budgetController.recalculateBudgets);
router.get('/alerts', authMiddleware, budgetController.budgetAlerts);

router.post('/', authMiddleware, ...budgetValidators.create, handleValidationErrors, budgetController.createBudget);
router.get('/', authMiddleware, budgetController.listUserBudgets);
router.get('/:id', authMiddleware, budgetController.getBudgetById);
router.put('/:id', authMiddleware, ...budgetValidators.update, handleValidationErrors, budgetController.updateBudget);
router.delete('/:id', authMiddleware, budgetController.deleteBudget);
router.post('/recalculate', authMiddleware, budgetController.recalculateBudgets);


module.exports = router;