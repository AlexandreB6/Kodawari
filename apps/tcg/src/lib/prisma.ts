/**
 * Singleton Prisma Client.
 * En développement, l'instance est stockée sur `globalThis` pour survivre
 * au hot-reload de Next.js et éviter d'ouvrir de nouvelles connexions à chaque modification.
 */

import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
