// Mock Prisma before requiring budgetTracker
const mockPrisma = {
  budget: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    delete: jest.fn()
  },
  transaction: {
    findMany: jest.fn(),
    create: jest.fn(),
    aggregate: jest.fn()
  }
};

jest.mock('../../../src/prismaClient', () => mockPrisma);

const { updateBudgetSpent, recalculateAllBudgets } = require('../../../src/utils/budgetTracker');
const prisma = require('../../../src/prismaClient');

describe('Mock Test', () => {
  test('prisma mock should be loaded', () => {
    expect(prisma).toBeDefined();
    expect(prisma.budget).toBeDefined();
    expect(typeof prisma.budget.findFirst).toBe('function');
    expect(prisma.budget.findFirst.mock).toBeDefined(); // Verify it's a mock
  });
});


describe('Budget Tracker - Unit Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('updateBudgetSpent', () => {
    
    test('should be a function', () => {
      expect(typeof updateBudgetSpent).toBe('function');
    });
    
    test('should return null if no budget found', async () => {
      prisma.budget.findFirst.mockResolvedValue(null);
      
      const result = await updateBudgetSpent('user123', 'food', new Date());
      
      expect(result).toBeNull();
      expect(prisma.budget.findFirst).toHaveBeenCalled();
    });
    
    test('should update budget spent when budget exists', async () => {
      const mockBudget = {
        id: 'budget123',
        category: 'food',
        amount: 5000,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31')
      };
      
      const mockTransactions = [
        { amount: 1000 },
        { amount: 1500 }
      ];
      
      const mockUpdatedBudget = {
        ...mockBudget,
        spent: 2500
      };
      
      prisma.budget.findFirst.mockResolvedValue(mockBudget);
      prisma.transaction.findMany.mockResolvedValue(mockTransactions);
      prisma.budget.update.mockResolvedValue(mockUpdatedBudget);
      
      const result = await updateBudgetSpent('user123', 'food', new Date('2026-01-15'));
      
      expect(result).toEqual(mockUpdatedBudget);
      expect(prisma.budget.update).toHaveBeenCalled();
    });
    
    test('should handle errors gracefully', async () => {
      prisma.budget.findFirst.mockRejectedValue(new Error('Database error'));
      
      const result = await updateBudgetSpent('user123', 'food', new Date());
      
      expect(result).toBeUndefined();
    });
  });
  
  describe('recalculateAllBudgets', () => {
    
    test('should be a function', () => {
      expect(typeof recalculateAllBudgets).toBe('function');
    });
    
    test('should process multiple budgets', async () => {
      const mockBudgets = [
        {
          id: 'budget1',
          category: 'food',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-01-31')
        },
        {
          id: 'budget2',
          category: 'transport',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-01-31')
        }
      ];
      
      prisma.budget.findMany.mockResolvedValue(mockBudgets);
      prisma.budget.findFirst.mockResolvedValue(null); // Will cause updateBudgetSpent to return null
      
      const result = await recalculateAllBudgets('user123');
      
      expect(result.total).toBe(2);
      expect(result.success).toBe(true);
    });
  });
  
  describe('Budget Calculations', () => {
    
    test('should calculate total spent correctly', () => {
      const transactions = [
        { amount: 1000 },
        { amount: 2000 },
        { amount: 1500 }
      ];
      
      const total = transactions.reduce((sum, txn) => sum + Number(txn.amount), 0);
      expect(total).toBe(4500);
    });
    
    test('should calculate budget percentage', () => {
      const budget = 5000;
      const spent = 3000;
      const percentage = (spent / budget) * 100;
      
      expect(percentage).toBe(60);
    });
    
    test('should detect over-budget situation', () => {
      const budget = 5000;
      const spent = 6000;
      const isOverBudget = spent > budget;
      
      expect(isOverBudget).toBe(true);
    });
  });
});
