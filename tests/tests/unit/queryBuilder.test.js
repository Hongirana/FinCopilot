const {
  buildTransactionFilters,
  buildDateFilter,
  buildAmountFilter,
  buildSearchFilter,
  buildPaginationParams
} = require('../../../src/utils/queryBuilder');

describe('Query Builder - Unit Tests', () => {
  
  describe('buildPaginationParams', () => {
    
    test('should return default pagination', () => {
      const result = buildPaginationParams();
      
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.skip).toBe(0);
      expect(result.take).toBe(20);
    });
    
    test('should calculate skip correctly', () => {
      const result = buildPaginationParams(2, 10);
      
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.skip).toBe(10);
      expect(result.take).toBe(10);
    });
    
    test('should handle page 3', () => {
      const result = buildPaginationParams(3, 20);
      
      expect(result.skip).toBe(40);
    });
    
    test('should enforce minimum page of 1', () => {
      const result = buildPaginationParams(0, 10);
      expect(result.page).toBe(1);
      
      const result2 = buildPaginationParams(-5, 10);
      expect(result2.page).toBe(1);
    });
    
    test('should enforce maximum limit of 100', () => {
      const result = buildPaginationParams(1, 200);
      expect(result.limit).toBe(100);
    });
    
    test('should enforce minimum limit of 20', () => {
      const result = buildPaginationParams(1, 0);
      expect(result.limit).toBe(20);
    });
  });
  
  describe('buildDateFilter', () => {
    
    test('should return null for no dates', () => {
      const result = buildDateFilter();
      expect(result).toBeNull();
    });
    
    test('should build filter with start date only', () => {
      const result = buildDateFilter('2026-01-01');
      
      expect(result).toHaveProperty('gte');
      expect(result.gte).toBeInstanceOf(Date);
    });
    
    test('should build filter with end date only', () => {
      const result = buildDateFilter(null, '2026-01-31');
      
      expect(result).toHaveProperty('lte');
      expect(result.lte).toBeInstanceOf(Date);
    });
    
    test('should build filter with both dates', () => {
      const result = buildDateFilter('2026-01-01', '2026-01-31');
      
      expect(result).toHaveProperty('gte');
      expect(result).toHaveProperty('lte');
      expect(result.gte).toBeInstanceOf(Date);
      expect(result.lte).toBeInstanceOf(Date);
    });
    
    test('should set start date to beginning of day', () => {
      const result = buildDateFilter('2026-01-15');
      
      expect(result.gte.getHours()).toBe(0);
      expect(result.gte.getMinutes()).toBe(0);
      expect(result.gte.getSeconds()).toBe(0);
    });
    
    test('should set end date to end of day', () => {
      const result = buildDateFilter(null, '2026-01-15');
      
      expect(result.lte.getHours()).toBe(23);
      expect(result.lte.getMinutes()).toBe(59);
      expect(result.lte.getSeconds()).toBe(59);
    });
  });
  
  describe('buildAmountFilter', () => {
    
    test('should return null for no amounts', () => {
      const result = buildAmountFilter();
      expect(result).toBeNull();
    });
    
    test('should build filter with min amount only', () => {
      const result = buildAmountFilter(100);
      
      expect(result).toHaveProperty('gte', 100);
    });
    
    test('should build filter with max amount only', () => {
      const result = buildAmountFilter(null, 5000);
      
      expect(result).toHaveProperty('lte', 5000);
    });
    
    test('should build filter with both amounts', () => {
      const result = buildAmountFilter(100, 5000);
      
      expect(result).toHaveProperty('gte', 100);
      expect(result).toHaveProperty('lte', 5000);
    });
    
    test('should parse string amounts to floats', () => {
      const result = buildAmountFilter('100.50', '5000.75');
      
      expect(result.gte).toBe(100.50);
      expect(result.lte).toBe(5000.75);
    });
  });
  
  describe('buildSearchFilter', () => {
    
    test('should return null for empty search', () => {
      const result = buildSearchFilter('');
      expect(result).toBeNull();
    });
    
    test('should return null for short search (< 3 chars)', () => {
      const result = buildSearchFilter('ab');
      expect(result).toBeNull();
    });
    
    test('should build search filter for valid search', () => {
      const result = buildSearchFilter('coffee');
      
      expect(result).toHaveProperty('OR');
      expect(Array.isArray(result.OR)).toBe(true);
      expect(result.OR.length).toBeGreaterThan(0);
    });
    
    test('should search in description field', () => {
      const result = buildSearchFilter('coffee');
      
      const descriptionFilter = result.OR.find(f => f.description);
      expect(descriptionFilter).toBeDefined();
      expect(descriptionFilter.description.contains).toBe('coffee');
      expect(descriptionFilter.description.mode).toBe('insensitive');
    });
    
    test('should search in merchant field', () => {
      const result = buildSearchFilter('starbucks');
      
      const merchantFilter = result.OR.find(f => f.merchant);
      expect(merchantFilter).toBeDefined();
    });
  });
  
  describe('buildTransactionFilters', () => {
    
    test('should build complete filter object', () => {
      const filters = {
        category: 'food',
        type: 'debit',
        page: 1,
        limit: 20
      };
      
      const result = buildTransactionFilters('user123', filters);
      
      expect(result).toHaveProperty('where');
      expect(result).toHaveProperty('take');
      expect(result).toHaveProperty('skip');
      expect(result.where.userId).toBe('user123');
    });
    
    test('should handle array of categories', () => {
      const filters = {
        category: ['food', 'transport'],
        page: 1,
        limit: 20
      };
      
      const result = buildTransactionFilters('user123', filters);
      
      expect(result.where.AND).toBeDefined();
    });
    
    test('should include date filters', () => {
      const filters = {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        page: 1,
        limit: 20
      };
      
      const result = buildTransactionFilters('user123', filters);
      
      expect(result.where.AND).toBeDefined();
    });
  });
});
