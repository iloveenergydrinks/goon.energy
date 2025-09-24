import { PrismaClient } from "@prisma/client";

type GlobalPrisma = typeof globalThis & { __prisma?: PrismaClient };

const globalForPrisma = globalThis as GlobalPrisma;

export const prisma =
  globalForPrisma.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}

