const CATEGORY_RULES = require('../lib/catergoryRules.json');

/**
 * Auto-categorize a transaction based on merchant and description
 * 
 * How it works:
 * 1. Combines merchant + description into search text
 * 2. Checks each category's keywords
 * 3. Returns first matching category or "other"
 * 
 * @param {string} merchant - Merchant name (e.g., "Domino's Pizza")
 * @param {string} description - Transaction description (optional)
 * @returns {string} - Category (e.g., "food") or "other"
 * 
 * @example
 * categorizeTransaction("Domino's", "Pizza delivery")  // Returns: "food"
 * categorizeTransaction("Uber", "Ride to work")        // Returns: "transport"
 * categorizeTransaction("Unknown Store", "")           // Returns: "other"
 */
const categorizeTransaction = (merchant = '', description = '') => {
    // Step 1: Combine merchant and description into lowercase search text
    const searchText = `${merchant.toLowerCase()} ${description.toLowerCase()}`.trim();

    // Step 2: Loop through each category and its keywords
    for (const [category, keywords] of Object.entries(CATEGORY_RULES)) {
        // Step 3: Check if any keyword matches
        for (const keyword of keywords) {
            if (searchText.includes(keyword.toLowerCase())) {
                console.log(`✅ Auto-categorized as "${category}" (matched keyword: "${keyword}")`);
                return category;
            }
        }
    }

    // Step 4: No match found, return default
    console.log(`⚠️  No category match found, defaulting to "other"`);
    return 'other';
};

module.exports = categorizeTransaction;
