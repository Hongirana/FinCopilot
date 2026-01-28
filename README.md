# 🚀 FinCopilot - AI-Powered Personal Finance Manager

An intelligent personal finance management platform that helps users track expenses, manage budgets, set financial goals, and get AI-powered insights.

## ✨ Features

### Core Features
- 🔐 Secure Authentication (JWT + bcrypt)
- 💳 Multi-Account Management (Bank, Credit Card, Cash, Investment)
- 💸 Transaction Tracking with AI Auto-Categorization
- 📊 Budget Planning & Monitoring
- 🎯 Financial Goal Setting & Progress Tracking
- 📈 Analytics Dashboard with Visual Insights
- 📄 Report Generation (PDF/Excel)

### AI Features
- 🤖 OpenAI GPT-4 & Google Gemini Integration
- 🏷️ Smart Transaction Categorization
- 💡 AI-Powered Financial Insights
- 📚 Learning from User Feedback

### Performance
- ⚡ Redis Caching (4ms average response time)
- 🔄 Optimized Database Queries
- 📊 Load Tested: 50+ req/sec capacity

## 🛠️ Tech Stack

**Backend:**
- Node.js & Express.js
- PostgreSQL with Prisma ORM
- Redis for caching
- JWT Authentication

**Frontend:**
- React 19
- Tailwind CSS v4
- Vite
- React Router v7

**AI/ML:**
- OpenAI GPT-4 API
- Google Gemini API

**Testing:**
- Jest (164 automated tests)
- Artillery (Load testing)
- 280+ manual test cases

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file
npx prisma generate
npx prisma db push
npm run dev



### Frontend Setup
```bash
cd frontend
npm install
npm run dev


### Testing Setup
```bash 
# Run automated tests
npm test

# Run integration tests
npm run test:integration

# Run load tests
cd tests/load-testing
artillery run mixed-load-test.yml



 API Endpoints

Authentication
-------------------------
POST /api/auth/register - User registration

POST /api/auth/login - User login

POST /api/auth/logout - User logout

Accounts
-------------------------
GET /api/accounts - Get all accounts

POST /api/accounts - Create account

PUT /api/accounts/:id - Update account

DELETE /api/accounts/:id - Delete account

Transactions
-------------------------
GET /api/transactions - Get all transactions

POST /api/transactions - Create transaction

PUT /api/transactions/:id - Update transaction

DELETE /api/transactions/:id - Delete transaction

View full API documentation



 --------------- Project Stats ------------
 * Total Lines of Code: ~15,000+

 * API Endpoints: 50+

 * Test Coverage: ~70-75%

 * Automated Tests: 164 (100% passing)

 * Manual Test Cases: 280+

 * Development Time: 8 weeks

 * Load Test Result: 70-85% success at 50+ req/sec


 --------------Future Enhancements ------------
 
 * Mobile app (React Native)

 * Real-time notifications

 * Bank integration (Plaid API)

 * Investment portfolio tracking

 * Tax calculation & reporting

 * Multi-currency support


 --------------Author--------------------

 Hongirana U 

 Node.js Backend Developer
 Full Stack Developer (MERN)


 ------------📄 License ----------- 
 
 MIT License


 ## 🚀 Deployment

### Production
- **Backend API:** https://fincopilot-api.onrender.com
- **Status:** ✅ Live
- **Deployed:** January 27, 2026

### Tech Stack
- **Hosting:** Render
- **Database:** PostgreSQL (1GB)
- **Cache:** Redis (25MB)
- **Region:** Singapore (Southeast Asia)
