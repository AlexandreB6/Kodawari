"use client";

import { useState, useRef } from "react";
import { Star, StarHalf, X } from "lucide-react";
import { buildYearOptions } from "@repo/core/utils";
import type { MovieCardData } from "./MovieCard";

interface MarkWatchedDialogProps {
  movie: MovieCardData | null;
  onClose: () => void;
  onConfirm: (tmdbId: number, rating: number | null, watchedAt: string | null, watchedPrecision: "day" | "year") => Promise<void>;
  /** Pre-fill values for edit mode */
  initialRating?: number | null;
  initialWatchedAt?: string | null;
}

const YEAR_OPTIONS = buildYearOptions(1970);

/**
 * Dialog pour marquer un film comme vu — note demi-étoiles (optionnelle) + année optionnelle.
 */
export function MarkWatchedDialog({ movie, onClose, onConfirm, initialRating, initialWatchedAt }: MarkWatchedDialogProps) {
  const [rating, setRating] = useState<number | null>(initialRating ?? null);
  const [hoverRating, setHoverRating] = useState(0);
  const [watchedYear, setWatchedYear] = useState<number | "">(
    initialWatchedAt ? new Date(initialWatchedAt).getFullYear() : ""
  );
  const [saving, setSaving] = useState(false);
  const isEditMode = initialRating !== undefined || initialWatchedAt !== undefined;

  // Reset state when movie changes (new dialog open)
  const movieId = movie?.tmdbId ?? null;
  const prevMovieIdRef = useRef(movieId);
  if (movieId !== prevMovieIdRef.current) {
    prevMovieIdRef.current = movieId;
    setRating(initialRating ?? null);
    setWatchedYear(initialWatchedAt ? new Date(initialWatchedAt).getFullYear() : "");
    setHoverRating(0);
  }

  if (!movie) return null;

  const releaseYear = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null;

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const dateValue = watchedYear ? `${watchedYear}-01-01` : null;
      await onConfirm(movie.tmdbId, rating, dateValue, "year");
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const displayRating = hoverRating || rating || 0;

  /** Calcule la note selon la position du clic/hover dans l'étoile */
  const getRatingFromEvent = (e: React.MouseEvent<HTMLButtonElement>, starIndex: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeftHalf = x < rect.width / 2;
    return isLeftHalf ? starIndex - 0.5 : starIndex;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEditMode ? `Modifier ${movie.title}` : `Marquer ${movie.title} comme vu`}
        className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with mini poster */}
        <div className="flex items-start gap-4">
          {movie.posterPath && (
            <img
              src={`https://image.tmdb.org/t/p/w154${movie.posterPath}`}
              alt=""
              className="w-16 h-24 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold leading-tight line-clamp-2">{isEditMode ? "Modifier" : "Marquer comme vu"}</h2>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{movie.title}</p>
          </div>
        </div>

        {/* Half-star rating (optional) */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
            Note personnelle <span className="text-muted-foreground/50 font-normal">(optionnel)</span>
            {rating != null && (
              <span className="text-amber-400 font-bold">{rating}/5</span>
            )}
          </label>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => {
              const filled = displayRating >= n;
              const halfFilled = !filled && displayRating >= n - 0.5;
              return (
                <button
                  key={n}
                  onClick={(e) => {
                    const val = getRatingFromEvent(e, n);
                    setRating(rating === val ? null : val);
                  }}
                  onMouseMove={(e) => setHoverRating(getRatingFromEvent(e, n))}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5 transition-transform hover:scale-110 cursor-pointer relative"
                  aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                >
                  {halfFilled ? (
                    <div className="relative w-8 h-8">
                      <Star className="w-8 h-8 text-muted-foreground/30 absolute inset-0" />
                      <StarHalf className="w-8 h-8 fill-amber-400 text-amber-400 absolute inset-0" />
                    </div>
                  ) : (
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        filled
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  )}
                </button>
              );
            })}
            {rating != null && (
              <button
                onClick={() => setRating(null)}
                className="ml-2 text-xs text-muted-foreground hover:text-white transition-colors cursor-pointer"
              >
                Effacer
              </button>
            )}
          </div>
        </div>

        {/* Year (optional) */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Année de visionnage <span className="text-muted-foreground/50 font-normal">(optionnel)</span>
          </label>
          <select
            value={watchedYear}
            onChange={(e) => setWatchedYear(e.target.value ? Number(e.target.value) : "")}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
          >
            <option value="">Sélectionner une année</option>
            {YEAR_OPTIONS.filter((y) => !releaseYear || y >= releaseYear).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="flex-1 rounded-lg bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Enregistrement…" : isEditMode ? "Enregistrer" : "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  );
}
