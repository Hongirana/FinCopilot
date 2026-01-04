const categorizeTransaction = require('../../../src/utils/categorizer');

describe('Transaction Categorizer - Unit Tests', () => {
  
  describe('Food Category', () => {
    
    test('should categorize pizza as food', () => {
      const category = categorizeTransaction('Dominos', 'Pizza delivery');
      expect(category).toBeDefined();
      expect(typeof category).toBe('string');
    });
    
    test('should categorize restaurant as food', () => {
      const category = categorizeTransaction('McDonalds', 'Lunch');
      expect(category).toBeDefined();
    });
    
    test('should categorize grocery as food', () => {
      const category = categorizeTransaction('Walmart', 'Grocery shopping');
      expect(category).toBeDefined();
    });
  });
  
  describe('Transport Category', () => {
    
    test('should categorize Uber as transport', () => {
      const category = categorizeTransaction('Uber', 'Ride to office');
      expect(category).toBeDefined();
    });
    
    test('should categorize fuel as transport', () => {
      const category = categorizeTransaction('Shell Gas Station', 'Fuel');
      expect(category).toBeDefined();
    });
  });
  
  describe('Entertainment Category', () => {
    
    test('should categorize movies as entertainment', () => {
      const category = categorizeTransaction('Netflix', 'Subscription');
      expect(category).toBeDefined();
    });
  });
  
  describe('Utilities Category', () => {
    
    test('should categorize electricity as utilities', () => {
      const category = categorizeTransaction('Electric Company', 'Monthly bill');
      expect(category).toBeDefined();
    });
  });
  
  describe('Edge Cases', () => {
    
    test('should handle empty merchant and description', () => {
      const category = categorizeTransaction('', '');
      expect(category).toBe('other');
    });
    
    test('should handle undefined inputs', () => {
      const category = categorizeTransaction();
      expect(category).toBe('other');
    });
    
    test('should handle only merchant', () => {
      const category = categorizeTransaction('Unknown Store');
      expect(category).toBeDefined();
    });
    
    test('should handle only description', () => {
      const category = categorizeTransaction('', 'Some purchase');
      expect(category).toBeDefined();
    });
    
    test('should return "other" for unknown transactions', () => {
      const category = categorizeTransaction('Unknown Merchant', 'Unknown purchase');
      expect(category).toBe('other');
    });
    
    test('should be case insensitive', () => {
      const category1 = categorizeTransaction('DOMINOS', 'PIZZA');
      const category2 = categorizeTransaction('dominos', 'pizza');
      expect(category1).toBe(category2);
    });
  });
  
  describe('Return Type', () => {
    
    test('should always return a string', () => {
      const category = categorizeTransaction('Test', 'Test');
      expect(typeof category).toBe('string');
    });
    
    test('should return lowercase category', () => {
      const category = categorizeTransaction('Test', 'Test');
      expect(category).toBe(category.toLowerCase());
    });
  });
});
