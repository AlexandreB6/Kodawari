"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Search, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@repo/core/utils";
import {
  CARD_MAP,
  CARDS,
  COLORS,
  compareCards,
  FINISH_LABEL,
  LANG_LABEL,
  LANGUAGES,
  MAIN_LANGUAGES,
  RARITIES,
  RARITY_RANK,
  SET_GROUPS,
  setGroup,
  SET_MAP,
  SETS,
  type Card,
  type Finish,
  type Lang,
  type SetGroup,
} from "@/data/catalog";
import { useCollection, type OwnedLine } from "@/lib/useCollection";
import { MtgCard } from "./MtgCard";
import { CardDialog } from "./CardDialog";
import { Chip } from "./Chip";

/** Nombre de cartes rendues d'un coup ; la suite arrive au défilement. */
const PAGE = 120;
const PREFS_KEY = "tcg:quick-add";

type Stock = "all" | "owned" | "missing";
type Sort = "number" | "name" | "rarity";

interface Props {
  initialOwned: OwnedLine[];
  /** « collection » : ouvre sur les cartes possédées, avec les statistiques */
  mode: "catalog" | "collection";
}

/** Finition réellement ajoutée : celle choisie si la carte l'existe, sinon la première dispo. */
const finishFor = (card: Card, wanted: Finish) => (card.finishes.includes(wanted) ? wanted : card.finishes[0]);

/**
 * Catalogue Final Fantasy et collection de l'utilisateur : filtres, grille
 * avec ajout rapide au survol, détail d'une carte en dialog.
 */
export function CatalogClient({ initialOwned, mode }: Props) {
  const { byCard, lines, setQuantity, quantityOf } = useCollection(initialOwned);

  // ── Ajout rapide : langue et finition, retenues d'une visite à l'autre ──
  const [quickLang, setQuickLang] = useState<Lang>("en");
  const [quickFinish, setQuickFinish] = useState<Finish>("nonfoil");
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "null");
      if (LANGUAGES.some((l) => l.id === saved?.lang)) setQuickLang(saved.lang);
      if (saved?.finish === "foil" || saved?.finish === "nonfoil") setQuickFinish(saved.finish);
    } catch {
      // stockage indisponible : réglages par défaut
    }
  }, []);
  const savePrefs = (lang: Lang, finish: Finish) => {
    setQuickLang(lang);
    setQuickFinish(finish);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ lang, finish }));
    } catch {}
  };

  // ── Filtres ──
  const [search, setSearch] = useState("");
  const [group, setGroupFilter] = useState<SetGroup | "all">("all");
  const [setCode, setSetCode] = useState<string>("all");
  const [rarity, setRarity] = useState<string>("all");
  const [color, setColor] = useState<string>("all");
  const [stock, setStock] = useState<Stock>(mode === "collection" ? "owned" : "all");
  const [foilOnly, setFoilOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("number");
  const deferredSearch = useDeferredValue(search);

  const defaultStock: Stock = mode === "collection" ? "owned" : "all";
  const hasActiveFilters =
    search !== "" || group !== "all" || rarity !== "all" || color !== "all" || stock !== defaultStock || foilOnly;
  const resetFilters = () => {
    setSearch("");
    setGroupFilter("all");
    setSetCode("all");
    setRarity("all");
    setColor("all");
    setStock(defaultStock);
    setFoilOnly(false);
  };

  /** Sets du groupe choisi : un sous-filtre n'apparaît que s'il y en a plusieurs. */
  const groupSets = useMemo(() => (group === "all" ? [] : SETS.filter((s) => setGroup(s) === group)), [group]);

  const filtered = useMemo(() => {
    const q = deferredSearch.toLowerCase().trim();
    const list = CARDS.filter((c) => {
      if (group !== "all" && setGroup(SET_MAP.get(c.set)!) !== group) return false;
      if (setCode !== "all" && c.set !== setCode) return false;
      if (rarity !== "all" && c.rarity !== rarity) return false;
      if (color !== "all" && (color === "C" ? c.colors.length > 0 : !c.colors.includes(color))) return false;
      const summary = byCard.get(c.id);
      if (stock === "owned" && !summary) return false;
      if (stock === "missing" && summary) return false;
      if (foilOnly && !summary?.foil) return false;
      if (q && !c.name.toLowerCase().includes(q) && c.cn !== q.replace(/^#/, "")) return false;
      return true;
    });
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name) || compareCards(a, b));
    if (sort === "rarity")
      list.sort((a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity] || compareCards(a, b));
    return list;
  }, [deferredSearch, group, setCode, rarity, color, stock, foilOnly, sort, byCard]);

  const ownedInFilter = useMemo(() => filtered.filter((c) => byCard.has(c.id)).length, [filtered, byCard]);

  // ── Rendu progressif ──
  const [visible, setVisible] = useState(PAGE);
  useEffect(() => setVisible(PAGE), [deferredSearch, group, setCode, rarity, color, stock, foilOnly, sort]);
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && setVisible((v) => v + PAGE),
      { rootMargin: "1200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ── Actions ──
  const addCard = useCallback(
    (card: Card) => {
      const finish = finishFor(card, quickFinish);
      const before = quantityOf(card.id, finish, quickLang);
      setQuantity(card.id, finish, quickLang, before + 1);
      toast.success(`${card.name} ajoutée`, {
        description: `${LANG_LABEL[quickLang]} · ${FINISH_LABEL[finish]}`,
        duration: 2500,
        action: { label: "Annuler", onClick: () => setQuantity(card.id, finish, quickLang, before) },
      });
    },
    [quickFinish, quickLang, quantityOf, setQuantity],
  );

  const [openId, setOpenId] = useState<string | null>(null);
  const openCard = useCallback((card: Card) => setOpenId(card.id), []);
  const openIndex = openId ? filtered.findIndex((c) => c.id === openId) : -1;
  // Une carte retirée du filtre (ex. « Possédées » à 0) reste ouverte.
  const openCardData = openId ? (CARD_MAP.get(openId) ?? null) : null;

  return (
    <div className="space-y-5">
      {mode === "collection" ? (
        <CollectionStats lines={lines} uniqueOwned={byCard.size} />
      ) : (
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Final Fantasy</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {byCard.size} / {CARDS.length} cartes possédées
          </p>
        </div>
      )}

      {/* Barre collante : recherche + réglages d'ajout rapide */}
      <div className="sticky top-[calc(4.0625rem+env(safe-area-inset-top))] z-30 -mx-[var(--gutter,1rem)] border-b border-border/50 bg-background/90 px-[var(--gutter,1rem)] py-2.5 backdrop-blur-xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative w-full sm:w-64" role="search">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              placeholder="Nom ou numéro…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Rechercher une carte"
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-base sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto sm:ml-auto" aria-label="Ajout rapide">
            <span className="mr-1 shrink-0 text-xs text-muted-foreground">Ajout :</span>
            {MAIN_LANGUAGES.map((l) => (
              <Chip key={l.id} active={quickLang === l.id} onClick={() => savePrefs(l.id, quickFinish)} title={l.name}>
                {l.label}
              </Chip>
            ))}
            <select
              value={MAIN_LANGUAGES.some((l) => l.id === quickLang) ? "" : quickLang}
              onChange={(e) => e.target.value && savePrefs(e.target.value as Lang, quickFinish)}
              aria-label="Autre langue d'ajout"
              className={cn(
                "h-7 shrink-0 rounded-full border-0 px-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring",
                MAIN_LANGUAGES.some((l) => l.id === quickLang) ? "bg-muted text-muted-foreground" : "bg-rose-500 text-white",
              )}
            >
              <option value="">…</option>
              {LANGUAGES.slice(3).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label} — {l.name}
                </option>
              ))}
            </select>
            <div className="mx-1 h-4 w-px shrink-0 bg-border" />
            <Chip active={quickFinish === "nonfoil"} onClick={() => savePrefs(quickLang, "nonfoil")}>
              Normale
            </Chip>
            <Chip active={quickFinish === "foil"} onClick={() => savePrefs(quickLang, "foil")}>
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              Foil
            </Chip>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="space-y-2.5">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          <Chip active={group === "all"} onClick={() => (setGroupFilter("all"), setSetCode("all"))}>
            Toutes les extensions
          </Chip>
          {SET_GROUPS.map((g) => (
            <Chip
              key={g.id}
              active={group === g.id}
              onClick={() => {
                setGroupFilter(group === g.id ? "all" : g.id);
                setSetCode("all");
              }}
            >
              {g.label}
            </Chip>
          ))}
        </div>

        {groupSets.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            <SetChip active={setCode === "all"} onClick={() => setSetCode("all")} label="Tous" />
            {groupSets.map((s) => (
              <SetChip
                key={s.code}
                active={setCode === s.code}
                onClick={() => setSetCode(setCode === s.code ? "all" : s.code)}
                label={s.name}
                icon={s.icon}
                count={s.count}
              />
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          {RARITIES.map((r) => (
            <Chip key={r.id} active={rarity === r.id} onClick={() => setRarity(rarity === r.id ? "all" : r.id)}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: r.color }} aria-hidden="true" />
              {r.label}
            </Chip>
          ))}
          <div className="mx-1 h-4 w-px bg-border" />
          {COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              title={c.label}
              aria-label={c.label}
              aria-pressed={color === c.id}
              onClick={() => setColor(color === c.id ? "all" : c.id)}
              className={cn(
                "h-5 w-5 rounded-full border-2 cursor-pointer transition-all hover:scale-110",
                color === c.id ? "border-white scale-110 ring-2 ring-white/30" : "border-transparent hover:border-white/40",
              )}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(["all", "owned", "missing"] as const).map((v) => (
            <Chip key={v} active={stock === v} onClick={() => setStock(v)}>
              {{ all: "Toutes", owned: "Possédées", missing: "Manquantes" }[v]}
            </Chip>
          ))}
          <Chip active={foilOnly} onClick={() => setFoilOnly((f) => !f)}>
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Mes foils
          </Chip>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 cursor-pointer transition-colors"
            >
              <X className="h-3 w-3" aria-hidden="true" />
              Reset
            </button>
          )}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            aria-label="Trier"
            className="ml-auto h-7 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="number">Tri : numéro</option>
            <option value="name">Tri : nom</option>
            <option value="rarity">Tri : rareté</option>
          </select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {filtered.length} carte{filtered.length !== 1 ? "s" : ""}
        {stock === "all" && filtered.length > 0 && ` · ${ownedInFilter} possédée${ownedInFilter !== 1 ? "s" : ""}`}
      </p>

      <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {filtered.slice(0, visible).map((card) => (
          <MtgCard
            key={card.id}
            card={card}
            summary={byCard.get(card.id)}
            finish={finishFor(card, quickFinish)}
            lang={quickLang}
            onAdd={addCard}
            onOpen={openCard}
          />
        ))}
      </div>
      <div ref={sentinel} aria-hidden="true" />

      {filtered.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">
          {mode === "collection" && byCard.size === 0
            ? "Ta collection est vide : ajoute des cartes depuis le catalogue."
            : "Aucune carte trouvée."}
        </p>
      )}

      <CardDialog
        card={openCardData}
        summary={openId ? byCard.get(openId) : undefined}
        defaultFinish={quickFinish}
        defaultLang={quickLang}
        quantityOf={quantityOf}
        setQuantity={setQuantity}
        onPrev={openIndex > 0 ? () => setOpenId(filtered[openIndex - 1].id) : undefined}
        onNext={openIndex >= 0 && openIndex < filtered.length - 1 ? () => setOpenId(filtered[openIndex + 1].id) : undefined}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}

/** Pastille d'un set, avec son symbole Scryfall. */
function SetChip({
  active,
  onClick,
  label,
  icon,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: string;
  count?: number;
}) {
  return (
    <Chip active={active} onClick={onClick}>
      {icon && <img src={icon} alt="" className="h-3.5 w-3.5 invert" />}
      {label}
      {count !== undefined && <span className="opacity-60">{count}</span>}
    </Chip>
  );
}

/** En-tête de /collection : totaux, progression par extension, langues. */
function CollectionStats({ lines, uniqueOwned }: { lines: Map<string, OwnedLine>; uniqueOwned: number }) {
  const stats = useMemo(() => {
    let copies = 0;
    let foils = 0;
    const byLang = new Map<Lang, number>();
    const bySet = new Map<string, Set<string>>();
    for (const l of lines.values()) {
      copies += l.quantity;
      if (l.finish !== "nonfoil") foils += l.quantity;
      byLang.set(l.lang, (byLang.get(l.lang) ?? 0) + l.quantity);
      const set = SET_MAP.get(CARD_MAP.get(l.scryfallId)?.set ?? "");
      if (!set) continue;
      if (!bySet.has(set.code)) bySet.set(set.code, new Set());
      bySet.get(set.code)!.add(l.scryfallId);
    }
    return { copies, foils, byLang, bySet };
  }, [lines]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Ma collection</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {uniqueOwned} cartes · {stats.copies} exemplaires · {stats.foils} foil{stats.foils !== 1 ? "s" : ""}
        </p>
      </div>
      {stats.copies > 0 && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {[...stats.byLang].sort((a, b) => b[1] - a[1]).map(([lang, n]) => (
              <span key={lang} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                {LANG_LABEL[lang]} <span className="text-muted-foreground">{n}</span>
              </span>
            ))}
          </div>
          <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {SETS.filter((s) => stats.bySet.has(s.code)).map((s) => {
              const owned = stats.bySet.get(s.code)!.size;
              return (
                <div key={s.code} className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs">
                    <img src={s.icon} alt="" className="h-3.5 w-3.5 invert opacity-80" />
                    <span className="truncate">{s.name}</span>
                    <span className="ml-auto tabular-nums text-muted-foreground">
                      {owned} / {s.count}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-rose-500" style={{ width: `${(owned / s.count) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
