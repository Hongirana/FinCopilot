# FinCopilot

AI-Powered Personal Finance Copilot Project

## Table of Contents

- [Project Overview](#project-overview)
- [Installation](#installation)
- [Usage](#usage)
- [Endpoints](#endpoints)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

This project is an AI-powered personal finance copilot. It provides a set of APIs for managing user accounts, transactions, and filtering transactions based on various criteria.

## Installation

1. Clone the repository:
git clone https://github.com/hongiranau/fin-copilot.git


2. Install the dependencies:
npm install 



3. Set up the environment variables:
- Create a `.env` file in the root directory and add the following variables:
  ```
  DB_HOST=localhost
  DB_PORT=5432
  DB_USER=your-db-user
  DB_PASSWORD=your-db-password
  DB_NAME=your-db-name
  JWT_SECRET=your-jwt-secret
  ```

4. Run the migrations:
npx prisma migrate dev or npm run db:migrate

5. Start the server:    
npm run dev     


## Usage

To use the FinCopilot APIs, you can make HTTP requests to the following endpoints:

### Endpoints

| Method | Endpoint                 | Description                                                                                         |
|--------|-------------------------|-----------------------------------------------------------------------------------------------------------|
| GET     | `/api/users`              | Get a list of all users                                                                           |
| POST    | `/api/users/signup`       | Sign up a new user with email and password                                                            |
| POST    | `/api/users/login`        | Log in a user with email and password and receive a JWT token                                             |
| GET     | `/api/accounts`          | Get a list of all accounts for the authenticated user                                                |
| POST    | `/api/accounts`          | Create a new account for the authenticated user                                                     |
| GET     | `/api/accounts/:id`      | Get a single account by ID for the authenticated user                                                |
| PUT     | `/api/accounts/:id`      | Update an account for the authenticated user                                                          |
| GET     | `/api/transactions`      | Get a list of all transactions for the authenticated user                                             |
| POST    | `/api/transactions`      | Create a new transaction for the authenticated user                                                  |
| GET     | `/api/transactions/:id`  | Get a single transaction by ID for the authenticated user                                             |
| PUT     | `/api/transactions/:id`  | Update a transaction for the authenticated user                                                      |
| DELETE  | `/api/transactions/:id`  | Delete a transaction for the authenticated user                                                       |

### Database Schema

The project uses PostgreSQL as the database. The database schema includes the following tables:

- `users`: Stores user information such as email and password.
- `accounts`: Stores account information such as name and balance.
- `transactions`: Stores transaction information such as amount, date, and category.


#### Authentication
Authentication is handled using JSON Web Tokens (JWT). The server expects the JWT token to be included in the Authorization header of each request. For example:

Authorization: Bearer <jwt-token>

created Login and signup routes for user authentication.   
and For Password Authentication I used bcrypt to hash the password and compare it with the hashed password stored in the database.

For JWT Authentication I used jsonwebtoken to generate and verify JWT tokens.

###### Account Model & CRUD Operations Complete

| Task | Status | Details |
|------|--------|---------|
| Account model created in Prisma | ✅ | One-to-many User → Account relationship |
| Account database operations (CRUD) | ✅ | Create, Read, Update, Delete via Prisma |
| Account controller with endpoints | ✅ | 5 endpoints: List, Create, Get, Update, Delete |
| Account routes configured | ✅ | Express routes mounted on /api/accounts |
| All CRUD operations tested | ✅ | Postman verified all endpoints |
| User scoping verified (security) | ✅ | Users only access their own accounts |
| Code committed | ✅ | Git commit with proper message |



Account Model Structure

```
User (1) ─────────┐
                  │ One-to-Many
                  │
              Account (Many)
              ├── id (UUID)
              ├── userId (Foreign Key)
              ├── name (Checking, Savings, etc.)
              ├── type (CHECKING, SAVINGS, INVESTMENT)
              ├── balance (Decimal - critical!)
              ├── createdAt
              └── updatedAt
```


###### Transactions and Transaction Api 

This section documents the Transactions API for the FinCopilot backend, including endpoints, filters, pagination, and auto-categorization behavior.

Base URL : /api/transactions

Endpoints : 

POST /api/transactions
Authorization: Bearer <jwt-token>
Content-Type: application/json

Request body: 

{
  "accountId": "acc_123456",
  "type": "debit",
  "category": "food",
  "amount": 499.99,
  "merchant": "Domino's Pizza",
  "description": "Weekend dinner",
  "date": "2025-12-25T18:30:00.000Z"
}

type: "debit" or "credit" (enum TransactionType)

category: One of the Category enum values (food, rent, utilities, transport, entertainment, shopping, medical, insurance, education, savings, salary, other)

If category is omitted, the system will attempt auto-categorization (see below).

Response body:

{
  "message": "Transaction created successfully",
  "autoCategorized": true,
  "transaction": {
    "id": "txn_01JKX8QW7F2R5MM7C4T9E91XPV",
    "userId": "user_123",
    "accountId": "acc_123456",
    "amount": "499.99",
    "type": "debit",
    "category": "food",
    "merchant": "Domino's Pizza",
    "description": "Weekend dinner",
    "date": "2025-12-25T18:30:00.000Z",
    "createdAt": "2025-12-25T19:00:00.000Z",
    "updatedAt": "2025-12-25T19:00:00.000Z"
  }
}


Get Transactions (List + Filters + Pagination) : 

GET /api/transactions
Authorization: Bearer <jwt-token>
 
Query parameters (all optional):

Pagination

  page: Page number (default: 1)

  limit: Page size (default: 10)

Filters

  startDate: ISO date string – include transactions with date >= startDate
  endDate: ISO date string – include transactions with date <= endDate
  category: Category enum value (e.g., food, rent, transport, …)
  merchant: Partial match on merchant name (case-insensitive)
  minAmount: Minimum amount (inclusive)
  maxAmount: Maximum amount (inclusive)
  search: Text search in description (case-insensitive)

All filters are combined with AND logic.

Example request:

text
GET /api/transactions?page=1&limit=10&category=food&minAmount=100&maxAmount=1000&startDate=2025-12-01&endDate=2025-12-31&merchant=domino&search=dinner
Example response:

json
{
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 3,
    "totalPages": 1
  },
  "filters": {
    "category": "food",
    "merchant": "domino",
    "minAmount": 100,
    "maxAmount": 1000,
    "startDate": "2025-12-01",
    "endDate": "2025-12-31",
    "search": "dinner"
  },
  "data": [
    {
      "id": "txn_01JKX8QW7F2R5MM7C4T9E91XPV",
      "userId": "user_123",
      "accountId": "acc_123456",
      "amount": "499.99",
      "type": "debit",
      "category": "food",
      "merchant": "Domino's Pizza",
      "description": "Weekend dinner with friends",
      "date": "2025-12-25T18:30:00.000Z",
      "createdAt": "2025-12-25T19:00:00.000Z",
      "updatedAt": "2025-12-25T19:00:00.000Z"
    }
  ]
}
Update Transaction
text
PUT /api/transactions/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json
Request body (all fields optional, partial update):

json
{
  "amount": 550.00,
  "category": "entertainment",
  "merchant": "PVR Cinemas",
  "description": "Movie + snacks",
  "date": "2025-12-26T16:00:00.000Z"
}
Only provided fields are updated; others remain unchanged.

Example response:

json
{
  "message": "Transaction updated successfully",
  "transaction": {
    "id": "txn_01JKX8QW7F2R5MM7C4T9E91XPV",
    "userId": "user_123",
    "accountId": "acc_123456",
    "amount": "550.00",
    "type": "debit",
    "category": "entertainment",
    "merchant": "PVR Cinemas",
    "description": "Movie + snacks",
    "date": "2025-12-26T16:00:00.000Z",
    "createdAt": "2025-12-25T19:00:00.000Z",
    "updatedAt": "2025-12-26T17:00:00.000Z"
  }
}



Delete Transaction

End Point Url : DELETE /api/transactions/:id
Authorization: Bearer <jwt-token>
Example response:

json
{
  "message": "Transaction deleted successfully"
}
Filters
The Transactions API supports flexible filtering:

startDate / endDate:

Filter transactions between two dates using the date field.

category:

Filter by enum Category (food, rent, utilities, transport, entertainment, shopping, medical, insurance, education, savings, salary, other).

merchant:

Case-insensitive partial match on merchant name.

minAmount / maxAmount:

Numeric range filter on amount (inclusive).

search:

Text search in description (case-insensitive).

All supplied filters are combined with AND logic.

Pagination
Pagination is offset-based using page and limit:

page:

1-based page index.

limit:

Number of items per page.

Backend computes:

skip = (page - 1) * limit

take = limit

Response includes:

json
"meta": {
  "page": 2,
  "limit": 10,
  "totalItems": 47,
  "totalPages": 5
}
Use this to drive pagination in the UI (Next/Previous buttons, page numbers).

Auto-Categorization
When creating a transaction:

If category is provided in the request:

The API uses the provided category as-is.

If category is not provided:

The backend runs an auto-categorization utility that:

Normalizes merchant and description to lowercase text.

Checks them against keyword rules defined in categoryRules.json.

Returns the first matching category.

Falls back to "other" if no rules match.

Examples of rules:

food:

Keywords like: domino, pizza, mcdonald, restaurant, cafe, starbucks, zomato, swiggy, grocery, etc.

transport:

Keywords like: uber, ola, taxi, metro, bus, train, fuel, parking, toll, etc.

entertainment:

Keywords like: netflix, prime, spotify, movie, cinema, etc.

shopping:

Keywords like: amazon, flipkart, myntra, ajio, nykaa, mall, etc.

Behavior example:

Request without category:

merchant: "Domino's Pizza"

description: "Weekend dinner"

Auto-categorizer → food

Request without category:

merchant: "Uber"

description: "Trip to airport"

Auto-categorizer → transport

No matching keywords:

Returns "other".

The create response includes a flag:

json
"autoCategorized": true
to indicate that the category was assigned automatically.