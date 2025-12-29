const router = express.Router();
const budgetController = require('../controllers/budgetController');
const authMiddleware = require('../middleware/authMiddleware');


router.post('/recalculate', authMiddleware, budgetController.recalculateBudgets);
router.get('/alerts', authMiddleware, budgetController.budgetAlerts);

router.post('/', authMiddleware, budgetController.createBudget);
router.get('/', authMiddleware, budgetController.listUserBudgets);
router.get('/:id', authMiddleware, budgetController.getBudgetById);
router.put('/:id', authMiddleware, budgetController.updateBudget);
router.delete('/:id', authMiddleware, budgetController.deleteBudget);

module.exports = router;