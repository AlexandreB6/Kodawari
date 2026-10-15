import { discoverMovies, getMovieWithCredits, getDirector, getTopCast, formatRuntime, getGenreList } from "@/lib/tmdb";
import { prisma } from "@/lib/prisma";
import { CinemaClient } from "@/components/CinemaClient";
import type { MovieCardData } from "@/components/MovieCard";
import { demoFilter, dedupBySid } from "@repo/core/demo";

export const dynamic = "force-dynamic";

/**
 * Page Cinéma — Explorer le catalogue TMDB avec filtres + gérer les films vus.
 */
export default async function CinemaPage() {
  // Chargement parallèle : genres, discover (sorties récentes), films vus
  const where = await demoFilter();
  const [genreList, discoverResult, watchedMovies] = await Promise.all([
    getGenreList(),
    discoverMovies({ page: 1, sortBy: "primary_release_date.desc" }),
    prisma.movie.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        tmdbId: true,
        title: true,
        posterPath: true,
        director: true,
        releaseYear: true,
        rating: true,
        watchedAt: true,
        watchedPrecision: true,
        overview: true,
        demoSessionId: true,
      },
    }),
  ]);
  // Dedup seed/visitor collisions before building the client payload.
  const watchedMoviesDeduped = dedupBySid(watchedMovies, (m) => m.tmdbId ?? `movie-${m.id}`);

  // IDs TMDB des films déjà vus — pour afficher le badge "Vu" dans la grille
  const watchedTmdbIds = watchedMoviesDeduped
    .filter((m) => m.tmdbId != null)
    .map((m) => m.tmdbId as number);
  const watchedSet = new Set(watchedTmdbIds);

  // Enrichir chaque résultat discover avec les crédits (réalisateur, casting, durée)
  const detailed = await Promise.all(
    discoverResult.results.map(async (m) => {
      try {
        return await getMovieWithCredits(m.id);
      } catch {
        return null;
      }
    })
  );

  const initialMovies: MovieCardData[] = detailed
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
        watched: watchedSet.has(movie.id),
      };
    });

  // Sérialiser les films vus pour passage au client (dates → ISO strings)
  const serializedWatched = watchedMoviesDeduped
    .filter((m) => m.tmdbId != null)
    .map((m) => ({
      tmdbId: m.tmdbId as number,
      title: m.title,
      posterPath: m.posterPath,
      director: m.director,
      releaseYear: m.releaseYear,
      rating: m.rating,
      watchedAt: m.watchedAt?.toISOString() ?? null,
      watchedPrecision: m.watchedPrecision,
      overview: m.overview ?? null,
      demoSessionId: m.demoSessionId,
    }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Cinéma</h1>
        <p className="text-muted-foreground mt-2 text-lg">Explorez le catalogue et gérez vos films vus</p>
      </div>
      <CinemaClient
        initialMovies={initialMovies}
        initialTotalPages={discoverResult.total_pages}
        genres={genreList}
        watchedTmdbIds={watchedTmdbIds}
        watchedMovies={serializedWatched}
      />
    </div>
  );
}
