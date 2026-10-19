/**
 * Scope utilisateur de l'app TCG : chaque exemplaire possédé appartient à
 * un compte ou à un invité (voir @repo/auth/scope).
 */

import { createUserScope } from "@repo/auth/scope";
import { prisma } from "@/lib/prisma";

export const { currentUser, currentUserId, currentAccount, ownerFilter, applyPendingMerges } =
  createUserScope({
    app: "tcg",
    // Une ligne déjà présente chez le compte cible l'emporte : la copie de
    // l'invité est supprimée pour respecter @@unique([scryfallId, finish, lang, userId]).
    mergeGuestData: async (fromId, toId) => {
      const existing = await prisma.ownedCard.findMany({
        where: { userId: toId },
        select: { scryfallId: true, finish: true, lang: true },
      });
      await prisma.$transaction([
        prisma.ownedCard.deleteMany({ where: { userId: fromId, OR: existing } }),
        prisma.ownedCard.updateMany({ where: { userId: fromId }, data: { userId: toId } }),
      ]);
    },
  });
