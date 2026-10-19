/**
 * Route API : /api/cards
 * Exemplaires possédés (OwnedCard), une ligne par carte × finition × langue.
 * Scopé à l'utilisateur courant (compte ou invité). Sans session, les
 * mutations répondent 401 NO_SESSION.
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { noSessionResponse } from "@repo/auth/scope";
import { currentUserId, ownerFilter } from "@/lib/scope";
import { CARD_MAP, isLang } from "@/data/catalog";

/** Liste les exemplaires de l'utilisateur courant. */
export async function GET() {
  const cards = await prisma.ownedCard.findMany({ where: await ownerFilter() });
  return NextResponse.json(cards);
}

/** Valide la carte, la finition et la langue du corps de requête. */
function parseKey(body: { scryfallId?: unknown; finish?: unknown; lang?: unknown }) {
  const card = typeof body.scryfallId === "string" ? CARD_MAP.get(body.scryfallId) : undefined;
  if (!card) return { error: "Carte inconnue" };
  if (!card.finishes.includes(body.finish as never)) return { error: "Finition indisponible pour cette carte" };
  if (!isLang(body.lang)) return { error: "Langue inconnue" };
  return { key: { scryfallId: card.id, finish: card.finishes.find((f) => f === body.finish)!, lang: body.lang } };
}

/**
 * Fixe la quantité d'un exemplaire (carte × finition × langue).
 * Une quantité de 0 supprime la ligne.
 */
export async function PUT(req: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return noSessionResponse();
  const body = await req.json();
  const { key, error } = parseKey(body);
  if (!key) return NextResponse.json({ error }, { status: 400 });
  const quantity = Number(body.quantity);
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 999) {
    return NextResponse.json({ error: "Quantité invalide" }, { status: 400 });
  }

  const where = { scryfallId_finish_lang_userId: { ...key, userId } };
  if (quantity === 0) {
    await prisma.ownedCard.deleteMany({ where: { ...key, userId } });
  } else {
    await prisma.ownedCard.upsert({
      where,
      create: { ...key, userId, quantity },
      update: { quantity },
    });
  }

  revalidatePath("/collection");
  return NextResponse.json({ ok: true });
}
