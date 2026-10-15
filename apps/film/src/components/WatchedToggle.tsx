"use client";

import { useState } from "react";
import { Eye, EyeOff, Pencil, Star, StarHalf, X } from "lucide-react";
import { buildYearOptions } from "@repo/core/utils";
import { apiFetch } from "@repo/core/apiFetch";

const YEAR_OPTIONS = buildYearOptions(1970);

interface WatchedToggleProps {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  overview: string | null;
  director: string | null;
  releaseYear: number | null;
  releaseDate: string | null;
  initialWatched: boolean;
  initialRating: number | null;
  initialWatchedAt: string | null;
  initialWatchedPrecision: string;
  isShared?: boolean;
}

/**
 * Bouton Vu/Retirer pour la page détail d'un film.
 * Ouvre un dialog de notation au premier clic, ou retire directement si déjà vu.
 */
export function WatchedToggle({
  tmdbId, title, posterPath, overview, director, releaseYear, releaseDate,
  initialWatched, initialRating, initialWatchedAt,
  // initialWatchedPrecision n'est pas utilisé — la précision est toujours "year" dans le dialog
  isShared = false,
}: WatchedToggleProps) {
  const [watched, setWatched] = useState(initialWatched);
  const [userRating, setUserRating] = useState<number | null>(initialRating);
  const [userWatchedAt, setUserWatchedAt] = useState<string | null>(initialWatchedAt);
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  // Dialog state
  const [dialogRating, setDialogRating] = useState<number | null>(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [dialogYear, setDialogYear] = useState<number | "">(
    initialWatchedAt ? new Date(initialWatchedAt).getFullYear() : ""
  );

  const minYear = releaseYear ?? (releaseDate ? new Date(releaseDate).getFullYear() : null);

  const getRatingFromEvent = (e: React.MouseEvent<HTMLButtonElement>, starIndex: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    return x < rect.width / 2 ? starIndex - 0.5 : starIndex;
  };

  const isEditing = watched && showDialog;

  const handleSave = async () => {
    setSaving(true);
    try {
      const dateValue = dialogYear ? `${dialogYear}-01-01` : null;
      const res = await apiFetch("/api/movies", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: isEditing
          ? JSON.stringify({ tmdbId, rating: dialogRating, watchedAt: dateValue, watchedPrecision: "year" })
          : JSON.stringify({
              tmdbId, title, posterPath, overview, director, releaseYear,
              rating: dialogRating,
              watchedAt: dateValue,
              watchedPrecision: "year",
            }),
      });
      if (res.ok) {
        setWatched(true);
        setUserRating(dialogRating);
        setUserWatchedAt(dateValue);
        setShowDialog(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      const res = await apiFetch("/api/movies", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbId }),
      });
      if (res.ok) {
        setWatched(false);
        setUserRating(null);
        setUserWatchedAt(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const displayRating = hoverRating || dialogRating || 0;

  return (
    <>
      {watched ? (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400 text-sm font-semibold border border-green-500/20">
            <Eye className="w-4 h-4" aria-hidden="true" />
            Vu
            {userRating != null && (
              <span className="text-amber-400 font-bold ml-1">{userRating}/5</span>
            )}
            {userWatchedAt && (
              <span className="text-green-400/60 font-normal ml-1">
                en {new Date(userWatchedAt).getFullYear()}
              </span>
            )}
          </div>
          {isShared ? (
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-300 text-sm font-medium border border-amber-500/20"
              title="Ce film fait partie du catalogue de démonstration, partagé avec tous les visiteurs."
            >
              Catalogue partagé — non modifiable
            </span>
          ) : (
            <>
              <button
                onClick={() => {
                  setDialogRating(userRating);
                  setDialogYear(userWatchedAt ? new Date(userWatchedAt).getFullYear() : "");
                  setShowDialog(true);
                }}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white text-sm font-medium transition-colors border border-white/10 cursor-pointer disabled:opacity-50"
              >
                <Pencil className="w-4 h-4" aria-hidden="true" />
                Modifier
              </button>
              <button
                onClick={handleRemove}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-colors border border-red-500/20 cursor-pointer disabled:opacity-50"
              >
                <EyeOff className="w-4 h-4" aria-hidden="true" />
                Retirer
              </button>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={() => {
            setDialogRating(null);
            setDialogYear("");
            setShowDialog(true);
          }}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
        >
          <Eye className="w-4 h-4" aria-hidden="true" />
          Marquer comme vu
        </button>
      )}

      {/* Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowDialog(false)} aria-hidden="true">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={isEditing ? `Modifier ${title}` : `Marquer ${title} comme vu`}
            className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowDialog(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-lg font-bold leading-tight">{isEditing ? "Modifier" : "Marquer comme vu"}</h2>
              <p className="text-sm text-muted-foreground mt-1">{title}</p>
            </div>

            {/* Rating */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                Note personnelle <span className="text-muted-foreground/50 font-normal">(optionnel)</span>
                {dialogRating != null && (
                  <span className="text-amber-400 font-bold">{dialogRating}/5</span>
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
                        setDialogRating(dialogRating === val ? null : val);
                      }}
                      onMouseMove={(e) => setHoverRating(getRatingFromEvent(e, n))}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-0.5 transition-transform hover:scale-110 cursor-pointer"
                      aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                    >
                      {halfFilled ? (
                        <div className="relative w-8 h-8">
                          <Star className="w-8 h-8 text-muted-foreground/30 absolute inset-0" />
                          <StarHalf className="w-8 h-8 fill-amber-400 text-amber-400 absolute inset-0" />
                        </div>
                      ) : (
                        <Star className={`w-8 h-8 transition-colors ${filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                      )}
                    </button>
                  );
                })}
                {dialogRating != null && (
                  <button
                    onClick={() => setDialogRating(null)}
                    className="ml-2 text-xs text-muted-foreground hover:text-white transition-colors cursor-pointer"
                  >
                    Effacer
                  </button>
                )}
              </div>
            </div>

            {/* Year */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Année de visionnage <span className="text-muted-foreground/50 font-normal">(optionnel)</span>
              </label>
              <select
                value={dialogYear}
                onChange={(e) => setDialogYear(e.target.value ? Number(e.target.value) : "")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
              >
                <option value="">Sélectionner une année</option>
                {YEAR_OPTIONS.filter((y) => !minYear || y >= minYear).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDialog(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-lg bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Enregistrement…" : isEditing ? "Enregistrer" : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
