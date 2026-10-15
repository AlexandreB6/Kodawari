import Image from "next/image";
import Link from "next/link";
import { Star, Clock, Clapperboard, Eye } from "lucide-react";
import { slugify } from "@/lib/tmdb";

/** Données nécessaires à l'affichage d'une carte de film */
export interface MovieCardData {
  tmdbId: number;
  title: string;
  originalTitle?: string | null;
  posterPath: string | null;
  rating: number;
  runtimeMinutes?: number | null;
  runtime: string | null;
  director: string | null;
  cast: string[];
  releaseDate: string;
  genres: string[];
  overview?: string | null;
  watched?: boolean;
  userRating?: number | null;
}

interface MovieCardProps extends MovieCardData {
  onMarkWatched?: (movie: MovieCardData) => void;
}

/**
 * Carte d'un film — affiche le poster, la note, et au hover le réalisateur/casting.
 * Badge "Vu" si le film est dans la collection. Bouton "Marquer vu" au hover.
 */
export function MovieCard(props: MovieCardProps) {
  const {
    tmdbId, title, originalTitle, posterPath, rating, runtime,
    director, cast, genres, releaseDate, overview, watched, onMarkWatched,
  } = props;

  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;

  return (
    <div className="group relative flex flex-col rounded-xl overflow-hidden bg-card border border-border/50 hover:border-border hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1.5">
      <Link
        href={`/movie/${slugify(title, tmdbId)}`}
        className="flex flex-col flex-1"
      >
        {/* Poster */}
        <div className="relative aspect-[2/3] overflow-hidden bg-card -mb-px">
          {posterPath ? (
            <Image
              src={`https://image.tmdb.org/t/p/w500${posterPath}`}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <Clapperboard className="w-12 h-12" aria-hidden="true" />
            </div>
          )}

          {/* Top-left : badge "Vu" ou bouton "Ajouter" (même position) */}
          {watched ? (
            <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 bg-green-500/80 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full">
              <Eye className="w-3 h-3" aria-hidden="true" />
              Vu
            </div>
          ) : onMarkWatched ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMarkWatched(props);
              }}
              className="absolute top-2.5 left-2.5 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg cursor-pointer backdrop-blur-sm"
              aria-label={`Marquer ${title} comme vu`}
            >
              <Eye className="w-3 h-3" aria-hidden="true" />
              Vu
            </button>
          ) : null}

          {/* Top-right : note TMDB */}
          <div
            role="img"
            className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full"
            aria-label={`Note : ${rating.toFixed(1)} sur 10`}
          >
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" aria-hidden="true" />
            {rating.toFixed(1)}
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3.5" aria-hidden="true">
            {overview && (
              <p className="text-white/80 text-xs leading-relaxed line-clamp-2 mb-2">{overview}</p>
            )}
            {director && (
              <>
                <p className="text-white/60 text-[10px] uppercase tracking-widest font-medium mb-0.5">Réalisé par</p>
                <p className="text-white text-sm font-semibold mb-2">{director}</p>
              </>
            )}
            {cast.length > 0 && (
              <>
                <p className="text-white/60 text-[10px] uppercase tracking-widest font-medium mb-0.5">Avec</p>
                <p className="text-white/90 text-xs leading-relaxed">{cast.join(", ")}</p>
              </>
            )}
          </div>
        </div>

        {/* SR-only info */}
        <span className="sr-only">
          {director && `Réalisé par ${director}.`}
          {cast.length > 0 && ` Avec ${cast.join(", ")}.`}
        </span>

        {/* Info */}
        <div className="relative z-10 p-3 flex flex-col gap-1 flex-1 bg-card">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">{title}</h3>
          {originalTitle && (
            <p className="text-[10px] text-muted-foreground/70 italic line-clamp-1">{originalTitle}</p>
          )}
          <div className="flex flex-col gap-0.5 text-[11px] text-muted-foreground mt-auto">
            {(year || runtime) && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                {[year, runtime].filter(Boolean).join(" · ")}
              </span>
            )}
            {genres.length > 0 && (
              <span className="truncate">{genres.join(" · ")}</span>
            )}
          </div>
        </div>
      </Link>

    </div>
  );
}
