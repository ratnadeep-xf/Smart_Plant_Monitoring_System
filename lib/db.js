// This file provides a Prisma client instance for database operations
import { PrismaClient } from '@prisma/client';

// Add prisma to the global object in development to prevent connection issues with hot reloading
const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;