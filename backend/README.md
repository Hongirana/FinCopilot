# FinCopilot - AI-Powered Personal Finance Management

**Full-Stack MERN Application with AI Integration**

[![Tests](https://img.shields.io/badge/tests-164%20passing-brightgreen)](tests)
[![Coverage](https://img.shields.io/badge/coverage-100%25-success)](coverage)
[![Node](https://img.shields.io/badge/node-18.x-green)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Development Progress](#development-progress)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Project Overview

FinCopilot is an AI-powered personal finance management application that helps users track expenses, manage budgets, set financial goals, and gain insights through intelligent analytics. Built with the MERN stack and integrated with AI for automatic transaction categorization.

### Key Highlights

- 🤖 **AI-Powered Categorization** - Automatic transaction categorization using Gemini API
- 📊 **Real-Time Budget Tracking** - Automated budget monitoring with alerts
- 🎯 **Goal Management** - Track financial goals with progress calculation
- 📈 **Advanced Analytics** - Spending trends, category breakdown, and financial insights
- 🔐 **Secure Authentication** - JWT-based auth with bcrypt password hashing
- ⚡ **High Performance** - Redis caching, rate limiting, and optimized queries
- ✅ **100% Test Coverage** - 164 integration tests passing

---

## ✨ Features

### Core Features

#### 🔐 Authentication & User Management
- User registration with email/password
- JWT-based authentication
- Password encryption with bcrypt
- User profile management
- Password change functionality
- User statistics and activity tracking

#### 💳 Account Management
- Multiple account support (checking, savings, credit card, investment, cash)
- Real-time balance tracking
- Account CRUD operations
- Account summary and statistics

#### 💸 Transaction Management
- Create, read, update, delete transactions
- Automatic AI categorization (using Gemini API)
- Manual category override
- Advanced filtering (date range, category, amount, merchant)
- Full-text search across description/merchant
- Pagination and sorting
- Transaction statistics

#### 📊 Budget Management
- Category-based budgets
- Multiple budget periods (daily, weekly, monthly, yearly)
- Automatic budget tracking from transactions
- Budget alerts (80% threshold by default)
- Budget status calculation (spent, remaining, days left)
- Overlapping budget prevention
- Budget recalculation endpoint

#### 🎯 Goal Tracking
- Financial goal creation and tracking
- Progress calculation
- Deadline tracking
- Goal status (active, completed, cancelled)
- Contribution tracking
- Goal statistics and overview

#### 📈 Dashboard & Analytics
- Comprehensive financial dashboard
- Current/previous month comparison
- Net worth calculation
- Cash flow analysis
- Spending velocity metrics
- Savings rate calculation
- Top expense categories
- Budget and goal overviews
- Recent activity feed
- Smart alerts and notifications

#### 🔍 Advanced Features
- Multi-field transaction search
- Dynamic query building
- Date range filtering
- Amount range filtering
- Category filtering (single or multiple)
- Merchant filtering
- Sorting and pagination
- Response caching (Redis)
- Rate limiting (strict/lenient tiers)

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 18.x
- **Framework:** Express.js
- **Database:** PostgreSQL 14+
- **ORM:** Prisma
- **Authentication:** JWT + bcrypt
- **Caching:** Redis
- **AI Integration:** Google Gemini API
- **Validation:** Express Validator
- **Testing:** Jest + Supertest

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **State Management:** React Query
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Charts:** Recharts
- **Icons:** Lucide React

### DevOps & Tools
- **Version Control:** Git
- **Testing:** Jest, Supertest
- **Linting:** ESLint
- **API Testing:** Postman
- **Database GUI:** Prisma Studio
- **Environment:** dotenv

---

## 🏗️ Architecture

```
FinCopilot/
├── backend/
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── utils/             # Helper functions
│   │   ├── services/          # Business logic (caching, AI)
│   │   ├── lib/               # Third-party configs
│   │   └── app.js             # Express app setup
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── migrations/        # Migration history
│   ├── tests/
│   │   ├── integration/       # API integration tests
│   │   ├── helpers/           # Test utilities
│   │   └── jest.config.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/        # Reusable components
    │   ├── pages/             # Route pages
    │   ├── services/          # API calls
    │   ├── hooks/             # Custom hooks
    │   ├── utils/             # Helper functions
    │   └── App.jsx
    └── package.json
```

---

## 📦 Installation

### Prerequisites
- Node.js 18.x or higher
- PostgreSQL 14 or higher
- Redis (optional, for caching)
- npm or yarn

### Clone Repository
```bash
git clone https://github.com/yourusername/FinCopilot.git
cd FinCopilot
```

### Backend Setup
```bash
cd backend
npm install
```

### Frontend Setup
```bash
cd frontend
npm install
```

---

## ⚙️ Environment Configuration

### Backend `.env`
Create `backend/.env`:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/fincopilot_db?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# AI Integration
GEMINI_API_KEY=your-gemini-api-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Test Database `.env.test`
Create `backend/.env.test`:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/fincopilot_db_test?schema=public"
NODE_ENV=test
```

### Frontend `.env`
Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

---

## 🗄️ Database Setup

### Development Database
```bash
cd backend

# Create database
createdb fincopilot_db

# Run migrations
npx prisma migrate dev

# (Optional) Seed data
npm run seed

# Open Prisma Studio (DB GUI)
npx prisma studio
```

### Test Database
```bash
# Create test database
createdb fincopilot_db_test

# Apply schema
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/fincopilot_db_test" npx prisma db push
```

### Using Migrations (Recommended for Production)

When you update the schema:

```bash
# Create migration
npx prisma migrate dev --name add_new_feature

# Apply to production
npx prisma migrate deploy
```

---

## 🚀 Running the Application

### Backend (Development)
```bash
cd backend
npm run dev
```
Server runs on `http://localhost:3000`

### Frontend (Development)
```bash
cd frontend
npm run dev
```
App runs on `http://localhost:5173`

### Production Build
```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

---

## 📚 API Documentation

Full API documentation: [docs/API.md](docs/API.md)

### Base URL
```
http://localhost:3000/api
```

### Authentication
All protected endpoints require JWT token:
```
Authorization: Bearer <your_token>
```

### Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Auth** |||
| POST | `/auth/signup` | Register new user |
| POST | `/auth/login` | User login |
| **Transactions** |||
| GET | `/transactions` | List with filters & pagination |
| GET | `/transactions/search` | Full-text search |
| POST | `/transactions` | Create transaction |
| GET | `/transactions/:id` | Get single transaction |
| PUT | `/transactions/:id` | Update transaction |
| DELETE | `/transactions/:id` | Delete transaction |
| **Budgets** |||
| GET | `/budgets` | List budgets |
| POST | `/budgets` | Create budget |
| GET | `/budgets/:id` | Get budget |
| PUT | `/budgets/:id` | Update budget |
| DELETE | `/budgets/:id` | Delete budget |
| GET | `/budgets/alerts` | Budget alerts |
| POST | `/budgets/recalculate` | Recalculate budgets |
| **Goals** |||
| GET | `/goals` | List goals |
| POST | `/goals` | Create goal |
| GET | `/goals/:id` | Get goal |
| PUT | `/goals/:id` | Update goal |
| DELETE | `/goals/:id` | Delete goal |
| PATCH | `/goals/:id/progress` | Add contribution |
| GET | `/goals/stats` | Goal statistics |
| **Dashboard** |||
| GET | `/dashboard/summary` | Monthly summary |
| GET | `/dashboard/stats` | Financial stats |
| GET | `/dashboard/overview` | Quick overview |
| **User** |||
| GET | `/user/profile` | User profile |
| PUT | `/user/profile` | Update profile |
| PUT | `/user/change-password` | Change password |

---

## 🧪 Testing

### Run All Tests
```bash
cd backend
npm test
```

### Run Specific Test Suite
```bash
npm test -- auth.test.js
npm test -- transactions.test.js
npm test -- budgets.test.js
npm test -- dashboard.test.js
```

### Test Coverage
```bash
npm run test:coverage
```

### Test Results (Day 28)

| Test Suite | Tests | Status | Duration |
|------------|-------|--------|----------|
| auth.test.js | 15 | ✅ PASS | 2.1s |
| account.test.js | 17 | ✅ PASS | 2.3s |
| transaction.test.js | 9 | ✅ PASS | 1.8s |
| budgets.test.js | 17 | ✅ PASS | 3.6s |
| goals.test.js | 24 | ✅ PASS | 4.2s |
| user.test.js | 24 | ✅ PASS | 3.9s |
| dashboard.test.js | 12 | ✅ PASS | 3.3s |
| health.test.js | 11 | ✅ PASS | 1.5s |
| analyticsUtils.test.js | 35 | ✅ PASS | 5.1s |

**Total: 164 tests passing | 0 failures | 100% success rate** ✅

---

## 📁 Project Structure

```
backend/src/
├── controllers/
│   ├── authController.js          # Authentication logic
│   ├── userController.js          # User management
│   ├── accountController.js       # Account CRUD
│   ├── transactionController.js   # Transaction + AI categorization
│   ├── budgetController.js        # Budget management
│   ├── goalController.js          # Goal tracking
│   └── dashboardController.js     # Dashboard & analytics
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── accountRoutes.js
│   ├── transactionRoutes.js
│   ├── budgetRoutes.js
│   ├── goalRoutes.js
│   └── dashboardRoutes.js
├── middleware/
│   ├── authMiddleware.js          # JWT verification
│   ├── validators.js              # Input validation
│   ├── errorHandler.js            # Global error handler
│   ├── rateLimitMiddleware.js     # Rate limiting
│   └── cacheMiddleware.js         # Redis caching
├── utils/
│   ├── responseHelper.js          # Standardized responses
│   ├── budgetTracker.js           # Auto budget tracking
│   ├── dashboardUtils.js          # Dashboard calculations
│   ├── analyticsUtils.js          # Analytics functions
│   ├── dateHelper.js              # Date utilities
│   ├── queryBuilder.js            # Dynamic queries
│   └── customErrors.js            # Custom error classes
├── services/
│   ├── aiService.js               # Gemini AI integration
│   └── cacheService.js            # Redis caching logic
├── lib/
│   └── categoryRules.json         # AI categorization rules
└── app.js                         # Express app setup
```

---

## 📊 Development Progress

### ✅ Completed (Weeks 1-4)

**Week 1: Foundation**
- [x] Day 1-2: Project setup, database schema
- [x] Day 3: User authentication (signup, login)
- [x] Day 4: Account management
- [x] Day 5: Transaction CRUD
- [x] Day 6: Transaction filtering & pagination
- [x] Day 7: AI categorization integration

**Week 2: Core Features**
- [x] Day 8: Budget management system
- [x] Day 9: Goal tracking system
- [x] Day 10: Dashboard & analytics
- [x] Day 11: Advanced filtering
- [x] Day 12: Search functionality

**Week 3: Enhancement**
- [x] Day 13-14: Performance optimization (caching, rate limiting)
- [x] Day 15-21: Frontend development (React + TailwindCSS)

**Week 4: Testing & Polish**
- [x] Day 22-27: Frontend refinement
- [x] Day 28: Backend testing (164 tests) ✅
- [ ] Day 29-30: Manual E2E testing & bug fixes

### 🚧 In Progress
- Frontend component testing
- E2E automation (Playwright)
- Deployment setup

---

## 🎨 Categories

Valid transaction/budget categories:
- `food` - Groceries, restaurants, food delivery
- `rent` - Housing rent, lease payments
- `utilities` - Electricity, water, internet, gas
- `transport` - Fuel, public transport, ride-sharing, parking
- `entertainment` - Movies, games, streaming subscriptions
- `shopping` - Clothing, electronics, retail
- `medical` - Doctor visits, medicine, healthcare
- `insurance` - Life, health, auto insurance
- `education` - Courses, books, tuition fees
- `savings` - Investment, emergency fund contributions
- `salary` - Income (salary, wages)
- `other` - Miscellaneous expenses
- `uncategorized` - Auto-assigned when no match

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Coding Standards
- Follow ESLint rules
- Write tests for new features
- Update documentation
- Use semantic commit messages

---

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Kiran**  
MERN Stack Developer  
Previously: Node.js Backend Developer at Infosys Ltd

---

## 🙏 Acknowledgments

- Google Gemini API for AI categorization
- Prisma for excellent ORM
- Express.js community
- React ecosystem

---

## 📞 Support

For issues and questions:
- GitHub Issues: [Create Issue](https://github.com/yourusername/FinCopilot/issues)
- Email: your.email@example.com

---

**Built with ❤️ using MERN Stack**

**Last Updated:** January 18, 2026 (Day 28 Complete - 164 Tests Passing)
