/**
 * Route API : /api/movies
 * CRUD pour la collection de films vus.
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
const SHARED_MOVIE_MESSAGE =
  "Ce film fait partie du catalogue partagé et ne peut pas être modifié.";

/** Liste tous les films visibles pour la session courante (seed + sandbox). */
export async function GET() {
  const filter = await demoFilter();
  const movies = await prisma.movie.findMany({
    where: filter,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(movies);
}

/** Ajoute un film vu (upsert scoped par demoSessionId). */
export async function POST(req: NextRequest) {
  const gate = await ownerGateResponse();
  if (gate) return gate;
  const body = await req.json();
  const { tmdbId, title, posterPath, overview, director, releaseYear, rating, watchedAt, watchedPrecision } = body;

  if (!tmdbId || !title) {
    return NextResponse.json({ error: "tmdbId and title required" }, { status: 400 });
  }

  const precision = watchedPrecision === "year" ? "year" : "day";
  const { demoSessionId } = await demoWriteData();

  const existing = await prisma.movie.findFirst({ where: { tmdbId, demoSessionId } });

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
    demoSessionId,
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
  revalidatePath("/");
  return NextResponse.json(movie);
}

/** Met à jour un film (rating, owned, watchedAt). */
export async function PUT(req: NextRequest) {
  const gate = await ownerGateResponse();
  if (gate) return gate;
  const body = await req.json();
  const { tmdbId, rating, owned, ownedFormat, watchedAt, watchedPrecision } = body;

  if (!tmdbId) {
    return NextResponse.json({ error: "tmdbId required" }, { status: 400 });
  }

  const filter = await demoFilter();
  const existing = await prisma.movie.findFirst({ where: { tmdbId, ...filter } });
  if (!existing) {
    return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  }

  try {
    await assertDemoOwnership(existing.demoSessionId, SHARED_MOVIE_MESSAGE);
  } catch (e) {
    if (e instanceof DemoForbiddenError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
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
  const gate = await ownerGateResponse();
  if (gate) return gate;
  const { tmdbId } = await req.json();
  if (!tmdbId) {
    return NextResponse.json({ error: "tmdbId required" }, { status: 400 });
  }

  const filter = await demoFilter();
  const existing = await prisma.movie.findFirst({ where: { tmdbId, ...filter } });
  if (!existing) {
    return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  }

  try {
    await assertDemoOwnership(existing.demoSessionId, SHARED_MOVIE_MESSAGE);
  } catch (e) {
    if (e instanceof DemoForbiddenError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }

  await prisma.movie.delete({ where: { id: existing.id } });
  revalidatePath("/");
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
