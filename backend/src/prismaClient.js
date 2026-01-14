require('dotenv').config();

const userMiddleware = require('./middleware/userMiddleware');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('./generated/prisma');

console.log("DATABASE_URL:", process.env.DATABASE_URL);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const basePrisma  = new PrismaClient({ adapter })

const prisma = basePrisma.$extends({
  query: userMiddleware
});

module.exports = prisma;