const categoryRules = require('../lib/catergoryRules.json');

/**
 * Category Constants - Single Source of Truth
 * All category-related validation and AI prompts use this file
 */

// Extract valid categories from categoryRules.json
const VALID_CATEGORIES = Object.keys(categoryRules);

// Add 'other' as fallback category
if (!VALID_CATEGORIES.includes('other')) {
  VALID_CATEGORIES.push('other');
}

/**
 * Get all valid category names
 * @returns {Array<string>} Array of valid categories
 */
const getValidCategories = () => {
  return [...VALID_CATEGORIES];
};

/**
 * Check if a category is valid
 * @param {string} category - Category to validate
 * @returns {boolean} True if valid
 */
const isValidCategory = (category) => {
  return VALID_CATEGORIES.includes(category.toLowerCase());
};

/**
 * Get category keywords for AI prompt
 * @returns {string} Comma-separated list of categories
 */
const getCategoryList = () => {
  return VALID_CATEGORIES.join(', ');
};

/**
 * Get all category rules (for traditional categorization fallback)
 * @returns {Object} Category rules object
 */
const getCategoryRules = () => {
  return categoryRules;
};

/**
 * Find category by keyword (fallback for non-AI categorization)
 * @param {string} text - Text to search for keywords
 * @returns {string} Matched category or 'other'
 */
const findCategoryByKeyword = (text) => {
  if (!text) return 'other';
  
  const lowerText = text.toLowerCase();
  
  // Search through all category rules
  for (const [category, keywords] of Object.entries(categoryRules)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  
  return 'other';
};

/**
 * Build AI prompt with category instructions
 * @returns {string} Category rules for AI prompt
 */
const getCategoryAIInstructions = () => {
  const categoryExamples = Object.entries(categoryRules)
    .map(([category, keywords]) => {
      const examples = keywords.slice(0, 3).join(', ');
      return `- ${category}: ${examples}`;
    })
    .join('\n');
  
  return `Available categories: ${getCategoryList()}

Category Guidelines:
${categoryExamples}
- other: Use as fallback for unmatched transactions`;
};

module.exports = {
  VALID_CATEGORIES,
  getValidCategories,
  isValidCategory,
  getCategoryList,
  getCategoryRules,
  findCategoryByKeyword,
  getCategoryAIInstructions
};
