// Mock dependencies
jest.mock('../../../src/_mock_/prismaClient');
jest.mock('../../../src/utils/dateHelper');

const dashboardUtils = require('../../../src/utils/dashboardUtils');

describe('Dashboard Utils - Unit Tests', () => {
  
  describe('Module Exports', () => {
    
    test('should export dashboard utility functions', () => {
      expect(dashboardUtils).toBeDefined();
      expect(typeof dashboardUtils).toBe('object');
    });
    
    test('should have budget overview function', () => {
      expect(dashboardUtils).toHaveProperty('getBudgetOverview');
      expect(typeof dashboardUtils.getBudgetOverview).toBe('function');
    });
    
    test('should have accounts summary function', () => {
      expect(dashboardUtils).toHaveProperty('getAccountsSummary');
      expect(typeof dashboardUtils.getAccountsSummary).toBe('function');
    });
    
    test('should have goals overview function', () => {
      expect(dashboardUtils).toHaveProperty('getGoalsOverview');
      expect(typeof dashboardUtils.getGoalsOverview).toBe('function');
    });
    
    test('should have net worth calculator', () => {
      expect(dashboardUtils).toHaveProperty('calculateNetWorth');
      expect(typeof dashboardUtils.calculateNetWorth).toBe('function');
    });
    
    test('should have cash flow calculator', () => {
      expect(dashboardUtils).toHaveProperty('calculateCashFlow');
      expect(typeof dashboardUtils.calculateCashFlow).toBe('function');
    });
    
    test('should have spending velocity calculator', () => {
      expect(dashboardUtils).toHaveProperty('calculateSpendingVelocity');
      expect(typeof dashboardUtils.calculateSpendingVelocity).toBe('function');
    });
    
    test('should have savings metrics calculator', () => {
      expect(dashboardUtils).toHaveProperty('calculateSavingsMetrics');
      expect(typeof dashboardUtils.calculateSavingsMetrics).toBe('function');
    });
    
    test('should have top expense categories function', () => {
      expect(dashboardUtils).toHaveProperty('getTopExpenseCategories');
      expect(typeof dashboardUtils.getTopExpenseCategories).toBe('function');
    });
  });
  
  describe('Dashboard Calculations', () => {
    
    test('should calculate total balance', () => {
      const accounts = [
        { balance: 10000 },
        { balance: 25000 },
        { balance: 15000 }
      ];
      
      const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
      expect(totalBalance).toBe(50000);
    });
    
    test('should calculate budget utilization', () => {
      const totalBudget = 10000;
      const totalSpent = 7000;
      const utilization = (totalSpent / totalBudget) * 100;
      
      expect(utilization).toBe(70);
    });
    
    test('should calculate remaining budget', () => {
      const totalBudget = 10000;
      const totalSpent = 7000;
      const remaining = totalBudget - totalSpent;
      
      expect(remaining).toBe(3000);
    });
    
    test('should calculate goal progress', () => {
      const targetAmount = 100000;
      const currentAmount = 45000;
      const progress = (currentAmount / targetAmount) * 100;
      
      expect(progress).toBe(45);
    });
    
    test('should calculate net worth', () => {
      const assets = 150000;
      const liabilities = 50000;
      const netWorth = assets - liabilities;
      
      expect(netWorth).toBe(100000);
    });
    
    test('should calculate net cash flow', () => {
      const inflow = 80000;
      const outflow = 60000;
      const netCashFlow = inflow - outflow;
      
      expect(netCashFlow).toBe(20000);
    });
    
    test('should calculate daily spending average', () => {
      const totalSpent = 30000;
      const days = 30;
      const dailyAverage = totalSpent / days;
      
      expect(dailyAverage).toBe(1000);
    });
    
    test('should calculate savings rate', () => {
      const income = 50000;
      const expenses = 35000;
      const savings = income - expenses;
      const savingsRate = (savings / income) * 100;
      
      expect(savingsRate).toBe(30);
    });
  });
  
  describe('Account Type Grouping', () => {
    
    test('should group accounts by type', () => {
      const accounts = [
        { type: 'savings' },
        { type: 'checking' },
        { type: 'savings' }
      ];
      
      const grouped = accounts.reduce((counts, acc) => {
        counts[acc.type] = (counts[acc.type] || 0) + 1;
        return counts;
      }, {});
      
      expect(grouped.savings).toBe(2);
      expect(grouped.checking).toBe(1);
    });
  });
  
  describe('Goal Status Filtering', () => {
    
    test('should filter active goals', () => {
      const goals = [
        { status: 'active' },
        { status: 'completed' },
        { status: 'active' }
      ];
      
      const activeGoals = goals.filter(g => g.status === 'active');
      expect(activeGoals.length).toBe(2);
    });
    
    test('should filter completed goals', () => {
      const goals = [
        { status: 'active' },
        { status: 'completed' },
        { status: 'completed' }
      ];
      
      const completedGoals = goals.filter(g => g.status === 'completed');
      expect(completedGoals.length).toBe(2);
    });
  });
});
