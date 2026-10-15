/**
 * Scope utilisateur de l'app Manga : chaque série appartient à un compte ou
 * à un invité (voir @repo/auth/scope).
 */

import { createUserScope } from "@repo/auth/scope";
import { prisma } from "@/lib/prisma";

export const { currentUser, currentUserId, currentAccount, ownerFilter, applyPendingMerges } =
  createUserScope({
    app: "manga",
    // Une série déjà présente chez le compte cible l'emporte : la copie de
    // l'invité est supprimée pour respecter @@unique([malId, userId]).
    mergeGuestData: async (fromId, toId) => {
      const existing = await prisma.manga.findMany({
        where: { userId: toId },
        select: { malId: true },
      });
      await prisma.$transaction([
        prisma.manga.deleteMany({
          where: { userId: fromId, malId: { in: existing.map((m) => m.malId) } },
        }),
        prisma.manga.updateMany({ where: { userId: fromId }, data: { userId: toId } }),
      ]);
    },
  });
