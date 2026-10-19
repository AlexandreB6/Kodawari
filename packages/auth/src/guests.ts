/**
 * Nettoyage quotidien des invités (Vercel Cron, voir vercel.json).
 *
 *   // apps/<app>/src/app/api/cron/cleanup-guests/route.ts
 *   export const GET = createGuestCleanupRoute({ … });
 *
 * Pour chaque app :
 * 1. applique les rattachements invité → compte restés en attente, pour ne
 *    pas laisser de lignes orphelines si l'utilisateur ne revient pas ;
 * 2. supprime les lignes des invités inactifs depuis 30 jours.
 * L'app désignée par `purgeAuthUsers` supprime ensuite ces invités de la base
 * auth, avec 5 jours de marge pour que les autres apps soient passées avant.
 */

import { NextRequest, NextResponse } from "next/server";
import { authDb } from "./prisma";

const DAY_MS = 24 * 60 * 60 * 1000;
const ROWS_RETENTION_DAYS = 30;
const USERS_RETENTION_DAYS = 35;

/** Invités sans session active depuis `days` jours. */
function inactiveGuestsWhere(days: number) {
  const cutoff = new Date(Date.now() - days * DAY_MS);
  return {
    isAnonymous: true,
    createdAt: { lt: cutoff },
    sessions: { none: { updatedAt: { gte: cutoff } } },
  };
}

export interface GuestCleanupOptions {
  /** `applyPendingMerges` du scope de l'app (sans filtre : tous les comptes). */
  applyPendingMerges: () => Promise<number>;
  /** Supprime les lignes de l'app appartenant à ces utilisateurs. */
  deleteUserRows: (userIds: string[]) => Promise<number>;
  /** Une seule app purge la base auth. */
  purgeAuthUsers?: boolean;
}

export function createGuestCleanupRoute({
  applyPendingMerges,
  deleteUserRows,
  purgeAuthUsers = false,
}: GuestCleanupOptions) {
  return async function GET(req: NextRequest) {
    const header = req.headers.get("authorization");
    if (!process.env.CRON_SECRET || header !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const merged = await applyPendingMerges();

    const guests = await authDb.user.findMany({
      where: inactiveGuestsWhere(ROWS_RETENTION_DAYS),
      select: { id: true },
    });
    const deletedRows = guests.length ? await deleteUserRows(guests.map((g) => g.id)) : 0;

    let deletedUsers = 0;
    if (purgeAuthUsers) {
      const { count } = await authDb.user.deleteMany({
        where: inactiveGuestsWhere(USERS_RETENTION_DAYS),
      });
      deletedUsers = count;
    }

    return NextResponse.json({ ok: true, merged, deletedRows, deletedUsers });
  };
}
