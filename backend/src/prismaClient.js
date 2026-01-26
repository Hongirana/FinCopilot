require('dotenv').config();

const userMiddleware = require('./middleware/userMiddleware');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('./generated/prisma');

console.log("DATABASE_URL:", process.env.DATABASE_URL);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 75,                          // ⬆️ Increased from 20
  min: 10,                           // ⬆️ Increased from 2
  idleTimeoutMillis: 30000,         // Same
  connectionTimeoutMillis: 10000,   // Same
  allowExitOnIdle: false,           // ✅ Changed to false for stability

  // ✅ NEW: Add keep-alive
  keepAlive: true,
  keepAliveInitialDelayMillis: 100000,

  // ✅ NEW: Add statement timeout
  statement_timeout: 300000,         // 30 seconds max per query

  // ✅ NEW: Add query timeout
  query_timeout: 300000
});
const adapter = new PrismaPg(pool);

const basePrisma = new PrismaClient({ adapter })

const prisma = basePrisma.$extends({
  query: userMiddleware
});

// ✅ IMPROVED: Better graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n[Prisma] Graceful shutdown initiated...');
  try {
    await pool.end();
    await prisma.$disconnect();
    console.log('[Prisma] Connections closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('[Prisma] Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

pool.on('error', (err) => {
  console.error('[Pool] Unexpected error on idle client', err);
});

pool.on('connect', () => {
  console.log('[Pool] New client connected');
});

pool.on('remove', () => {
  console.log('[Pool] Client removed');
});


module.exports = prisma;