const { GoogleGenAI } = require('@google/genai');


class AIService {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY not found in environment variables');
        }

        this.client = new GoogleGenAI(process.env.GEMINI_API_KEY);
        this.model = 'gemini-2.5-flash';
        console.log('[FinCopilot AIService] ✅ Initialized with model:', this.model);
    }

    /**
     * Categorize transaction automatically
     * @param {Object} transaction - Transaction details
     * @returns {Promise} Category with confidence
     */
    async categorizeTransaction(transaction) {
        try {
            const { description, amount, merchant, type } = transaction;

            const prompt = `You are a financial transaction categorizer for Indian users.

Transaction Details:
- Description: "${description}"
- Amount: ₹${amount}
- Merchant: "${merchant || 'Unknown'}"
- Type: ${type || 'expense'}

Available categories: groceries, utilities, transport, entertainment, healthcare, shopping, dining, salary, investment, bills, fuel, subscription, other

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

            console.log(`[AIService] Categorized "${description}" as "${result.category}" (${result.confidence})`);

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
            console.log("Parsed AI response:", parsed);
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
        const validCategories = [
            'groceries', 'utilities', 'transport', 'entertainment',
            'healthcare', 'shopping', 'dining', 'salary', 'investment',
            'bills', 'fuel', 'subscription', 'other'
        ];
        return validCategories.includes(category) ? category : 'other';
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