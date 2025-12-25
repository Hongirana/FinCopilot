const CATEGORY_RULES = require('../lib/catergoryRules.json');

/**
 * Auto-categorize a transaction based on merchant and description
 * @param {string} merchant - Merchant name (e.g., "Domino's Pizza")
 * @param {string} description - Transaction description (optional)
 * @returns {string} - Suggested category (e.g., "food") or "other"
 */
const categorizeTransaction = (merchant, description) => {
    // Check if the merchant is in the CATEGORY_RULES object
    const merchantCategory = CATEGORY_RULES[merchant.toLowerCase()];
    if (merchantCategory) {
        // If the merchant is in the object, use the category from the object
        return merchantCategory;
    }

    // If the merchant is not in the object, check if the description matches any of the categories
    const categoryMatches = Object.keys(CATEGORY_RULES).filter((category) => {
        const regex = new RegExp(CATEGORY_RULES[category].description, 'i');
        return regex.test(description || '');
    });

    // If there are any matches, return the first match
    if (categoryMatches.length > 0) {
        return categoryMatches[0];
    }

    // If there are no matches, return "other"
    return 'other';
}


// const categorizeTransaction = (merchant, description = '') => {
//     // Combine merchant and description for keyword search
//     const searchText = `${(merchant || '').toLowerCase()} ${(description || '').toLowerCase()}`;
    
//     // Loop through categories and check keywords
//     for (const [category, keywords] of Object.entries(CATEGORY_RULES)) {
//         for (const keyword of keywords) {
//             if (searchText.includes(keyword.toLowerCase())) {
//                 return category;  // ✅ Return category on first match
//             }
//         }
//     }
    
//     // No match found
//     return 'other';
// };


module.exports = categorizeTransaction;