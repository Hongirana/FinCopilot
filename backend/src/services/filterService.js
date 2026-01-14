const prisma = require('../prismaClient');
const {
  buildAdvancedWhere,
  buildSortOrder,
  validateAndSanitizeFilters,
  buildPaginationParams
} = require('../utils/queryBuilder');

class FilterService {
  /**
   * Apply advanced filters to transactions
   * @param {string} userId - User ID
   * @param {Object} filters - Filter criteria from query params
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   */
  async getFilteredTransactions(userId, filters = {}, page = 1, limit = 20) {
    try {
      // Validate and sanitize filters
      const sanitized = validateAndSanitizeFilters(filters);

      // Build WHERE clause using enhanced builder
      const where = buildAdvancedWhere(userId, sanitized);

      // Build sorting
      const orderBy = buildSortOrder(sanitized.sortBy, sanitized.order);

      // Build pagination
      const { skip, take } = buildPaginationParams(page, limit);

      console.log('[FilterService] Query params:', {
        where,
        orderBy,
        skip,
        take,
        filters: sanitized
      });

      // Fetch transactions
      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          orderBy,
          skip,
          take,
          select: {
            id: true,
            description: true,
            amount: true,
            type: true,
            category: true,
            date: true,
            accountId: true,
            createdAt: true,
            merchant: true
          }
        }),
        prisma.transaction.count({ where })
      ]);

      const pages = Math.ceil(total / take);

      return {
        success: true,
        data: {
          transactions,
          pagination: {
            total,
            page: parseInt(page),
            limit: take,
            pages,
            hasMore: page < pages
          },
          filters: sanitized,
          appliedFilters: this.getAppliedFiltersDescription(sanitized)
        }
      };

    } catch (error) {
      console.error('[FilterService] Error:', error.message);
      throw error;
    }
  }

  /**
   * Get advanced statistics for filtered transactions
   * @param {string} userId - User ID
   * @param {Object} filters - Filter criteria
   */
  async getFilteredStats(userId, filters = {}) {
  try {
    const sanitized = validateAndSanitizeFilters(filters);
    const where = buildAdvancedWhere(userId, sanitized);

    console.log('[FilterService] Stats query:', where);

    // Get stats using aggregate (Prisma syntax)
    const [totalCount, expenseData, incomeData, typeGroups, categoryGroups] = await Promise.all([
      // Total transactions matching filter
      prisma.transaction.count({ where }),

      // Total expenses
      prisma.transaction.aggregate({
        where: { ...where, type: 'debit' },
        _sum: { amount: true }  // Changed from sum to _sum
      }),

      // Total income
      prisma.transaction.aggregate({
        where: { ...where, type: 'credit' },
        _sum: { amount: true }  // Changed from sum to _sum
      }),

      // Group by type
      prisma.transaction.groupBy({
        by: ['type'],
        where,
        _sum: { amount: true },  // Changed from sum to _sum
        _count: true
      }),

      // Group by category (top 5)
      prisma.transaction.groupBy({
        by: ['category'],
        where,
        _sum: { amount: true },  // Changed from sum to _sum
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },  // Changed from sum to _sum
        take: 5
      })
    ]);

    const totalIncome = incomeData._sum?.amount || 0;
    const totalExpense = expenseData._sum?.amount || 0;

    return {
      success: true,
      data: {
        totalCount,
        totalExpense: parseFloat(totalExpense.toFixed(2)),
        totalIncome: parseFloat(totalIncome.toFixed(2)),
        netFlow: parseFloat((totalIncome - totalExpense).toFixed(2)),
        byType: typeGroups.reduce((acc, group) => {
          acc[group.type] = {
            count: group._count,
            amount: parseFloat((group._sum?.amount || 0).toFixed(2))
          };
          return acc;
        }, {}),
        topCategories: categoryGroups.map(group => ({
          category: group.category,
          count: group._count,
          amount: parseFloat((group._sum?.amount || 0).toFixed(2))
        })),
        filters: sanitized,
        appliedFilters: this.getAppliedFiltersDescription(sanitized)
      }
    };

  } catch (error) {
    console.error('[FilterService] Stats error:', error.message);
    throw error;
  }
}

  /**
   * Get human-readable description of applied filters
   * @param {Object} filters - Sanitized filters
   */
  getAppliedFiltersDescription(filters) {
    const descriptions = [];

    if (filters.dateFrom || filters.dateTo) {
      const from = filters.dateFrom || 'start';
      const to = filters.dateTo || 'today';
      descriptions.push(`Date: ${from} to ${to}`);
    }

    if (filters.category) {
      const cats = Array.isArray(filters.category)
        ? filters.category.join(', ')
        : filters.category;
      descriptions.push(`Categories: ${cats}`);
    }

    if (filters.type) {
      const types = Array.isArray(filters.type)
        ? filters.type.join(', ')
        : filters.type;
      descriptions.push(`Types: ${types}`);
    }

    if (filters.minAmount || filters.maxAmount) {
      const min = filters.minAmount || '0';
      const max = filters.maxAmount || '∞';
      descriptions.push(`Amount: ₹${min} - ₹${max}`);
    }

    if (filters.amount && filters.amountOperator) {
      descriptions.push(`Amount ${filters.amountOperator} ₹${filters.amount}`);
    }

    if (filters.search) {
      descriptions.push(`Search: "${filters.search}"`);
    }

    if (filters.excludeTransfers) {
      descriptions.push('Transfers excluded');
    }

    return descriptions.length > 0 ? descriptions.join(' | ') : 'No filters applied';
  }
}

module.exports = new FilterService();
