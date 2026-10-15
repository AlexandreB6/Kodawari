"use client";

import { useEffect, useRef } from "react";
import { MovieCard, type MovieCardData } from "./MovieCard";
import { Loader2 } from "lucide-react";

interface MovieGridProps {
  movies: MovieCardData[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onMarkWatched?: (movie: MovieCardData) => void;
}

/** Marge avant le bas de la grille à laquelle la page suivante est demandée. */
const PREFETCH_MARGIN = "1200px";

/**
 * Grille de films — composant "dumb", reçoit les données et callbacks du parent.
 * Scroll infini : une sentinelle en fin de grille déclenche `onLoadMore` dès
 * qu'elle approche du viewport, pour que la suite soit prête avant d'y arriver.
 */
export function MovieGrid({ movies, loading, hasMore, onLoadMore, onMarkWatched }: MovieGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  // Ré-observé après chaque chargement : si la sentinelle est encore dans la
  // marge (grille trop courte pour remplir l'écran), l'observer se redéclenche.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || loading || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMoreRef.current?.();
      },
      { rootMargin: `0px 0px ${PREFETCH_MARGIN} 0px` }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading, hasMore, movies.length]);

  return (
    <>
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5"
        aria-live="polite"
        aria-atomic="false"
      >
        {movies.map((movie) => (
          <MovieCard key={movie.tmdbId} {...movie} onMarkWatched={onMarkWatched} />
        ))}
      </div>

      {movies.length === 0 && !loading && (
        <p className="text-center text-muted-foreground py-12">Aucun film trouvé</p>
      )}

      {hasMore && onLoadMore && (
        <div ref={sentinelRef} className="flex justify-center py-8" aria-hidden="true">
          {loading && <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />}
        </div>
      )}

      {loading && movies.length === 0 && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </>
  );
}
