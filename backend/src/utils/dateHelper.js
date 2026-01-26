const getMonthRange = (year, month) => {  // Remove async, not needed
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    return { startDate, endDate };  // ✅ CORRECT
};


const getYearRange = (year) => {  // Remove async
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    return { startDate, endDate };  // ✅ CORRECT
};

const getMonthName =  (month) => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return monthNames[month - 1];
}

const getDaysInMonth = async (year, month) => {
    return new Date(year, month, 0).getDate();
}

const validateDateRange = async (startDate, endDate) => {

    const validStartDate =  validateDatetype(startDate);
    const validEndDate =  validateDatetype(endDate);
    if (!validStartDate || !validEndDate) {
        return { isValid: false, message: 'Invalid Date Format' };
    }
    if (new Date(startDate) > new Date(endDate)) {
        return { isValid: false, message: 'Start date cannot be after end date' };
    }
    return { isValid: true };
}

const validateDatetype = (date) => {  
    if (date instanceof Date) {
        return !isNaN(date.getTime());  
    }

    if (typeof date === 'string') {
        return !isNaN(new Date(date).getTime());  
    }

    return false;  
};

module.exports = {
    getMonthRange,
    getYearRange,
    getMonthName,
    getDaysInMonth,
    validateDateRange,
    validateDatetype
}

