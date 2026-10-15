import {
  getMovieWithCredits,
  getMovieReviews,
  getDirector,
  getTrailer,
  formatRuntime,
  extractIdFromSlug,
} from "@/lib/tmdb";
import { prisma } from "@/lib/prisma";
import { demoFilter, isDemoMode } from "@repo/core/demo";
import Image from "next/image";
import { BackToCinema } from "@/components/BackToCinema";
import {
  ChevronLeft,
  Star,
  Clock,
  Calendar,
  Globe,
  Play,
  ExternalLink,
} from "lucide-react";
import { WatchedToggle } from "@/components/WatchedToggle";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Page de détail d'un film.
 * Affiche le hero backdrop, les métadonnées, le synopsis, le réalisateur,
 * la distribution et les critiques TMDB.
 */
export default async function MovieDetailPage({ params }: Props) {
  const { slug } = await params;
  const id = extractIdFromSlug(slug);
  const filter = await demoFilter();
  // Prefer the visitor's own row over the seed row when both exist for the
  // same tmdbId (nulls last → non-null demoSessionId first).
  const [movie, watchedMovie] = await Promise.all([
    getMovieWithCredits(id),
    prisma.movie.findFirst({
      where: { AND: [{ tmdbId: id }, filter] },
      orderBy: { demoSessionId: { sort: "desc", nulls: "last" } },
    }),
  ]);
  const { results: reviews } = await getMovieReviews(id);
  const director = getDirector(movie);
  const trailer = getTrailer(movie);
  const topCast = movie.credits.cast
    .sort((a, b) => a.order - b.order)
    .slice(0, 12);
  const topReviews = reviews.slice(0, 6);

  return (
    <div className="min-h-screen">
      {/* Hero backdrop */}
      <div className="relative -mx-4 sm:-mx-6 -mt-8 mb-8">
        <div className="relative h-[50vh] sm:h-[60vh] overflow-hidden">
          {movie.backdrop_path ? (
            // alt="" intentionnel — image décorative, le titre du film est dans le h1
            <Image
              src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
              alt=""
              fill
              className="object-cover object-top"
              priority
            />
          ) : (
            <div className="h-full bg-muted" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />

          {/* Back link — top-left of hero */}
          <BackToCinema />
        </div>

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 pb-6">
          <div className="max-w-7xl mx-auto flex gap-6 sm:gap-8 items-start">
            {/* Poster */}
            {movie.poster_path && (
              <div className="hidden sm:block relative w-48 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl shadow-black/50 flex-shrink-0 border border-white/10">
                <Image
                  src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                  alt={movie.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            <div className="flex-1 space-y-3">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                {movie.title}
              </h1>

              {movie.original_title !== movie.title && (
                <p className="text-white/50 text-lg italic">
                  {movie.original_title}
                </p>
              )}

              {movie.tagline && (
                <p className="text-white/70 text-base italic">
                  &ldquo;{movie.tagline}&rdquo;
                </p>
              )}

              {/* Métadonnées : note, durée, date, pays */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/60">
                <span className="inline-flex items-center gap-1.5 text-amber-400 font-bold">
                  <Star className="w-4 h-4 fill-amber-400" aria-hidden="true" />
                  {movie.vote_average.toFixed(1)}/10
                  <span className="text-white/30 font-normal text-xs">({movie.vote_count.toLocaleString("fr-FR")})</span>
                </span>
                {movie.runtime > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    {formatRuntime(movie.runtime)}
                  </span>
                )}
                {movie.release_date && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                    {new Date(movie.release_date).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                )}
                {movie.production_countries?.[0] && (
                  <span className="inline-flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                    {movie.production_countries[0].name}
                  </span>
                )}
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2 pt-1">
                {movie.genres.map((g) => (
                  <span
                    key={g.id}
                    className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium border border-white/5"
                  >
                    {g.name}
                  </span>
                ))}
              </div>

              {/* Séparateur */}
              <div className="border-t border-white/10 my-3" />

              {/* Vu / Modifier / Retirer */}
              <div>
                <WatchedToggle
                  tmdbId={movie.id}
                  title={movie.title}
                  posterPath={movie.poster_path}
                  overview={movie.overview}
                  director={director?.name ?? null}
                  releaseYear={
                    movie.release_date
                      ? new Date(movie.release_date).getFullYear()
                      : null
                  }
                  releaseDate={movie.release_date ?? null}
                  initialWatched={!!watchedMovie}
                  initialRating={watchedMovie?.rating ?? null}
                  initialWatchedAt={
                    watchedMovie?.watchedAt?.toISOString() ?? null
                  }
                  initialWatchedPrecision={watchedMovie?.watchedPrecision ?? "day"}
                  isShared={isDemoMode() && watchedMovie != null && watchedMovie.demoSessionId == null}
                />
              </div>

              {/* Liens externes — compact */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/40">
                {movie.imdb_id && (
                  <a
                    href={`https://www.imdb.com/title/${movie.imdb_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-white/70 transition-colors"
                  >
                    IMDb <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                )}
                <a
                  href={`https://www.themoviedb.org/movie/${movie.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-white/70 transition-colors"
                >
                  TMDB <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
                <a
                  href={`https://www.allocine.fr/rechercher/?q=${encodeURIComponent(movie.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-white/70 transition-colors"
                >
                  AlloCiné <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
                {movie.homepage && (
                  <a
                    href={movie.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-white/70 transition-colors"
                  >
                    Site officiel <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-12">
        {/* Synopsis */}
        {movie.overview && (
          <section>
            <h2 className="text-xl font-bold mb-4">Synopsis</h2>
            <p className="text-white/70 leading-relaxed max-w-3xl text-base">
              {movie.overview}
            </p>
          </section>
        )}

        {/* Bande-annonce */}
        {trailer && (
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Play
                className="w-5 h-5 text-red-500 fill-red-500"
                aria-hidden="true"
              />
              Bande-annonce
            </h2>
            <div className="relative max-w-3xl aspect-video rounded-xl overflow-hidden border border-white/10">
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}?rel=0&modestbranding=1`}
                title={trailer.name ?? `Bande-annonce de ${movie.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </section>
        )}

        {/* Réalisateur */}
        {director && (
          <section>
            <h2 className="text-xl font-bold mb-4">Réalisateur</h2>
            <a
              href={`https://www.themoviedb.org/person/${director.id}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${director.name} sur TMDB (ouvre dans un nouvel onglet)`}
              className="inline-flex items-center gap-4 group/dir hover:opacity-80 transition-opacity"
            >
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
                {director.profile_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w185${director.profile_path}`}
                    alt={director.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40 text-xl font-bold">
                    {director.name[0]}
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold text-lg group-hover/dir:underline">
                  {director.name}
                </p>
                <p className="text-white/50 text-sm">Réalisateur</p>
              </div>
            </a>
          </section>
        )}

        {/* Distribution (casting) */}
        {topCast.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4">Distribution</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {topCast.map((actor) => (
                <a
                  key={actor.id}
                  href={`https://www.themoviedb.org/person/${actor.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${actor.name} sur TMDB (ouvre dans un nouvel onglet)`}
                  className="flex flex-col items-center text-center gap-2 group/actor hover:opacity-80 transition-opacity"
                >
                  <div className="relative w-20 h-20 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
                    {actor.profile_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                        alt={actor.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/40 text-lg font-bold">
                        {actor.name[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm leading-tight group-hover/actor:underline">
                      {actor.name}
                    </p>
                    <p className="text-white/50 text-xs mt-0.5 line-clamp-1">
                      {actor.character}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Critiques TMDB */}
        {topReviews.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4">Critiques</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topReviews.map((review) => (
                <a
                  key={review.id}
                  href={review.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Critique de ${review.author} (ouvre dans un nouvel onglet)`}
                  className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-3 hover:bg-white/[0.07] hover:border-white/15 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white/60">
                        {review.author[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{review.author}</p>
                        <p className="text-white/40 text-xs">
                          {new Date(review.created_at).toLocaleDateString(
                            "fr-FR",
                            { year: "numeric", month: "short", day: "numeric" },
                          )}
                        </p>
                      </div>
                    </div>
                    {review.author_details.rating != null && (
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-400">
                        <Star
                          className="w-3.5 h-3.5 fill-amber-400"
                          aria-hidden="true"
                        />
                        {review.author_details.rating}/10
                      </span>
                    )}
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed line-clamp-5">
                    {review.content.replace(/<[^>]*>/g, "")}
                  </p>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
