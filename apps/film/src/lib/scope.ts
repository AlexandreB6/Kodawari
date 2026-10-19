/**
 * Scope utilisateur de l'app Cinéma : chaque film appartient à un compte ou
 * à un invité (voir @repo/auth/scope).
 */

import { createUserScope } from "@repo/auth/scope";
import { prisma } from "@/lib/prisma";

export const { currentUser, currentUserId, currentAccount, ownerFilter, applyPendingMerges } =
  createUserScope({
    app: "film",
    // Un film déjà présent chez le compte cible l'emporte : la copie de
    // l'invité est supprimée pour respecter @@unique([tmdbId, userId]).
    mergeGuestData: async (fromId, toId) => {
      const existing = await prisma.movie.findMany({
        where: { userId: toId, tmdbId: { not: null } },
        select: { tmdbId: true },
      });
      await prisma.$transaction([
        prisma.movie.deleteMany({
          where: { userId: fromId, tmdbId: { in: existing.map((m) => m.tmdbId!) } },
        }),
        prisma.movie.updateMany({ where: { userId: fromId }, data: { userId: toId } }),
      ]);
    },
  });
