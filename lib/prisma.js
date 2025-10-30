// lib/prisma.js
import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
// See: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#prevent-hot-reloading-from-creating-new-instances-of-prismaclient

const globalForPrisma = global;

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Helper to ensure Prisma Client disconnects properly in serverless environments
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}

export default prisma;
