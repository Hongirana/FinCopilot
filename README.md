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