/**
 * Route API : /api/paints
 * CRUD pour les peintures possédées (OwnedPaint).
 * Demo mode: writes are scoped per visitor via demoSessionId cookie.
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  assertDemoOwnership,
  demoFilter,
  demoWriteData,
  DemoForbiddenError,
} from "@repo/core/demo";
import { ownerGateResponse } from "@repo/core/owner";

/** Message renvoyé quand le visiteur tente de modifier une ligne du catalogue de démo. */
const SHARED_PAINT_MESSAGE =
  "Cette peinture fait partie du catalogue partagé et ne peut pas être modifiée.";

/** Liste les peintures visibles pour la session courante, filtrées par range optionnelle. */
export async function GET(req: NextRequest) {
  const range = req.nextUrl.searchParams.get("range");
  const filter = await demoFilter();
  const where = range ? { AND: [{ range }, filter] } : filter;
  const paints = await prisma.ownedPaint.findMany({ where });
  return NextResponse.json(paints);
}

/** Ajoute une peinture à l'inventaire (upsert scoped par demoSessionId). */
export async function POST(req: NextRequest) {
  const gate = await ownerGateResponse();
  if (gate) return gate;
  const { paintId, range = "citadel", quantity = 1 } = await req.json();
  if (!paintId) {
    return NextResponse.json({ error: "paintId required" }, { status: 400 });
  }

  const { demoSessionId } = await demoWriteData();
  const existing = await prisma.ownedPaint.findFirst({
    where: { paintId, range, demoSessionId },
  });

  const paint = existing
    ? await prisma.ownedPaint.update({
        where: { id: existing.id },
        data: { quantity },
      })
    : await prisma.ownedPaint.create({
        data: { paintId, range, quantity, demoSessionId },
      });

  revalidatePath("/");
  return NextResponse.json(paint);
}

/** Met à jour la quantité et/ou les notes d'une peinture possédée. */
export async function PUT(req: NextRequest) {
  const gate = await ownerGateResponse();
  if (gate) return gate;
  const { paintId, range = "citadel", quantity, notes } = await req.json();
  if (!paintId) {
    return NextResponse.json({ error: "paintId required" }, { status: 400 });
  }

  const filter = await demoFilter();
  const existing = await prisma.ownedPaint.findFirst({
    where: { paintId, range, ...filter },
  });
  if (!existing) {
    return NextResponse.json({ error: "Paint not found" }, { status: 404 });
  }

  try {
    await assertDemoOwnership(existing.demoSessionId, SHARED_PAINT_MESSAGE);
  } catch (e) {
    if (e instanceof DemoForbiddenError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
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
  const gate = await ownerGateResponse();
  if (gate) return gate;
  const { paintId, range = "citadel" } = await req.json();
  if (!paintId) {
    return NextResponse.json({ error: "paintId required" }, { status: 400 });
  }

  const filter = await demoFilter();
  const existing = await prisma.ownedPaint.findFirst({
    where: { paintId, range, ...filter },
  });
  if (!existing) {
    return NextResponse.json({ error: "Paint not found" }, { status: 404 });
  }

  try {
    await assertDemoOwnership(existing.demoSessionId, SHARED_PAINT_MESSAGE);
  } catch (e) {
    if (e instanceof DemoForbiddenError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }

  await prisma.ownedPaint.delete({ where: { id: existing.id } });
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
