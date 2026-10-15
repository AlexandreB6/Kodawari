/**
 * Scope utilisateur de l'app Peinture : chaque peinture possédée appartient à
 * un compte ou à un invité (voir @repo/auth/scope).
 */

import { createUserScope } from "@repo/auth/scope";
import { prisma } from "@/lib/prisma";

export const { currentUser, currentUserId, currentAccount, ownerFilter, applyPendingMerges } =
  createUserScope({
    app: "paint",
    // Une peinture déjà présente chez le compte cible l'emporte : la copie de
    // l'invité est supprimée pour respecter @@unique([paintId, range, userId]).
    mergeGuestData: async (fromId, toId) => {
      const existing = await prisma.ownedPaint.findMany({
        where: { userId: toId },
        select: { paintId: true, range: true },
      });
      await prisma.$transaction([
        prisma.ownedPaint.deleteMany({
          where: {
            userId: fromId,
            OR: existing.map(({ paintId, range }) => ({ paintId, range })),
          },
        }),
        prisma.ownedPaint.updateMany({ where: { userId: fromId }, data: { userId: toId } }),
      ]);
    },
  });
