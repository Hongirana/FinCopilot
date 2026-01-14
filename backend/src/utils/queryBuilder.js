
// 1. buildTransactionFilters(userId, filters)
//    Combines all filter conditions into Prisma where clause
// const filters = {
//   category: 'Food',              // or ['Food', 'Transport']
//   type: 'expense',               // 'income' | 'expense'
//   startDate: '2026-01-01',
//   endDate: '2026-01-31',
//   minAmount: 100,
//   maxAmount: 5000,
//   search: 'coffee',              // searches description/merchant
//   accountId: 'uuid-here',
//   merchant: 'Starbucks'
// };
const buildTransactionFilters = (userId, filters) => {

    const paginationParams = buildPaginationParams(filters.page, filters.limit);
    const dateFilter = buildDateFilter(filters.startDate, filters.endDate);
    const amountFilter = buildAmountFilter(filters.minAmount, filters.maxAmount);
    const searchFilter = buildSearchFilter(filters.search);
    const skip = paginationParams.skip;
    const limit = paginationParams.limit;


    const filterData = {
        where: {
            userId: userId,
            AND: [
                filters.category && { category: Array.isArray(filters.category) ? { in: filters.category } : filters.category },
                filters.type && { type: filters.type },
                dateFilter && { date: dateFilter },
                amountFilter && { amount: amountFilter },
                searchFilter,
                filters.accountId && { accountId: filters.accountId },
                filters.merchant && { merchant: filters.merchant }
            ].filter(Boolean)
        },
        take: limit,
        skip: skip
    };

    return filterData;
};
// 2. buildDateFilter(startDate, endDate)
//    Handles date range filtering
const buildDateFilter = (startDate, endDate) => {
    if (!startDate && !endDate) return null;
    const dateFilter = {};

    if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.gte = start;
    }

    if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
    }
    return dateFilter;
};

// 3. buildAmountFilter(minAmount, maxAmount)
//    Handles amount range filtering
const buildAmountFilter = (minAmount, maxAmount) => {
    const amountFilter = {};
    if (!minAmount && !maxAmount) return null;
    if (minAmount) {
        amountFilter.gte = parseFloat(minAmount);
    }

    if (maxAmount) {
        amountFilter.lte = parseFloat(maxAmount);
    }
    return Object.keys(amountFilter).length === 0 ? null : amountFilter;
};

// 4. buildSearchFilter(searchText)
//    Handles text search across multiple fields
const buildSearchFilter = (searchText) => {
    if (!searchText || searchText.length < 3) return null;
    const searchFilter = {
        OR: [
            { description: { contains: searchText, mode: 'insensitive' } },
            { merchant: { contains: searchText, mode: 'insensitive' } }
        ]
    };
    return searchFilter;
};

// 5. buildPaginationParams(page, limit)
//    Creates skip/take values for pagination
const buildPaginationParams = (page, limit) => {
    const validPage = Math.max(1, parseInt(page) || 1);
    const validLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));

    const skip = (validPage - 1) * validLimit;
    return {
        skip,           // For Prisma query
        take: validLimit,  // For Prisma query
        page: validPage,   // For response metadata
        limit: validLimit  // For response metadata
    };
}

/**
 * Build amount filter with operators (>, <, >=, <=, =, !=)
 * More advanced than existing buildAmountFilter
 */
const buildAmountFilterWithOperator = (amount, operator) => {
    if (!amount || !operator) return null;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return null;

    const operatorMap = {
        '>': { gt: numAmount },
        '>=': { gte: numAmount },
        '<': { lt: numAmount },
        '<=': { lte: numAmount },
        '=': { equals: numAmount },
        '!=': { not: numAmount }
    };

    return operatorMap[operator] || null;
};

/**
 * Build multi-category filter
 * Handles both single category and comma-separated categories
 */
const buildCategoryFilter = (category) => {
    if (!category) return null;

    if (typeof category === 'string') {
        const categories = category.split(',').map(c => c.trim()).filter(Boolean);

        if (categories.length === 0) return null;
        if (categories.length === 1) return categories[0];

        return { in: categories };
    }

    if (Array.isArray(category)) {
        return category.length === 1 ? category[0] : { in: category };
    }

    return category;
};

/**
 * Build multi-type filter
 * Handles both single type and comma-separated types
 */
const buildTypeFilter = (type) => {
    if (!type) return null;

    if (typeof type === 'string') {
        const types = type.split(',').map(t => t.trim()).filter(Boolean);

        if (types.length === 0) return null;
        if (types.length === 1) return types[0];

        return { in: types };
    }

    if (Array.isArray(type)) {
        return type.length === 1 ? type[0] : { in: type };
    }

    return type;
};


/**
 * Enhanced search filter with case insensitivity
 */
const buildAdvancedSearchFilter = (searchText) => {
    if (!searchText || searchText.trim().length === 0) return null;

    const text = searchText.trim();

    return {
        OR: [
            { description: { contains: text, mode: 'insensitive' } },
            { merchant: { contains: text, mode: 'insensitive' } }
        ]
    };
};

/**
 * Build advanced WHERE clause with all filter options
 * Returns complete Prisma where object
 */
const buildAdvancedWhere = (userId, filters) => {
    const where = { userId };

    // Date range
    if (filters.dateFrom || filters.dateTo) {
        where.date = {};
        if (filters.dateFrom) {
            where.date.gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
            const endDate = new Date(filters.dateTo);
            endDate.setHours(23, 59, 59, 999);
            where.date.lte = endDate;
        }
    }

    // Amount range (traditional)
    if (filters.minAmount || filters.maxAmount) {
        where.amount = {};
        if (filters.minAmount) where.amount.gte = parseFloat(filters.minAmount);
        if (filters.maxAmount) where.amount.lte = parseFloat(filters.maxAmount);
    }

    // Amount with operator
    if (filters.amount && filters.amountOperator) {
        const operatorFilter = buildAmountFilterWithOperator(filters.amount, filters.amountOperator);
        if (operatorFilter) where.amount = operatorFilter;
    }

    // Category (multi-select)
    if (filters.category) {
        const categoryFilter = buildCategoryFilter(filters.category);
        if (categoryFilter) where.category = categoryFilter;
    }

    // Type (multi-select)
    if (filters.type) {
        const typeFilter = buildTypeFilter(filters.type);
        if (typeFilter) where.type = typeFilter;
    }

    // Search
    if (filters.search) {
        const searchFilter = buildAdvancedSearchFilter(filters.search);
        if (searchFilter) {
            if (where.OR) {
                where.AND = [{ OR: where.OR }, searchFilter];
                delete where.OR;
            } else {
                where.OR = searchFilter.OR;
            }
        }
    }

    // Account
    if (filters.accountId) {
        where.accountId = filters.accountId;
    }

    // Exclude transfers
    if (filters.excludeTransfers === true || filters.excludeTransfers === 'true') {
        where.type = { not: 'TRANSFER' };
    }

    return where;
};

/**
 * Build sort order with validation
 */
const buildSortOrder = (sortBy = 'date', order = 'desc') => {
    const validFields = ['date', 'amount', 'category', 'createdAt', 'type'];
    const validOrders = { asc: 'asc', desc: 'desc' };

    const field = validFields.includes(sortBy) ? sortBy : 'date';
    const direction = validOrders[order] ? order : 'desc';

    return { [field]: direction };
};

/**
 * Sanitize and validate all filters
 */
const validateAndSanitizeFilters = (filters) => {
    const sanitized = {};

    if (filters.dateFrom) {
        const date = new Date(filters.dateFrom);
        if (!isNaN(date)) sanitized.dateFrom = filters.dateFrom;
    }
    if (filters.dateTo) {
        const date = new Date(filters.dateTo);
        if (!isNaN(date)) sanitized.dateTo = filters.dateTo;
    }

    if (filters.minAmount) {
        const amt = parseFloat(filters.minAmount);
        if (!isNaN(amt) && amt > 0) sanitized.minAmount = amt;
    }
    if (filters.maxAmount) {
        const amt = parseFloat(filters.maxAmount);
        if (!isNaN(amt) && amt > 0) sanitized.maxAmount = amt;
    }
    if (filters.amount) {
        const amt = parseFloat(filters.amount);
        if (!isNaN(amt)) sanitized.amount = amt;
    }

    if (filters.amountOperator) {
        const validOps = ['>', '>=', '<', '<=', '=', '!='];
        if (validOps.includes(filters.amountOperator)) {
            sanitized.amountOperator = filters.amountOperator;
        }
    }

    if (filters.category) sanitized.category = filters.category;
    if (filters.type) sanitized.type = filters.type;
    if (filters.accountId) sanitized.accountId = filters.accountId;
    if (filters.search) sanitized.search = filters.search.substring(0, 100);
    if (filters.sortBy) sanitized.sortBy = filters.sortBy;
    if (filters.order) sanitized.order = filters.order;
    if (filters.excludeTransfers) sanitized.excludeTransfers = filters.excludeTransfers;

    return sanitized;
};

module.exports = {
    buildTransactionFilters,
    buildDateFilter,
    buildAmountFilter,
    buildSearchFilter,
    buildPaginationParams,
    buildAmountFilterWithOperator,
    buildCategoryFilter,
    buildTypeFilter,
    buildAdvancedSearchFilter,
    buildAdvancedWhere,
    buildSortOrder,
    validateAndSanitizeFilters
};