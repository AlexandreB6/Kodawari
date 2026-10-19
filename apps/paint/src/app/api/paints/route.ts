/**
 * Route API : /api/paints
 * CRUD pour les peintures possédées (OwnedPaint).
 * Scopé à l'utilisateur courant (compte ou invité). Sans session, les
 * mutations répondent 401 NO_SESSION.
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { noSessionResponse } from "@repo/auth/scope";
import { currentUserId, ownerFilter } from "@/lib/scope";

/** Liste les peintures de l'utilisateur courant, filtrées par range optionnelle. */
export async function GET(req: NextRequest) {
  const range = req.nextUrl.searchParams.get("range");
  const filter = await ownerFilter();
  const paints = await prisma.ownedPaint.findMany({
    where: range ? { range, ...filter } : filter,
  });
  return NextResponse.json(paints);
}

/** Ajoute une peinture à l'inventaire (upsert pour l'utilisateur courant). */
export async function POST(req: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return noSessionResponse();
  const { paintId, range = "citadel", quantity = 1 } = await req.json();
  if (!paintId) {
    return NextResponse.json({ error: "paintId required" }, { status: 400 });
  }

  const existing = await prisma.ownedPaint.findFirst({
    where: { paintId, range, userId },
  });

  const paint = existing
    ? await prisma.ownedPaint.update({
        where: { id: existing.id },
        data: { quantity },
      })
    : await prisma.ownedPaint.create({
        data: { paintId, range, quantity, userId },
      });

  revalidatePath("/");
  return NextResponse.json(paint);
}

/** Met à jour la quantité et/ou les notes d'une peinture possédée. */
export async function PUT(req: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return noSessionResponse();
  const { paintId, range = "citadel", quantity, notes } = await req.json();
  if (!paintId) {
    return NextResponse.json({ error: "paintId required" }, { status: 400 });
  }

  const existing = await prisma.ownedPaint.findFirst({
    where: { paintId, range, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Paint not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (quantity !== undefined) data.quantity = quantity;
  if (notes !== undefined) data.notes = notes;

  const paint = await prisma.ownedPaint.update({ where: { id: existing.id }, data });
  revalidatePath("/");
  return NextResponse.json(paint);
}

/** Supprime une peinture de l'inventaire. */
export async function DELETE(req: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return noSessionResponse();
  const { paintId, range = "citadel" } = await req.json();
  if (!paintId) {
    return NextResponse.json({ error: "paintId required" }, { status: 400 });
  }

  const existing = await prisma.ownedPaint.findFirst({
    where: { paintId, range, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Paint not found" }, { status: 404 });
  }

  await prisma.ownedPaint.delete({ where: { id: existing.id } });
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
