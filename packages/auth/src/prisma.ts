/**
 * Client Prisma de la base `auth`, partagé par les 3 apps.
 * Singleton sur `globalThis` en dev pour survivre au hot-reload.
 */

import { PrismaClient } from "./generated/prisma";

const globalForAuthDb = globalThis as unknown as { authDb: PrismaClient };

export const authDb = globalForAuthDb.authDb || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForAuthDb.authDb = authDb;
