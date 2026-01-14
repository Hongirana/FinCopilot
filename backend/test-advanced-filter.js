require('dotenv').config();
const prisma = require('./src/prismaClient');
const filterService = require('./src/services/filterService');

async function testAdvancedFilters() {
  console.log('🧪 Testing Advanced Transaction Filtering\n');

  try {
    // Get test user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('❌ No test user found. Run seed first.');
      return;
    }

    console.log(`✅ Using user: ${user.email}\n`);

    // Test 1: Date range filtering
    console.log('📅 Test 1: Date Range Filtering');
    const dateFilter = await filterService.getFilteredTransactions(
      user.id,
      {
        dateFrom: '2025-01-01',
        dateTo: '2025-12-31'
      },
      1,
      10
    );
    console.log(`   Found ${dateFilter.data.pagination.total} transactions in date range`);
    console.log(`   Applied: ${dateFilter.data.appliedFilters}\n`);

    // Test 2: Category filtering
    console.log('🏷️  Test 2: Multiple Category Filtering');
    const categoryFilter = await filterService.getFilteredTransactions(
      user.id,
      {
        category: 'food,transport'
      },
      1,
      10
    );
    console.log(`   Found ${categoryFilter.data.pagination.total} transactions`);
    console.log(`   Applied: ${categoryFilter.data.appliedFilters}\n`);

    // Test 3: Amount range
    console.log('💰 Test 3: Amount Range (100-1000)');
    const amountFilter = await filterService.getFilteredTransactions(
      user.id,
      {
        minAmount: 100,
        maxAmount: 1000
      },
      1,
      10
    );
    console.log(`   Found ${amountFilter.data.pagination.total} transactions`);
    console.log(`   Applied: ${amountFilter.data.appliedFilters}\n`);

    // Test 4: Amount operator
    console.log('⚖️  Test 4: Amount Operator (> 500)');
    const operatorFilter = await filterService.getFilteredTransactions(
      user.id,
      {
        amount: 500,
        amountOperator: '>'
      },
      1,
      10
    );
    console.log(`   Found ${operatorFilter.data.pagination.total} transactions`);
    console.log(`   Applied: ${operatorFilter.data.appliedFilters}\n`);

    // Test 5: Type filtering
    console.log('📊 Test 5: Transaction Type Filtering (debit)');
    const typeFilter = await filterService.getFilteredTransactions(
      user.id,
      {
        type: 'debit'
      },
      1,
      10
    );
    console.log(`   Found ${typeFilter.data.pagination.total} debit transactions`);
    console.log(`   Applied: ${typeFilter.data.appliedFilters}\n`);

    // Test 6: Search
    console.log('🔍 Test 6: Search Filtering');
    const searchFilter = await filterService.getFilteredTransactions(
      user.id,
      {
        search: 'food'
      },
      1,
      10
    );
    console.log(`   Found ${searchFilter.data.pagination.total} transactions`);
    console.log(`   Applied: ${searchFilter.data.appliedFilters}\n`);

    // Test 7: Combined filters
    console.log('🔗 Test 7: Combined Filters (food, Jan 2025, debit, > 50)');
    const combinedFilter = await filterService.getFilteredTransactions(
      user.id,
      {
        category: 'food',
        dateFrom: '2025-01-01',
        dateTo: '2025-01-31',
        type: 'debit',
        amount: 50,
        amountOperator: '>'
      },
      1,
      20
    );
    console.log(`   Found ${combinedFilter.data.pagination.total} transactions`);
    console.log(`   Applied: ${combinedFilter.data.appliedFilters}\n`);

    // Test 8: Statistics
    console.log('📈 Test 8: Filter Statistics');
    const stats = await filterService.getFilteredStats(user.id, {
      type: 'debit',
      dateFrom: '2025-01-01',
      dateTo: '2025-12-31'
    });
    console.log(`   Total Transactions: ${stats.data.totalCount}`);
    console.log(`   Total debits: ₹${stats.data.totaldebit}`);
    console.log(`   Total Income: ₹${stats.data.totalIncome}`);
    console.log(`   Net Flow: ₹${stats.data.netFlow}`);
    console.log(`   By Type:`, stats.data.byType);
    console.log(`   Top Categories:`, stats.data.topCategories.slice(0, 3));
    console.log(`   Applied: ${stats.data.appliedFilters}\n`);

    console.log('✅ All tests completed!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testAdvancedFilters();
