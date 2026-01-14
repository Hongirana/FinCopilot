require('dotenv').config();
const aiService = require('./src/services/aiServices');
const aiFeedbackService = require('./src/services/aiFeedbackServices');
const prisma = require('./src/prismaClient');

async function testAIFeedback() {
    console.log('🧪 Testing AI Category Learning System\n');

    try {
        // Get a test user
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log('❌ No test user found. Run seed first.');
            return;
        }

        console.log(`✅ Using test user: ${user.email}\n`);

        // Get a test transaction
        const transaction = await prisma.transaction.findFirst({
            where: { userId: user.id }
        });

        if (!transaction) {
            console.log('❌ No test transaction found. Create one first.');
            return;
        }

        console.log(`📝 Test Transaction:`);
        console.log(`   Description: ${transaction.description}`);
        console.log(`   Current Category: ${transaction.category}`);
        console.log(`   Amount: ₹${transaction.amount}\n`);

        // Simulate AI categorization
        console.log('🤖 Simulating AI Categorization...');
        const aiResult = await aiService.categorizeTransaction({
            description: transaction.description,
            amount: transaction.amount,
            merchant: 'Test Merchant',
            type: 'expense'
        });

        console.log(`   AI Suggested: ${aiResult.data.category} (${aiResult.data.confidence} confidence)\n`);

        // Simulate user correction
        const userCorrection = {
            suggestedCategory: aiResult.data.category,
            actualCategory: 'Entertainment', // User says it's actually entertainment
            confidence: aiResult.data.confidence
        };

        console.log('👤 User Feedback:');
        console.log(`   User Corrected To: ${userCorrection.actualCategory}\n`);

        // Record feedback
        console.log('📊 Recording Feedback...');
        const feedback = await aiFeedbackService.recordFeedback(
            user.id,
            transaction.id,
            userCorrection.suggestedCategory,
            userCorrection.actualCategory,
            userCorrection.confidence
        );

        console.log(`   ✅ Feedback recorded\n`);

        // Get accuracy metrics
        console.log('📈 AI Accuracy Metrics:');
        const metrics = await aiFeedbackService.getAccuracyMetrics(user.id);
        console.log(`   Total Feedback: ${metrics.totalFeedback}`);
        console.log(`   Overall Accuracy: ${metrics.overallAccuracy}%`);
        console.log(`   By Category:`, metrics.byCategory);
        console.log();

        // Get feedback history
        console.log('📜 Recent Feedback History:');
        const history = await aiFeedbackService.getFeedbackHistory(user.id, 5);
        history.forEach((h, i) => {
            console.log(`   ${i + 1}. ${h.suggestedCategory} → ${h.actualCategory} (${h.isCorrect ? '✅' : '❌'})`);
        });
        console.log();

        console.log('✅ Day 16 Testing Complete!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testAIFeedback();
