import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Garantir caminho dinâmico para /tmp no ambiente Serverless Vercel se for SQLite
if (process.env.VERCEL) {
  process.env.DATABASE_URL = 'file:/tmp/dev.db';
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
