# FinCopilot API Documentation

**Version:** 1.0  
**Last Updated:** January 18, 2026  
**Base URL:** `http://localhost:3000/api`

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [User Management](#2-user-management)
3. [Accounts](#3-accounts)
4. [Transactions](#4-transactions)
5. [Budgets](#5-budgets)
6. [Goals](#6-goals)
7. [Dashboard](#7-dashboard)
8. [Analytics](#8-analytics)
9. [Error Responses](#error-responses)
10. [Rate Limiting](#rate-limiting)

---

## Authentication

All protected endpoints require JWT token in Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

### 1.1 Sign Up

**Endpoint:** `POST /auth/signup`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "baseCurrency": "INR",
      "role": "user",
      "createdAt": "2026-01-18T08:00:00.000Z"
    }
  }
}
```

**Validation Rules:**
- Email must be valid format
- Password minimum 8 characters
- Password must contain: uppercase, lowercase, number, special char
- firstName required
- lastName required

**Errors:**
- 400: Validation error
- 409: Email already exists

---

### 1.2 Login

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

**Errors:**
- 400: Missing email or password
- 401: Invalid credentials
- 404: User not found

---

## 2. User Management

### 2.1 Get Profile

**Endpoint:** `GET /user/profile`  
**Auth:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "baseCurrency": "INR",
    "role": "user",
    "createdAt": "2026-01-18T08:00:00.000Z",
    "updatedAt": "2026-01-18T08:00:00.000Z"
  }
}
```

---

### 2.2 Update Profile

**Endpoint:** `PUT /user/profile`  
**Auth:** Required

**Request Body (all optional):**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "baseCurrency": "USD"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "baseCurrency": "USD"
  }
}
```

---

### 2.3 Change Password

**Endpoint:** `PUT /user/change-password`  
**Auth:** Required

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Errors:**
- 401: Current password incorrect
- 400: New password validation failed

---

### 2.4 Get User Stats

**Endpoint:** `GET /user/stats`  
**Auth:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalAccounts": 3,
    "totalTransactions": 145,
    "totalBudgets": 5,
    "totalGoals": 2,
    "memberSince": "2025-12-01T00:00:00.000Z"
  }
}
```

---

## 3. Accounts

### 3.1 Create Account

**Endpoint:** `POST /accounts`  
**Auth:** Required

**Request Body:**
```json
{
  "name": "Savings Account",
  "type": "savings",
  "balance": 50000.00,
  "bankName": "HDFC Bank",
  "currency": "INR"
}
```

**Account Types:** `checking`, `savings`, `credit_card`, `investment`, `cash`

**Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "id": "uuid",
    "userId": "user-uuid",
    "name": "Savings Account",
    "type": "savings",
    "balance": "50000.00",
    "bankName": "HDFC Bank",
    "currency": "INR",
    "createdAt": "2026-01-18T08:00:00.000Z"
  }
}
```

---

### 3.2 List Accounts

**Endpoint:** `GET /accounts`  
**Auth:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "id": "uuid",
        "name": "Savings Account",
        "type": "savings",
        "balance": "50000.00",
        "currency": "INR"
      }
    ],
    "totalBalance": "50000.00"
  }
}
```

---

### 3.3 Get Account by ID

**Endpoint:** `GET /accounts/:id`  
**Auth:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Savings Account",
    "type": "savings",
    "balance": "50000.00",
    "bankName": "HDFC Bank",
    "currency": "INR",
    "createdAt": "2026-01-18T08:00:00.000Z",
    "updatedAt": "2026-01-18T08:00:00.000Z"
  }
}
```

---

### 3.4 Update Account

**Endpoint:** `PUT /accounts/:id`  
**Auth:** Required

**Request Body (all optional):**
```json
{
  "name": "Updated Savings",
  "balance": 55000.00
}
```

---

### 3.5 Delete Account

**Endpoint:** `DELETE /accounts/:id`  
**Auth:** Required

**Response (200):**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

---

## 4. Transactions

### 4.1 Create Transaction

**Endpoint:** `POST /transactions`  
**Auth:** Required

**Request Body:**
```json
{
  "accountId": "account-uuid",
  "type": "debit",
  "amount": 1500.50,
  "category": "food",
  "merchant": "Grocery Store",
  "description": "Weekly groceries",
  "date": "2026-01-18T10:00:00.000Z"
}
```

**Transaction Types:** `debit` (expense), `credit` (income)

**Categories:** food, rent, utilities, transport, entertainment, shopping, medical, insurance, education, savings, salary, other, uncategorized

**AI Categorization:** If category is omitted, Gemini API automatically categorizes based on merchant and description.

**Response (201):**
```json
{
  "success": true,
  "message": "Transaction created successfully",
  "data": {
    "transaction": {
      "id": "uuid",
      "type": "debit",
      "amount": "1500.50",
      "category": "food",
      "merchant": "Grocery Store",
      "description": "Weekly groceries",
      "date": "2026-01-18T10:00:00.000Z",
      "autoCategorized": true
    }
  }
}
```

---

### 4.2 List Transactions

**Endpoint:** `GET /transactions`  
**Auth:** Required

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `type` (string: debit/credit)
- `category` (string or array)
- `accountId` (uuid)
- `merchant` (string, partial match)
- `startDate` (YYYY-MM-DD)
- `endDate` (YYYY-MM-DD)
- `minAmount` (number)
- `maxAmount` (number)
- `search` (string, searches description/merchant)
- `sortBy` (string, default: 'date')
- `sortOrder` ('asc'/'desc', default: 'desc')

**Example:**
```
GET /transactions?category=food&startDate=2026-01-01&endDate=2026-01-31&page=1&limit=20
```

**Response (200):**
```json
{
  "success": true,
  "message": "Transactions fetched successfully",
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "type": "debit",
        "amount": "1500.50",
        "category": "food",
        "date": "2026-01-18T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3,
      "hasMore": true
    }
  }
}
```

---

### 4.3 Search Transactions

**Endpoint:** `GET /transactions/search`  
**Auth:** Required

**Query Parameters:**
- `search` (required, min 3 chars) - searches description, merchant, notes
- All filter parameters from list endpoint

**Example:**
```
GET /transactions/search?search=coffee&category=food
```

---

### 4.4 Get Transaction by ID

**Endpoint:** `GET /transactions/:id`  
**Auth:** Required

---

### 4.5 Update Transaction

**Endpoint:** `PUT /transactions/:id`  
**Auth:** Required

**Request Body (all required):**
```json
{
  "accountId": "account-uuid",
  "type": "debit",
  "amount": 1600.00,
  "category": "food",
  "description": "Updated description",
  "date": "2026-01-18T10:00:00.000Z"
}
```

---

### 4.6 Delete Transaction

**Endpoint:** `DELETE /transactions/:id`  
**Auth:** Required

**Response (200):**
```json
{
  "success": true,
  "message": "Transaction deleted successfully"
}
```

---

## 5. Budgets

### 5.1 Create Budget

**Endpoint:** `POST /budgets`  
**Auth:** Required

**Request Body:**
```json
{
  "category": "food",
  "amount": 15000,
  "period": "MONTHLY",
  "startDate": "2026-01-01",
  "endDate": "2026-01-31"
}
```

**Budget Periods:** `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`

**Response (201):**
```json
{
  "success": true,
  "message": "Budget created successfully",
  "data": {
    "budget": {
      "id": "uuid",
      "category": "food",
      "amount": "15000.00",
      "spent": "0.00",
      "period": "MONTHLY",
      "startDate": "2026-01-01T00:00:00.000Z",
      "endDate": "2026-01-31T23:59:59.999Z",
      "isActive": true
    }
  }
}
```

**Features:**
- Automatic tracking from debit transactions
- Prevents overlapping budgets for same category
- Real-time spent calculation

---

### 5.2 List Budgets

**Endpoint:** `GET /budgets`  
**Auth:** Required

**Query Parameters:**
- `period` (MONTHLY/WEEKLY/YEARLY/DAILY)
- `category` (string)
- `active` (true/false) - filters by current date range

**Response (200):**
```json
{
  "success": true,
  "message": "Budgets fetched successfully",
  "data": {
    "budgets": [
      {
        "id": "uuid",
        "category": "food",
        "amount": "15000.00",
        "spent": "8000.00",
        "percentSpent": "53.33",
        "remaining": "7000.00",
        "isOverBudget": false,
        "daysRemaining": 13
      }
    ]
  }
}
```

---

### 5.3 Get Budget Alerts

**Endpoint:** `GET /budgets/alerts`  
**Auth:** Required

**Query Parameters:**
- `threshold` (number, 0-100, default: 80) - alert percentage

**Response (200):**
```json
{
  "success": true,
  "message": "Budget alerts fetched successfully",
  "data": {
    "alerts": [
      {
        "id": "uuid",
        "category": "entertainment",
        "amount": "10000.00",
        "spent": "9500.00",
        "percentSpent": "95.00",
        "isOverBudget": false,
        "isNearLimit": true
      }
    ],
    "threshold": 80
  }
}
```

---

### 5.4 Recalculate Budgets

**Endpoint:** `POST /budgets/recalculate`  
**Auth:** Required

Manually recalculates all budget spent amounts from transactions.

**Response (200):**
```json
{
  "success": true,
  "message": "Budgets recalculated successfully",
  "data": {
    "recalculated": true
  }
}
```

---

## 6. Goals

### 6.1 Create Goal

**Endpoint:** `POST /goals`  
**Auth:** Required

**Request Body:**
```json
{
  "title": "Emergency Fund",
  "description": "Build 6 months emergency fund",
  "targetAmount": 100000,
  "deadline": "2026-12-31",
  "category": "savings",
  "priority": "high"
}
```

**Goal Status:** `ACTIVE`, `COMPLETED`, `CANCELLED`

**Response (201):**
```json
{
  "success": true,
  "message": "Goal created successfully",
  "data": {
    "id": "uuid",
    "title": "Emergency Fund",
    "targetAmount": "100000.00",
    "currentAmount": "0.00",
    "status": "ACTIVE",
    "deadline": "2026-12-31T23:59:59.999Z"
  }
}
```

---

### 6.2 List Goals

**Endpoint:** `GET /goals`  
**Auth:** Required

**Query Parameters:**
- `status` (ACTIVE/COMPLETED/CANCELLED)
- `category` (string)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "goals": [
      {
        "id": "uuid",
        "title": "Emergency Fund",
        "targetAmount": "100000.00",
        "currentAmount": "50000.00",
        "progressPercentage": "50.00",
        "remaining": "50000.00",
        "daysRemaining": 348,
        "status": "ACTIVE"
      }
    ],
    "count": 1
  }
}
```

---

### 6.3 Update Goal Progress

**Endpoint:** `PATCH /goals/:id/progress`  
**Auth:** Required

**Request Body:**
```json
{
  "amount": 5000
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Goal progress updated successfully",
  "data": {
    "id": "uuid",
    "currentAmount": "55000.00",
    "status": "ACTIVE"
  }
}
```

If target reached:
```json
{
  "success": true,
  "message": "Congratulations! Goal completed!",
  "data": {
    "status": "COMPLETED"
  }
}
```

---

### 6.4 Get Goal Stats

**Endpoint:** `GET /goals/stats`  
**Auth:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalGoals": 4,
    "activeGoals": 2,
    "completedGoals": 1,
    "cancelledGoals": 1,
    "totalTargetAmount": "150000.00",
    "totalSavedAmount": "75000.00",
    "overallProgress": "50.00%",
    "remaining": "75000.00"
  }
}
```

---

## 7. Dashboard

### 7.1 Get Dashboard Summary

**Endpoint:** `GET /dashboard/summary`  
**Auth:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "currentMonth": {
        "month": 1,
        "year": 2026,
        "monthName": "January",
        "totalIncome": "60000.00",
        "totalExpenses": "28000.00",
        "netSavings": "32000.00",
        "savingsRate": "53.33%"
      },
      "previousMonth": {
        "month": 12,
        "year": 2025,
        "prevExpenses": "25000.00",
        "change": "increase",
        "changeAmount": "3000.00"
      },
      "budgetOverview": {
        "totalBudgets": 5,
        "activeBudgets": 3,
        "totalBudgetAmount": "50000.00",
        "totalSpent": "28000.00",
        "remainingBudget": "22000.00",
        "budgetUtilization": "56.00%"
      },
      "goalsOverview": {
        "totalGoals": 4,
        "activeGoals": 2,
        "completedGoals": 1,
        "totalTargetAmount": "150000.00",
        "totalCurrentAmount": "75000.00",
        "overallProgress": "50.00%"
      },
      "accounts": {
        "totalAccounts": 2,
        "totalBalance": "75000.00",
        "accounts": [...]
      }
    }
  }
}
```

---

### 7.2 Get Financial Stats

**Endpoint:** `GET /dashboard/stats`  
**Auth:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "financialStats": {
      "netWorth": {
        "total": "75000.00",
        "breakdown": {
          "assets": "75000.00",
          "liabilities": "0.00"
        }
      },
      "cashFlow": {
        "last30Days": {
          "income": "60000.00",
          "expenses": "28000.00",
          "net": "32000.00"
        }
      },
      "spendingVelocity": {
        "dailyAverage": "933.33",
        "monthlyProjection": "28000.00"
      },
      "savingsMetrics": {
        "savingsRate": "53.33",
        "currentMonthSavings": "32000.00",
        "last3MonthsAverage": "30000.00",
        "savingsTrend": "increasing"
      },
      "topExpenseCategories": [
        {
          "category": "rent",
          "total": "15000.00",
          "percentage": "53.57"
        }
      ]
    }
  }
}
```

---

### 7.3 Get Quick Overview

**Endpoint:** `GET /dashboard/overview`  
**Auth:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accountsOverview": {...},
    "budgetsOverview": {...},
    "goalsOverview": {...},
    "transactionsOverview": {
      "totalTransactions": 45,
      "thisMonth": 12,
      "lastTransaction": "2026-01-18T10:00:00.000Z"
    },
    "recentTransactions": [...],
    "alerts": [
      {
        "type": "budget_alert",
        "category": "entertainment",
        "message": "95% of budget used"
      }
    ]
  }
}
```

---

## 8. Analytics

### 8.1 Get Spending by Category

**Endpoint:** `GET /analytics/spending/category`  
**Auth:** Required

**Query Parameters:**
- `startDate` (YYYY-MM-DD)
- `endDate` (YYYY-MM-DD)
- `accountId` (uuid)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "categoryBreakdown": [
      {
        "category": "food",
        "total": "8000.00",
        "count": 15,
        "percentage": "28.57"
      }
    ]
  }
}
```

---

### 8.2 Get Top Categories

**Endpoint:** `GET /analytics/top-categories`  
**Auth:** Required

**Query Parameters:**
- `limit` (number, default: 5)
- `startDate` (YYYY-MM-DD)
- `endDate` (YYYY-MM-DD)

---

## Error Responses

All endpoints follow consistent error format:

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "message": "Validation error message",
    "code": "VALIDATION_ERROR"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHORIZED"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "message": "Resource not found",
    "code": "NOT_FOUND"
  }
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": {
    "message": "Resource already exists",
    "code": "CONFLICT"
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "message": "Internal server error",
    "code": "INTERNAL_ERROR"
  }
}
```

---

## Rate Limiting

**Strict Limiter** (Auth endpoints):
- 10 requests per minute
- Applied to: `/auth/signup`, `/auth/login`

**Lenient Limiter** (General endpoints):
- 100 requests per minute
- Applied to: All other endpoints

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642512000
```

When rate limit exceeded:
```json
{
  "success": false,
  "error": {
    "message": "Too many requests. Please try again later.",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

---

## Caching

Dashboard endpoints are cached with Redis:
- Cache duration: 5 minutes (300 seconds)
- Cache key format: `dashboard:{userId}:{endpoint}`
- Automatic cache invalidation on data changes

---

**For detailed examples and use cases, see [README.md](../README.md)**

**Created:** January 18, 2026  
**Version:** 1.0  
**Status:** Production Ready
