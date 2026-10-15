/**
 * Route API : /api/movies
 * CRUD pour la collection de films vus, scopé à l'utilisateur courant
 * (compte ou invité). Sans session, les mutations répondent 401 NO_SESSION.
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { noSessionResponse } from "@repo/auth/scope";
import { currentUserId, ownerFilter } from "@/lib/scope";

/** Liste les films vus de l'utilisateur courant. */
export async function GET() {
  const movies = await prisma.movie.findMany({
    where: await ownerFilter(),
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(movies);
}

/** Ajoute un film vu (upsert sur tmdbId pour l'utilisateur courant). */
export async function POST(req: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return noSessionResponse();
  const body = await req.json();
  const { tmdbId, title, posterPath, overview, director, releaseYear, rating, watchedAt, watchedPrecision } = body;

  if (!tmdbId || !title) {
    return NextResponse.json({ error: "tmdbId and title required" }, { status: 400 });
  }

  const precision = watchedPrecision === "year" ? "year" : "day";
  const existing = await prisma.movie.findFirst({ where: { tmdbId, userId } });

  const data = {
    tmdbId,
    title,
    posterPath: posterPath ?? null,
    overview: overview ?? null,
    director: director ?? null,
    releaseYear: releaseYear ?? null,
    rating: rating != null ? Number(rating) : null,
    watchedAt: watchedAt ? new Date(watchedAt) : null,
    watchedPrecision: precision,
    userId,
  };

  const movie = existing
    ? await prisma.movie.update({
        where: { id: existing.id },
        data: {
          rating: data.rating,
          watchedAt: data.watchedAt ?? undefined,
          watchedPrecision: precision,
        },
      })
    : await prisma.movie.create({ data });

  revalidatePath("/");
  return NextResponse.json(movie);
}

/** Met à jour un film (rating, owned, watchedAt). */
export async function PUT(req: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return noSessionResponse();
  const body = await req.json();
  const { tmdbId, rating, owned, ownedFormat, watchedAt, watchedPrecision } = body;

  if (!tmdbId) {
    return NextResponse.json({ error: "tmdbId required" }, { status: 400 });
  }

  const existing = await prisma.movie.findFirst({ where: { tmdbId, userId } });
  if (!existing) {
    return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (rating !== undefined) data.rating = rating != null ? Number(rating) : null;
  if (owned !== undefined) data.owned = owned;
  if (ownedFormat !== undefined) data.ownedFormat = ownedFormat;
  if (watchedAt !== undefined) data.watchedAt = watchedAt ? new Date(watchedAt) : null;
  if (watchedPrecision !== undefined) data.watchedPrecision = watchedPrecision === "year" ? "year" : "day";

  const movie = await prisma.movie.update({ where: { id: existing.id }, data });
  revalidatePath("/");
  return NextResponse.json(movie);
}

/** Supprime un film de la collection. */
export async function DELETE(req: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return noSessionResponse();
  const { tmdbId } = await req.json();
  if (!tmdbId) {
    return NextResponse.json({ error: "tmdbId required" }, { status: 400 });
  }

  const existing = await prisma.movie.findFirst({ where: { tmdbId, userId } });
  if (!existing) {
    return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  }

  await prisma.movie.delete({ where: { id: existing.id } });
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
