/**
 * Route API : /api/manga
 * CRUD pour la collection de mangas, scopé à l'utilisateur courant (compte
 * ou invité). Sans session, les mutations répondent 401 NO_SESSION.
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { noSessionResponse } from "@repo/auth/scope";
import { currentUserId, ownerFilter } from "@/lib/scope";

/** Liste les mangas de l'utilisateur courant. */
export async function GET() {
  const mangas = await prisma.manga.findMany({
    where: await ownerFilter(),
    orderBy: { title: "asc" },
  });
  return NextResponse.json(mangas);
}

/** Ajoute un manga à la collection (upsert sur malId pour l'utilisateur courant). */
export async function POST(req: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return noSessionResponse();
  const body = await req.json();
  const { malId, title, titleJapanese, coverImage, author, volumes, chapters, synopsis, genres, demographic, score, status } = body;

  if (!malId || !title) {
    return NextResponse.json({ error: "malId and title required" }, { status: 400 });
  }

  const existing = await prisma.manga.findFirst({ where: { malId, userId } });

  const payload = { malId, title, titleJapanese, coverImage, author, volumes, chapters, synopsis, genres, demographic, score, status };

  const manga = existing
    ? await prisma.manga.update({ where: { id: existing.id }, data: payload })
    : await prisma.manga.create({ data: { ...payload, userId } });

  revalidatePath("/");
  return NextResponse.json(manga);
}

/** Met à jour ownedVolumesMap et/ou notes d'un manga. */
export async function PUT(req: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return noSessionResponse();
  const { malId, ownedVolumesMap, notes } = await req.json();
  if (!malId) {
    return NextResponse.json({ error: "malId required" }, { status: 400 });
  }

  const existing = await prisma.manga.findFirst({ where: { malId, userId } });
  if (!existing) {
    return NextResponse.json({ error: "Manga not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (ownedVolumesMap !== undefined) data.ownedVolumesMap = JSON.stringify(ownedVolumesMap);
  if (notes !== undefined) data.notes = notes;

  const manga = await prisma.manga.update({ where: { id: existing.id }, data });
  revalidatePath("/");
  return NextResponse.json(manga);
}

/** Supprime un manga de la collection. */
export async function DELETE(req: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return noSessionResponse();
  const { malId } = await req.json();
  if (!malId) {
    return NextResponse.json({ error: "malId required" }, { status: 400 });
  }

  const existing = await prisma.manga.findFirst({ where: { malId, userId } });
  if (!existing) {
    return NextResponse.json({ error: "Manga not found" }, { status: 404 });
  }

  await prisma.manga.delete({ where: { id: existing.id } });
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
