"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, X, ChevronLeft } from "lucide-react";
import { getColorFamily, COLOR_FAMILIES, type ColorFamily } from "@/data/paint-types";
import type { Paint } from "@/data/paint-types";
import { PaintCard } from "./PaintCard";
import Link from "next/link";
import { apiFetch } from "@repo/core/apiFetch";
import { IS_DEMO } from "@repo/core/clientDemo";

/** Couleurs d'affichage pour les pastilles de filtre par famille de couleur */
const FAMILY_DOT_COLORS: Record<string, string> = {
  Rouge: "#DC2626",
  Orange: "#EA580C",
  Jaune: "#EAB308",
  Vert: "#16A34A",
  Bleu: "#2563EB",
  Violet: "#7C3AED",
  Rose: "#DB2777",
  Marron: "#92400E",
  Beige: "#D4A574",
  Gris: "#6B7280",
  Noir: "#1F2937",
  Blanc: "#F3F4F6",
};

interface OwnedPaint {
  paintId: string;
  quantity: number;
  notes: string | null;
  demoSessionId: string | null;
}

interface Props {
  initialOwned: OwnedPaint[];
  paints: Paint[];
  paintTypes: string[];
  typeColors: Record<string, string>;
  rangeSlug: string;
  rangeName: string;
}

/**
 * Client component pour l'inventaire de peintures (générique multi-gamme).
 * Gère les filtres (recherche, type, stock, couleur, métallique) et les actions CRUD optimistes.
 */
export function PeintureClient({
  initialOwned,
  paints,
  paintTypes,
  typeColors,
  rangeSlug,
  rangeName,
}: Props) {
  // État des peintures possédées — Map<paintId, quantity>
  const [owned, setOwned] = useState<Map<string, number>>(() => {
    const m = new Map<string, number>();
    for (const o of initialOwned) m.set(o.paintId, o.quantity);
    return m;
  });

  // Peintures du catalogue partagé (mode démo) — non modifiables
  const sharedPaintIds = useMemo(() => {
    if (!IS_DEMO) return new Set<string>();
    return new Set(initialOwned.filter((o) => o.demoSessionId == null).map((o) => o.paintId));
  }, [initialOwned]);

  // États de filtre
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<"all" | "owned" | "missing">(
    "all",
  );
  const [colorFilter, setColorFilter] = useState<ColorFamily | "all">("all");
  const [metallicOnly, setMetallicOnly] = useState(false);

  const hasActiveFilters =
    search !== "" ||
    typeFilter !== "all" ||
    stockFilter !== "all" ||
    colorFilter !== "all" ||
    metallicOnly;

  const resetFilters = useCallback(() => {
    setSearch("");
    setTypeFilter("all");
    setStockFilter("all");
    setColorFilter("all");
    setMetallicOnly(false);
  }, []);

  const hasMetallics = useMemo(() => paints.some((p) => p.metallic), [paints]);

  /** Liste filtrée des peintures — recalculée à chaque changement de filtre */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return paints.filter((p) => {
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (stockFilter === "owned" && !owned.has(p.id)) return false;
      if (stockFilter === "missing" && owned.has(p.id)) return false;
      if (colorFilter !== "all" && getColorFamily(p.hex) !== colorFilter)
        return false;
      if (metallicOnly && !p.metallic) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, typeFilter, stockFilter, colorFilter, metallicOnly, owned, paints]);

  const totalOwned = owned.size;
  const totalPaints = paints.length;

  /** Appel API générique pour persister les changements (toast auto sur erreur). */
  const apiCall = useCallback(
    async (method: string, body: Record<string, unknown>) => {
      await apiFetch("/api/paints", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, range: rangeSlug }),
      });
    },
    [rangeSlug],
  );

  const addPaint = useCallback(
    (paintId: string) => {
      setOwned((prev) => new Map(prev).set(paintId, 1));
      apiCall("POST", { paintId, quantity: 1 });
    },
    [apiCall],
  );

  const removePaint = useCallback(
    (paintId: string) => {
      setOwned((prev) => {
        const next = new Map(prev);
        next.delete(paintId);
        return next;
      });
      apiCall("DELETE", { paintId });
    },
    [apiCall],
  );

  const setQuantity = useCallback(
    (paintId: string, quantity: number) => {
      if (quantity <= 0) {
        removePaint(paintId);
        return;
      }
      setOwned((prev) => new Map(prev).set(paintId, quantity));
      apiCall("PUT", { paintId, quantity });
    },
    [apiCall, removePaint],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ChevronLeft className="h-4 w-4" />
          Gammes de peinture
        </Link>
        <h1 className="text-4xl font-extrabold tracking-tight">
          Peintures {rangeName}
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          {totalOwned} / {totalPaints} peintures
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Row 1: Search + Stock + Reset */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="relative w-full sm:w-56" role="search">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Rechercher une peinture"
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-base sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {(["all", "owned", "missing"] as const).map((v) => {
              const label = { all: "Toutes", owned: "Possédées", missing: "Manquantes" }[v];
              return (
                <FilterButton
                  key={v}
                  active={stockFilter === v}
                  onClick={() => setStockFilter(v)}
                  aria-pressed={stockFilter === v}
                >
                  {label}
                </FilterButton>
              );
            })}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                aria-label="Réinitialiser les filtres"
                className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 cursor-pointer transition-colors"
              >
                <X className="h-3 w-3" aria-hidden="true" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Type + Metallic */}
        <div className="flex flex-wrap items-center gap-1.5">
          {paintTypes.map((t) => (
            <FilterButton
              key={t}
              active={typeFilter === t}
              onClick={() => setTypeFilter(typeFilter === t ? "all" : t)}
              aria-pressed={typeFilter === t}
            >
              {t}
            </FilterButton>
          ))}
          {hasMetallics && (
            <>
              <div className="mx-1.5 h-4 w-px bg-border" />
              <button
                onClick={() => setMetallicOnly((v) => !v)}
                title="Métallique"
                aria-label="Filtrer les peintures métalliques"
                aria-pressed={metallicOnly}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-colors ${
                  metallicOnly
                    ? "bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/40"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600" />
                Metal
              </button>
            </>
          )}
        </div>

        {/* Row 3: Color dots */}
        <div className="flex items-center gap-2">
          {COLOR_FAMILIES.map((c) => (
            <button
              key={c}
              title={c}
              aria-label={c}
              aria-pressed={colorFilter === c}
              onClick={() => setColorFilter(colorFilter === c ? "all" : c)}
              className={`h-5 w-5 rounded-full border-2 cursor-pointer transition-all hover:scale-110 ${
                colorFilter === c
                  ? "border-white scale-110 ring-2 ring-white/30"
                  : "border-transparent hover:border-white/40"
              }`}
              style={{ backgroundColor: FAMILY_DOT_COLORS[c] }}
            />
          ))}
        </div>
      </div>

      {/* Compteur de résultats */}
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {filtered.length} peinture{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {filtered.map((paint) => (
          <PaintCard
            key={paint.id}
            paint={paint}
            typeColors={typeColors}
            quantity={owned.get(paint.id) ?? 0}
            isShared={sharedPaintIds.has(paint.id)}
            onAdd={() => addPaint(paint.id)}
            onRemove={() => removePaint(paint.id)}
            onIncrement={() =>
              setQuantity(paint.id, (owned.get(paint.id) ?? 0) + 1)
            }
            onDecrement={() =>
              setQuantity(paint.id, (owned.get(paint.id) ?? 1) - 1)
            }
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">
          Aucune peinture trouvée.
        </p>
      )}
    </div>
  );
}

/** Bouton de filtre générique avec état actif/inactif */
function FilterButton({
  active,
  onClick,
  children,
  "aria-pressed": ariaPressed,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  "aria-pressed"?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
