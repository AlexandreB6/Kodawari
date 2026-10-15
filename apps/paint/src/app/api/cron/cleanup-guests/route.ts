/**
 * Route API : /api/cron/cleanup-guests
 * Déclenchée chaque nuit par Vercel Cron (voir vercel.json), avec
 * `Authorization: Bearer ${CRON_SECRET}`. Voir @repo/auth/guests.
 */

import { createGuestCleanupRoute } from "@repo/auth/guests";
import { prisma } from "@/lib/prisma";
import { applyPendingMerges } from "@/lib/scope";

export const GET = createGuestCleanupRoute({
  applyPendingMerges: () => applyPendingMerges(),
  deleteUserRows: async (userIds) =>
    (await prisma.ownedPaint.deleteMany({ where: { userId: { in: userIds } } })).count,
});
