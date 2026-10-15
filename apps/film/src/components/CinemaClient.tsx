"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, RotateCcw, Loader2, Eye, Star, StarHalf, ChevronDown, Pencil } from "lucide-react";
import { MovieGrid } from "./MovieGrid";
import { MarkWatchedDialog } from "./MarkWatchedDialog";
import { ConfirmDialog } from "@repo/ui/ConfirmDialog";
import type { MovieCardData } from "./MovieCard";
import { slugify } from "@/lib/tmdb";
import type { TmdbGenre } from "@/lib/tmdb";
import { CURRENT_YEAR, buildYearOptions } from "@repo/core/utils";
import { apiFetch } from "@repo/core/apiFetch";
import { isSharedItem } from "@repo/core/clientDemo";

interface WatchedMovie {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  director: string | null;
  releaseYear: number | null;
  rating: number | null;
  watchedAt: string | null;
  watchedPrecision: string;
  overview: string | null;
  demoSessionId: string | null;
}

interface CinemaClientProps {
  initialMovies: MovieCardData[];
  initialTotalPages: number;
  genres: TmdbGenre[];
  watchedTmdbIds: number[];
  watchedMovies: WatchedMovie[];
}

const YEAR_OPTIONS = buildYearOptions(1980);
const DURATION_PRESETS = [
  { label: "< 1h30", min: 0, max: 90 },
  { label: "1h30-2h", min: 90, max: 120 },
  { label: "2h-2h30", min: 120, max: 150 },
  { label: "> 2h30", min: 150, max: 0 },
];
const RATING_OPTIONS = [5, 6, 7, 8, 9];
const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Popularité" },
  { value: "vote_average.desc", label: "Note" },
  { value: "primary_release_date.desc", label: "Date" },
  { value: "title.asc", label: "Titre" },
];

export function CinemaClient({
  initialMovies,
  initialTotalPages,
  genres,
  watchedTmdbIds: initialWatchedIds,
  watchedMovies: initialWatchedMovies,
}: CinemaClientProps) {
  // Onglets — synchronisés avec le paramètre URL ?tab= pour supporter la navigation arrière
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabFromUrl = searchParams.get("tab") === "collection" ? "collection" : "explore";
  const [activeTab, setActiveTabState] = useState<"explore" | "collection">(tabFromUrl);

  // Synchronise l'état des onglets quand l'URL change (boutons précédent/suivant du navigateur)
  useEffect(() => {
    setActiveTabState(tabFromUrl);
  }, [tabFromUrl]);

  const setActiveTab = useCallback((tab: "explore" | "collection") => {
    setActiveTabState(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "collection") params.set("tab", "collection");
    else params.delete("tab");
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/", { scroll: false });
  }, [searchParams, router]);

  // État de l'onglet Explorer (filtres, pagination, résultats)
  const [movies, setMovies] = useState<MovieCardData[]>(initialMovies);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [selectedMinRating, setSelectedMinRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("primary_release_date.desc");

  // État des films vus
  const [watchedIds, setWatchedIds] = useState<Set<number>>(new Set(initialWatchedIds));
  const [watchedMovies, setWatchedMovies] = useState<WatchedMovie[]>(initialWatchedMovies);
  const [dialogMovie, setDialogMovie] = useState<MovieCardData | null>(null);

  // Mode édition pour les éléments de la collection
  const [editMovie, setEditMovie] = useState<WatchedMovie | null>(null);

  // Filtres de la collection
  const [collectionSearch, setCollectionSearch] = useState("");
  const [collectionRatingFilter, setCollectionRatingFilter] = useState<number | null>(null);
  const [collectionYearFilter, setCollectionYearFilter] = useState<number | null>(null);

  // Rafraîchir la collection quand l'onglet est actif (gère les données obsolètes après navigation)
  useEffect(() => {
    if (activeTab !== "collection") return;
    const refresh = async () => {
      try {
        const res = await apiFetch("/api/movies");
        if (!res.ok) return;
        const movies = await res.json();
        const mapped: WatchedMovie[] = movies
          .filter((m: Record<string, unknown>) => m.tmdbId != null)
          .map((m: Record<string, unknown>) => ({
            tmdbId: m.tmdbId as number,
            title: m.title as string,
            posterPath: m.posterPath as string | null,
            director: m.director as string | null,
            releaseYear: m.releaseYear as number | null,
            rating: m.rating as number | null,
            watchedAt: m.watchedAt as string | null,
            watchedPrecision: (m.watchedPrecision as string) ?? "day",
            overview: m.overview as string | null,
            demoSessionId: (m.demoSessionId as string | null) ?? null,
          }));
        setWatchedMovies(mapped);
        setWatchedIds(new Set(mapped.map((m) => m.tmdbId)));
      } catch { /* ignore */ }
    };
    refresh();
  }, [activeTab]);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isSearchMode = activeQuery.trim().length > 0;

  // Construire les paramètres de requête pour l'API discover
  const buildParams = useCallback(
    (p: number, query?: string) => {
      const params = new URLSearchParams({ page: String(p) });
      if (query?.trim()) {
        params.set("query", query);
      } else {
        if (selectedYear) params.set("year", String(selectedYear));
        if (selectedGenres.length) params.set("genres", selectedGenres.join(","));
        if (selectedDuration !== null) {
          const preset = DURATION_PRESETS[selectedDuration];
          if (preset.min) params.set("runtimeMin", String(preset.min));
          if (preset.max) params.set("runtimeMax", String(preset.max));
        }
        if (selectedMinRating) params.set("minRating", String(selectedMinRating));
        if (sortBy !== "popularity.desc") params.set("sortBy", sortBy);
      }
      return params;
    },
    [selectedYear, selectedGenres, selectedDuration, selectedMinRating, sortBy]
  );

  // Charger les films depuis l'API
  const fetchMovies = useCallback(
    async (p: number, append: boolean, query?: string) => {
      setLoading(true);
      try {
        const params = buildParams(p, query);
        const res = await fetch(`/api/discover?${params}`);
        const data = await res.json();
        const enriched: MovieCardData[] = data.movies.map((m: MovieCardData) => ({
          ...m,
          watched: watchedIds.has(m.tmdbId),
        }));
        if (append) {
          setMovies((prev) => [...prev, ...enriched]);
        } else {
          setMovies(enriched);
        }
        setPage(p);
        setTotalPages(data.totalPages);
      } finally {
        setLoading(false);
      }
    },
    [buildParams, watchedIds]
  );

  // Recherche avec délai (debounce 300ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setActiveQuery(searchQuery);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  // Re-charger quand les filtres ou la recherche changent
  const isInitialRender = useRef(true);
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    fetchMovies(1, false, activeQuery || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedGenres, selectedDuration, selectedMinRating, sortBy, activeQuery]);

  // Mettre à jour les badges "Vu" quand la liste des IDs vus change
  useEffect(() => {
    setMovies((prev) =>
      prev.map((m) => ({ ...m, watched: watchedIds.has(m.tmdbId) }))
    );
  }, [watchedIds]);

  const loadMore = useCallback(() => {
    fetchMovies(page + 1, true, activeQuery || undefined);
  }, [fetchMovies, page, activeQuery]);

  const resetFilters = () => {
    setSearchQuery("");
    setActiveQuery("");
    setSelectedYear(null);
    setSelectedGenres([]);
    setSelectedDuration(null);
    setSelectedMinRating(null);
    setSortBy("primary_release_date.desc");
  };

  const toggleGenre = (id: number) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const hasActiveFilters = selectedYear || selectedGenres.length || selectedDuration !== null || selectedMinRating || sortBy !== "primary_release_date.desc" || activeQuery;

  // Marquer un film comme vu — enregistre en base et met à jour l'état local
  const handleMarkWatched = async (tmdbId: number, rating: number | null, watchedAt: string | null, watchedPrecision: "day" | "year" = "day") => {
    const movie = movies.find((m) => m.tmdbId === tmdbId);
    if (!movie) return;

    const res = await apiFetch("/api/movies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tmdbId,
        title: movie.title,
        posterPath: movie.posterPath,
        overview: movie.overview,
        director: movie.director,
        releaseYear: movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null,
        rating,
        watchedAt: watchedAt || null,
        watchedPrecision,
      }),
    });
    if (res.ok) {
      setWatchedIds((prev) => new Set([...prev, tmdbId]));
      const saved = await res.json();
      setWatchedMovies((prev) => [
        {
          tmdbId: saved.tmdbId,
          title: saved.title,
          posterPath: saved.posterPath,
          director: saved.director,
          releaseYear: saved.releaseYear,
          rating: saved.rating,
          watchedAt: saved.watchedAt,
          watchedPrecision: saved.watchedPrecision,
          overview: saved.overview,
          demoSessionId: saved.demoSessionId ?? null,
        },
        ...prev.filter((m) => m.tmdbId !== tmdbId),
      ]);
    }
  };

  // Retirer un film de la collection (avec dialog de confirmation)
  const [movieToRemove, setMovieToRemove] = useState<WatchedMovie | null>(null);

  const handleRemoveWatched = async (tmdbId: number) => {
    const res = await apiFetch("/api/movies", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tmdbId }),
    });
    if (res.ok) {
      setWatchedIds((prev) => {
        const next = new Set(prev);
        next.delete(tmdbId);
        return next;
      });
      setWatchedMovies((prev) => prev.filter((m) => m.tmdbId !== tmdbId));
    }
    setMovieToRemove(null);
  };

  // Modifier un film vu (note / date de visionnage)
  const handleEditWatched = async (tmdbId: number, rating: number | null, watchedAt: string | null, watchedPrecision: "day" | "year" = "day") => {
    const res = await apiFetch("/api/movies", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tmdbId, rating, watchedAt: watchedAt || null, watchedPrecision }),
    });
    if (res.ok) {
      const saved = await res.json();
      setWatchedMovies((prev) =>
        prev.map((m) =>
          m.tmdbId === tmdbId
            ? { ...m, rating: saved.rating, watchedAt: saved.watchedAt, watchedPrecision: saved.watchedPrecision }
            : m
        )
      );
    }
  };

  // Années de visionnage disponibles (tri décroissant)
  const collectionWatchedYears = [...new Set(
    watchedMovies
      .filter((m) => m.watchedAt)
      .map((m) => new Date(m.watchedAt!).getFullYear())
  )].sort((a, b) => b - a);

  // Collection filtrée selon les critères actifs
  const filteredCollection = watchedMovies.filter((m) => {
    if (collectionSearch && !m.title.toLowerCase().includes(collectionSearch.toLowerCase())) return false;
    if (collectionRatingFilter && (m.rating ?? 0) < collectionRatingFilter) return false;
    if (collectionYearFilter) {
      if (!m.watchedAt) return false;
      if (new Date(m.watchedAt).getFullYear() !== collectionYearFilter) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Onglets — navigation entre Explorer et Ma collection */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit" role="tablist" aria-label="Sections cinéma">
        <button
          role="tab"
          aria-selected={activeTab === "explore"}
          aria-controls="tab-explore"
          onClick={() => setActiveTab("explore")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            activeTab === "explore"
              ? "bg-white/10 text-white shadow-sm"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          Explorer
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "collection"}
          aria-controls="tab-collection"
          onClick={() => setActiveTab("collection")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "collection"
              ? "bg-white/10 text-white shadow-sm"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          <Eye className="w-4 h-4" aria-hidden="true" />
          Ma collection
          {watchedIds.size > 0 && (
            <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">
              {watchedIds.size}
            </span>
          )}
        </button>
      </div>

      {/* Panneau Explorer */}
      {activeTab === "explore" && (
        <div id="tab-explore" role="tabpanel" className="space-y-6">
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <input
              type="text"
              placeholder="Rechercher un film…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Filters — hidden during search mode */}
          {!isSearchMode && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Year */}
              <div className="relative">
                <select
                  value={selectedYear ?? ""}
                  onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : null)}
                  className={`appearance-none rounded-full pl-3 pr-7 py-1.5 text-xs font-medium border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    selectedYear
                      ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      : "bg-white/5 text-muted-foreground border-transparent hover:text-white"
                  }`}
                >
                  <option value="" className="bg-neutral-900 text-white">Année</option>
                  {YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y} className="bg-neutral-900 text-white">{y}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-muted-foreground" aria-hidden="true" />
              </div>

              {/* Genre — multi-toggle */}
              <div className="relative">
                <select
                  value=""
                  onChange={(e) => {
                    if (!e.target.value) { setSelectedGenres([]); return; }
                    toggleGenre(Number(e.target.value));
                  }}
                  className={`appearance-none rounded-full pl-3 pr-7 py-1.5 text-xs font-medium border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    selectedGenres.length
                      ? "bg-violet-500/20 text-violet-400 border-violet-500/30"
                      : "bg-white/5 text-muted-foreground border-transparent hover:text-white"
                  }`}
                >
                  <option value="" disabled hidden className="bg-neutral-900 text-white">
                    {selectedGenres.length
                      ? `${selectedGenres.length} genre${selectedGenres.length > 1 ? "s" : ""}`
                      : "Genre"}
                  </option>
                  <option value="" className="bg-neutral-900 text-white">Tous les genres</option>
                  {genres.map((g) => (
                    <option key={g.id} value={g.id} className="bg-neutral-900 text-white">
                      {selectedGenres.includes(g.id) ? "✓ " : "  "}{g.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-muted-foreground" aria-hidden="true" />
              </div>

              {/* Duration */}
              <div className="relative">
                <select
                  value={selectedDuration !== null ? String(selectedDuration) : ""}
                  onChange={(e) => setSelectedDuration(e.target.value ? Number(e.target.value) : null)}
                  className={`appearance-none rounded-full pl-3 pr-7 py-1.5 text-xs font-medium border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    selectedDuration !== null
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : "bg-white/5 text-muted-foreground border-transparent hover:text-white"
                  }`}
                >
                  <option value="" className="bg-neutral-900 text-white">Durée</option>
                  {DURATION_PRESETS.map((d, i) => (
                    <option key={i} value={i} className="bg-neutral-900 text-white">{d.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-muted-foreground" aria-hidden="true" />
              </div>

              {/* Min rating */}
              <div className="relative">
                <select
                  value={selectedMinRating ?? ""}
                  onChange={(e) => setSelectedMinRating(e.target.value ? Number(e.target.value) : null)}
                  className={`appearance-none rounded-full pl-3 pr-7 py-1.5 text-xs font-medium border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    selectedMinRating
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      : "bg-white/5 text-muted-foreground border-transparent hover:text-white"
                  }`}
                >
                  <option value="" className="bg-neutral-900 text-white">Note min.</option>
                  {RATING_OPTIONS.map((r) => (
                    <option key={r} value={r} className="bg-neutral-900 text-white">{r}+ / 10</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-muted-foreground" aria-hidden="true" />
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none rounded-full pl-3 pr-7 py-1.5 text-xs font-medium bg-white/5 text-muted-foreground border border-transparent hover:text-white transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} className="bg-neutral-900 text-white">{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-muted-foreground" aria-hidden="true" />
              </div>

              {/* Reset */}
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-muted-foreground hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" aria-hidden="true" />
                  Reset
                </button>
              )}
            </div>
          )}

          {isSearchMode && (
            <p className="text-sm text-muted-foreground">
              Résultats pour &ldquo;{activeQuery}&rdquo;
              <button onClick={resetFilters} className="ml-2 text-primary hover:underline text-xs cursor-pointer">Effacer</button>
            </p>
          )}

          {/* Movie grid */}
          <MovieGrid
            movies={movies}
            loading={loading}
            hasMore={page < totalPages}
            onLoadMore={loadMore}
            onMarkWatched={(movie) => setDialogMovie(movie)}
          />
        </div>
      )}

      {/* Panneau Ma collection */}
      {activeTab === "collection" && (
        <div id="tab-collection" role="tabpanel" className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <input
                type="text"
                placeholder="Filtrer la collection…"
                value={collectionSearch}
                onChange={(e) => setCollectionSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  onClick={() => setCollectionRatingFilter(collectionRatingFilter === r ? null : r)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-0.5 cursor-pointer ${
                    collectionRatingFilter === r
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-white/5 text-muted-foreground hover:text-white"
                  }`}
                >
                  {r}
                  <Star className="w-3 h-3 fill-current" aria-hidden="true" />
                  +
                </button>
              ))}
            </div>
            {collectionWatchedYears.length > 0 && (
              <div className="relative">
                <select
                  value={collectionYearFilter ?? ""}
                  onChange={(e) => setCollectionYearFilter(e.target.value ? Number(e.target.value) : null)}
                  className={`appearance-none rounded-full pl-3 pr-7 py-1.5 text-xs font-medium border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    collectionYearFilter
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : "bg-white/5 text-muted-foreground border-transparent hover:text-white"
                  }`}
                >
                  <option value="" className="bg-neutral-900 text-white">Année de visionnage</option>
                  {collectionWatchedYears.map((y) => (
                    <option key={y} value={y} className="bg-neutral-900 text-white">{y}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-muted-foreground" aria-hidden="true" />
              </div>
            )}
          </div>

          {filteredCollection.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              {watchedMovies.length === 0
                ? "Aucun film vu pour le moment. Explorez le catalogue et marquez des films comme vus !"
                : "Aucun film ne correspond aux filtres."}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCollection.map((movie) => (
                <Link
                  key={movie.tmdbId}
                  href={`/movie/${slugify(movie.title, movie.tmdbId)}`}
                  className="flex items-start gap-4 rounded-xl border border-border/50 bg-card p-4 hover:bg-muted/30 transition-colors"
                >
                  {movie.posterPath ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w154${movie.posterPath}`}
                      alt=""
                      className="w-16 h-24 rounded-lg object-cover flex-shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-16 h-24 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Eye className="w-5 h-5 text-muted-foreground/50" aria-hidden="true" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-semibold text-sm truncate">{movie.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {movie.director && <span>{movie.director}</span>}
                      {movie.releaseYear && <span> · {movie.releaseYear}</span>}
                    </p>
                    {movie.rating != null && (
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => {
                          const filled = movie.rating! >= n;
                          const half = !filled && movie.rating! >= n - 0.5;
                          return half ? (
                            <div key={n} className="relative w-3.5 h-3.5">
                              <Star className="w-3.5 h-3.5 text-muted-foreground/30 absolute inset-0" />
                              <StarHalf className="w-3.5 h-3.5 fill-amber-400 text-amber-400 absolute inset-0" />
                            </div>
                          ) : (
                            <Star key={n} className={`w-3.5 h-3.5 ${filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                          );
                        })}
                        <span className="text-xs text-amber-400 font-medium ml-1">{movie.rating}</span>
                      </div>
                    )}
                    {movie.watchedAt && (
                      <p className="text-xs text-muted-foreground/70">
                        {movie.watchedPrecision === "year"
                          ? `Vu en ${new Date(movie.watchedAt).getFullYear()}`
                          : `Vu le ${new Date(movie.watchedAt).toLocaleDateString("fr-FR")}`}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      {isSharedItem(movie) ? (
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20"
                          title="Ce film fait partie du catalogue de démonstration — il est partagé avec tous les visiteurs et ne peut pas être modifié."
                        >
                          Catalogue partagé
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditMovie(movie); }}
                            className="text-xs text-muted-foreground hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Pencil className="w-3 h-3" aria-hidden="true" />
                            Modifier
                          </button>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMovieToRemove(movie); }}
                            className="text-xs text-red-400/70 hover:text-red-400 transition-colors cursor-pointer"
                          >
                            Retirer
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mark watched dialog */}
      <MarkWatchedDialog
        movie={dialogMovie}
        onClose={() => setDialogMovie(null)}
        onConfirm={handleMarkWatched}
      />

      {/* Edit watched dialog */}
      <MarkWatchedDialog
        movie={editMovie ? {
          tmdbId: editMovie.tmdbId,
          title: editMovie.title,
          posterPath: editMovie.posterPath,
          originalTitle: null,
          rating: 0,
          runtimeMinutes: 0,
          runtime: null,
          director: editMovie.director,
          cast: [],
          releaseDate: editMovie.releaseYear ? `${editMovie.releaseYear}-01-01` : "",
          genres: [],
          overview: editMovie.overview ?? null,
          watched: true,
        } : null}
        onClose={() => setEditMovie(null)}
        onConfirm={handleEditWatched}
        initialRating={editMovie?.rating}
        initialWatchedAt={editMovie?.watchedAt}
      />

      {/* Confirm remove dialog */}
      <ConfirmDialog
        open={movieToRemove !== null}
        title="Retirer de la collection"
        description={movieToRemove ? `Voulez-vous vraiment retirer « ${movieToRemove.title} » de votre collection ?` : ""}
        confirmLabel="Retirer"
        cancelLabel="Annuler"
        onConfirm={() => movieToRemove && handleRemoveWatched(movieToRemove.tmdbId)}
        onCancel={() => setMovieToRemove(null)}
      />
    </div>
  );
}
