
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
            { merchant: { contains: searchText, mode: 'insensitive' } },
            { notes: { contains: searchText, mode: 'insensitive' } }
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


module.exports = {
    buildTransactionFilters,
    buildDateFilter,
    buildAmountFilter,
    buildSearchFilter,
    buildPaginationParams
};