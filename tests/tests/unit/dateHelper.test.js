const {
  getMonthRange,
  getYearRange,
  getMonthName,
  getDaysInMonth,
  validateDateRange,
  validateDatetype
} = require('../../../src/utils/dateHelper');

describe('Date Helper - Unit Tests', () => {
  
  describe('getMonthRange', () => {
    
    test('should return correct month range for January', () => {
      const { startDate, endDate } = getMonthRange(2026, 1);
      
      expect(startDate).toEqual(new Date(2026, 0, 1));
      expect(endDate.getFullYear()).toBe(2026);
      expect(endDate.getMonth()).toBe(0);
      expect(endDate.getDate()).toBe(31);
    });
    
    test('should return correct month range for February', () => {
      const { startDate, endDate } = getMonthRange(2026, 2);
      
      expect(startDate).toEqual(new Date(2026, 1, 1));
      expect(endDate.getDate()).toBe(28); // 2026 is not leap year
    });
    
    test('should handle December correctly', () => {
      const { startDate, endDate } = getMonthRange(2026, 12);
      
      expect(startDate.getMonth()).toBe(11);
      expect(endDate.getDate()).toBe(31);
    });
  });
  
  describe('getYearRange', () => {
    
    test('should return correct year range', () => {
      const { startDate, endDate } = getYearRange(2026);
      
      expect(startDate).toEqual(new Date(2026, 0, 1));
      expect(endDate.getFullYear()).toBe(2026);
      expect(endDate.getMonth()).toBe(11);
      expect(endDate.getDate()).toBe(31);
    });
    
    test('should handle different years', () => {
      const { startDate, endDate } = getYearRange(2025);
      
      expect(startDate.getFullYear()).toBe(2025);
      expect(endDate.getFullYear()).toBe(2025);
    });
  });
  
  describe('getMonthName', () => {
    
    test('should return correct month names', async () => {
      expect(await getMonthName(1)).toBe('January');
      expect(await getMonthName(6)).toBe('June');
      expect(await getMonthName(12)).toBe('December');
    });
    
    test('should handle all months', async () => {
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      for (let i = 1; i <= 12; i++) {
        expect(await getMonthName(i)).toBe(months[i - 1]);
      }
    });
  });
  
  describe('getDaysInMonth', () => {
    
    test('should return correct days for January', async () => {
      const days = await getDaysInMonth(2026, 1);
      expect(days).toBe(31);
    });
    
    test('should return correct days for February non-leap year', async () => {
      const days = await getDaysInMonth(2026, 2);
      expect(days).toBe(28);
    });
    
    test('should return correct days for February leap year', async () => {
      const days = await getDaysInMonth(2024, 2);
      expect(days).toBe(29);
    });
    
    test('should return correct days for April', async () => {
      const days = await getDaysInMonth(2026, 4);
      expect(days).toBe(30);
    });
  });
  
  describe('validateDateRange', () => {
    
    test('should validate correct date range', async () => {
      const result = await validateDateRange('2026-01-01', '2026-01-31');
      expect(result.isValid).toBe(true);
    });
    
    test('should reject invalid date range (start after end)', async () => {
      const result = await validateDateRange('2026-12-31', '2026-01-01');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Start date cannot be after end date');
    });
    
    test('should reject invalid date format', async () => {
      const result = await validateDateRange('invalid-date', '2026-01-31');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Invalid Date Format');
    });
    
    test('should accept Date objects', async () => {
      const start = new Date('2026-01-01');
      const end = new Date('2026-01-31');
      const result = await validateDateRange(start, end);
      expect(result.isValid).toBe(true);
    });
  });
  
  describe('validateDatetype', () => {
    
    test('should validate Date object', () => {
      const date = new Date('2026-01-01');
      expect(validateDatetype(date)).toBe(true);
    });
    
    test('should validate date string', () => {
      expect(validateDatetype('2026-01-01')).toBe(true);
    });
    
    test('should reject invalid date string', () => {
      expect(validateDatetype('invalid-date')).toBe(false);
    });
    
    test('should reject invalid date object', () => {
      expect(validateDatetype(new Date('invalid'))).toBe(false);
    });
    
    test('should reject non-date types', () => {
      expect(validateDatetype(null)).toBe(false);
      expect(validateDatetype(undefined)).toBe(false);
      expect(validateDatetype(12345)).toBe(false);
      expect(validateDatetype({})).toBe(false);
    });
  });
});
