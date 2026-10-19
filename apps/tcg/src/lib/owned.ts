import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/scope";
import type { OwnedLine } from "@/lib/useCollection";

/** Exemplaires de l'utilisateur courant, au format attendu par le client. */
export async function loadOwned(): Promise<OwnedLine[]> {
  // Sans session, la collection est vide : inutile d'interroger la base.
  const userId = await currentUserId();
  if (!userId) return [];
  const rows = await prisma.ownedCard.findMany({
    where: { userId },
    select: { scryfallId: true, finish: true, lang: true, quantity: true },
  });
  return rows as OwnedLine[];
}
