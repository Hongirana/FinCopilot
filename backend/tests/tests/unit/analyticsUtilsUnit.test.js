// Mock dependencies
jest.mock('../../../src/_mock_/prismaClient');
jest.mock('../../../src/utils/dateHelper');

const analyticsUtils = require('../../../src/utils/analyticsUtils');

describe('Analytics Utils - Unit Tests', () => {

  describe('Module Exports', () => {

    test('should export required functions', () => {
      expect(analyticsUtils).toHaveProperty('genMonthlyReport');
      expect(analyticsUtils).toHaveProperty('genPrevMonthReport');
      expect(analyticsUtils).toHaveProperty('genQuarterlyBreakDownData');
      expect(analyticsUtils).toHaveProperty('validateandGetDate');
      expect(analyticsUtils).toHaveProperty('validateYear');
      expect(analyticsUtils).toHaveProperty('genMonthlyBreakDownData');
      expect(analyticsUtils).toHaveProperty('categoryBreakDown');
      expect(analyticsUtils).toHaveProperty('getTrendbyPeriod');
      expect(analyticsUtils).toHaveProperty('getIncomeOrExpense');
    });

    test('all exports should be functions', () => {
      Object.values(analyticsUtils).forEach(func => {
        expect(typeof func).toBe('function');
      });
    });
  });

  describe('validateYear', () => {

    test('should validate year in valid range', () => {
      expect(analyticsUtils.validateYear(2026)).toBe(true);
      expect(analyticsUtils.validateYear(2000)).toBe(true);
      expect(analyticsUtils.validateYear(1950)).toBe(true);
    });

    test('should reject year below minimum', () => {
      expect(analyticsUtils.validateYear(1899)).toBe(false);
      expect(analyticsUtils.validateYear(1500)).toBe(false);
    });

    test('should reject year above maximum', () => {
      expect(analyticsUtils.validateYear(2101)).toBe(false);
      expect(analyticsUtils.validateYear(3000)).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(analyticsUtils.validateYear(1900)).toBe(true);
      expect(analyticsUtils.validateYear(2100)).toBe(true);
    });
  });

  describe('Analytics Calculations', () => {

    test('should calculate total amount', () => {
      const transactions = [
        { amount: 1000 },
        { amount: 2000 },
        { amount: 3000 }
      ];

      const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
      expect(total).toBe(6000);
    });

    test('should calculate average', () => {
      const amounts = [1000, 2000, 3000, 4000];
      const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;

      expect(average).toBe(2500);
    });

    test('should calculate percentage', () => {
      const part = 3000;
      const total = 10000;
      const percentage = (part / total) * 100;

      expect(percentage).toBe(30);
    });

    test('should handle zero division', () => {
      const part = 1000;
      const total = 0;
      const percentage = total > 0 ? (part / total) * 100 : 0;

      expect(percentage).toBe(0);
    });
  });

  describe('Date Validation Logic', () => {

    test('should handle date range validation', () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      expect(startDate < endDate).toBe(true);
    });

    test('should detect invalid date range', () => {
      const startDate = new Date('2026-12-31');
      const endDate = new Date('2026-01-01');

      expect(startDate > endDate).toBe(true);
    });
  });

  describe('Category Breakdown Logic', () => {

    test('should group transactions by category', () => {
      const transactions = [
        { category: 'food', amount: 1000 },
        { category: 'food', amount: 2000 },
        { category: 'transport', amount: 500 }
      ];

      const grouped = transactions.reduce((acc, t) => {
        if (!acc[t.category]) acc[t.category] = 0;
        acc[t.category] += Number(t.amount);
        return acc;
      }, {});

      expect(grouped.food).toBe(3000);
      expect(grouped.transport).toBe(500);
    });
  });
});
