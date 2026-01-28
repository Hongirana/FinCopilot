# FinCopilot Deployment Guide

## Prerequisites
- Render account
- GitHub repository
- Environment variables ready

## Backend Deployment Steps
1. Create PostgreSQL database
2. Create Redis instance
3. Create Web Service
4. Configure environment variables
5. Run migrations: `npx prisma migrate deploy`
6. Test endpoints

## Environment Variables Required
- DATABASE_URL
- REDIS_URL
- JWT_SECRET
- NODE_ENV
- PORT

See `.env.example` for reference.
