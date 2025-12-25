require('dotenv').config();

const userMiddleware = require('./middleware/userMiddleware');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('./generated/prisma');

console.log("DATABASE_URL:", process.env.DATABASE_URL);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter })

prisma.$use(userMiddleware); 

module.exports = prisma;