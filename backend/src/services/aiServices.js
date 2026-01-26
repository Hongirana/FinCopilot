const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();
const { getCategoryList, isValidCategory, getCategoryAIInstructions } = require('../constant/categories');

class AIService {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY not found in environment variables');
        }

        this.client = new GoogleGenAI(process.env.GEMINI_API_KEY);
        this.model = 'gemini-2.5-flash';
    }

    /**
     * Categorize transaction automatically
     * @param {Object} transaction - Transaction details
     * @returns {Promise} Category with confidence
     */
    async categorizeTransaction(transaction) {
        try {
            const { description, amount, merchant, type } = transaction;

            const categoryInstructions = getCategoryAIInstructions();

            const prompt = `You are a financial transaction categorizer for Indian users.

Transaction Details:
- Description: "${description}"
- Amount: ₹${amount}
- Merchant: "${merchant || 'Unknown'}"
- Type: ${type || 'expense'}

${categoryInstructions}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "category": "",
  "confidence": 0.0
}

Rules:
- confidence: 0.0 to 1.0
- Choose best matching category
- For salary/income use "salary"
- For UPI/online payments, infer from merchant/description`;

            const response = await this.client.models.generateContent({
                model: this.model,
                contents: prompt
            });

            const result = this.parseAIResponse(response.text);



            return {
                success: true,
                data: result
            };

        } catch (error) {
            console.error('[AIService] Categorization error:', error.message);
            return {
                success: false,
                data: {
                    category: 'other',
                    confidence: 0
                }
            };
        }
    }
    /**
      * Bulk categorize multiple transactions
      * @param {Array} transactions - Array of transactions
      * @returns {Promise} Array of categorization results
      */
    async bulkCategorize(transactions) {
        const results = [];

        for (const tx of transactions) {
            const result = await this.categorizeTransaction(tx);
            results.push({
                transactionId: tx.id,
                ...result.data
            });

            // Rate limiting: 500ms delay between calls
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        return results;
    }

    /**
    * Parse AI response and extract JSON
    * @private
    */
    parseAIResponse(rawText) {
        try {
            // Remove markdown code blocks if present
            let jsonText = rawText.trim()
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '')
                .trim();

            const parsed = JSON.parse(jsonText);

            return {
                category: this.validateCategory(parsed.category),
                confidence: this.validateConfidence(parsed.confidence)
            };
        } catch (error) {
            console.error('[AIService] JSON parse error:', error.message);
            return {
                category: 'other',
                confidence: 0
            };
        }
    }
    /**
      * Validate category
      * @private
      */
    validateCategory(category) {
        const lowerCategory = String(category).toLowerCase();
        if (isValidCategory(lowerCategory)) {
            return lowerCategory;
        }

        console.warn(`[AIService] Invalid category "${category}", using "other"`);
        return 'other';
    }

    /**
   * Validate confidence score
   * @private
   */
    validateConfidence(confidence) {
        const score = parseFloat(confidence);
        if (isNaN(score)) return 0;
        return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1
    }
}


module.exports = new AIService();