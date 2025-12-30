const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalsController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, goalController.createGoals );
router.get('/', authMiddleware, goalController.getAllGoals );
router.get('/stats', authMiddleware, goalController.getGoalStats );
router.get('/:id', authMiddleware,  goalController.getGoalById );
router.patch('/:id/progress', authMiddleware,  goalController.updateGoalProgress );
router.put('/:id', authMiddleware,  goalController.updateGoalDetails);
router.delete('/:id', authMiddleware, goalController.deleteGoalById);

module.exports = router;

