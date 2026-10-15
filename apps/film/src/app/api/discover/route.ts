/**
 * Route API : GET /api/discover
 * Proxy pour TMDB discover/movie ou search/movie selon les paramètres.
 * Enrichit chaque film avec crédits (réalisateur, casting, durée, genres).
 */

import { NextRequest, NextResponse } from "next/server";
import {
  discoverMovies,
  searchMovies,
  getMovieWithCredits,
  getDirector,
  getTopCast,
  formatRuntime,
} from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const query = sp.get("query") ?? "";
  const page = Number(sp.get("page") ?? "1");

  // Recherche textuelle ou découverte par filtres selon la présence de `query`
  let results: { results: { id: number }[]; total_pages: number };

  if (query.trim()) {
    results = await searchMovies(query, page);
  } else {
    results = await discoverMovies({
      page,
      year: sp.get("year") ? Number(sp.get("year")) : undefined,
      genres: sp.get("genres") ?? undefined,
      runtimeMin: sp.get("runtimeMin") ? Number(sp.get("runtimeMin")) : undefined,
      runtimeMax: sp.get("runtimeMax") ? Number(sp.get("runtimeMax")) : undefined,
      minRating: sp.get("minRating") ? Number(sp.get("minRating")) : undefined,
      certification: sp.get("certification") ?? undefined,
      sortBy: sp.get("sortBy") ?? undefined,
    });
  }

  // Enrichir chaque film avec les crédits complets (réalisateur, casting, durée, genres)
  const detailed = await Promise.all(
    results.results.map(async (m) => {
      try {
        return await getMovieWithCredits(m.id);
      } catch {
        return null;
      }
    })
  );

  const movies = detailed
    .filter((m) => m !== null)
    .map((movie) => {
      const director = getDirector(movie);
      return {
        tmdbId: movie.id,
        title: movie.title,
        originalTitle: movie.original_title !== movie.title ? movie.original_title : null,
        posterPath: movie.poster_path,
        rating: movie.vote_average,
        runtimeMinutes: movie.runtime,
        runtime: movie.runtime ? formatRuntime(movie.runtime) : null,
        director: director?.name ?? null,
        cast: getTopCast(movie, 3).map((c) => c.name),
        releaseDate: movie.release_date,
        genres: movie.genres.slice(0, 2).map((g) => g.name),
        overview: movie.overview,
      };
    });

  return NextResponse.json({ movies, totalPages: results.total_pages, page });
}
