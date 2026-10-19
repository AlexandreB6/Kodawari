/**
 * Catalogue Final Fantasy, statique : généré depuis Scryfall par
 * `scripts/sync-cards.mts`. La base ne stocke que la possession.
 */

import cardsJson from "./cards.json";
import setsJson from "./sets.json";

export type Finish = "nonfoil" | "foil" | "etched";

export interface Card {
  /** Identifiant Scryfall de l'impression */
  id: string;
  set: string;
  /** Numéro de collection (peut contenir des lettres : « 12a », « 400★ ») */
  cn: string;
  name: string;
  rarity: string;
  colors: string[];
  type: string;
  finishes: Finish[];
  /** Double face : une image par face */
  dfc?: boolean;
}

export interface MtgSet {
  code: string;
  name: string;
  type: string;
  parent: string | null;
  releasedAt: string;
  icon: string;
  count: number;
}

/**
 * Groupes d'extensions affichés dans les filtres, dans cet ordre. Les 3 sets
 * racine s'affichent par leur code, le nom complet passe en infobulle.
 */
export const SET_GROUPS = [
  { id: "fin", label: "FIN", name: "Final Fantasy" },
  { id: "fic", label: "FIC", name: "Final Fantasy Commander" },
  { id: "fca", label: "FCA", name: "Final Fantasy: Through the Ages" },
  { id: "tokens", label: "Jetons", name: "Jetons (TFIN, TFIC…)" },
  { id: "extras", label: "Promos & art", name: "Promos, art series, scene box…" },
] as const;

export type SetGroup = (typeof SET_GROUPS)[number]["id"];

/** Groupe d'un set : les 3 sets racine ont le leur, le reste est jeton ou extra. */
export function setGroup(set: MtgSet): SetGroup {
  if (set.code === "fin" || set.code === "fic" || set.code === "fca") return set.code;
  return set.type === "token" ? "tokens" : "extras";
}

const groupIndex = (s: MtgSet) => SET_GROUPS.findIndex((g) => g.id === setGroup(s));

export const SETS: MtgSet[] = [...setsJson].sort(
  (a, b) => groupIndex(a) - groupIndex(b) || b.count - a.count,
);
export const SET_MAP = new Map(SETS.map((s) => [s.code, s]));

const setIndex = new Map(SETS.map((s, i) => [s.code, i]));

/** Numéro de collection comparé numériquement, puis par suffixe. */
function compareCn(a: string, b: string) {
  return parseInt(a, 10) - parseInt(b, 10) || a.localeCompare(b);
}

/** Toutes les cartes, triées par extension puis par numéro. */
export const CARDS: Card[] = (cardsJson as Card[]).sort(
  (a, b) => setIndex.get(a.set)! - setIndex.get(b.set)! || compareCn(a.cn, b.cn),
);
export const CARD_MAP = new Map(CARDS.map((c) => [c.id, c]));

export function compareCards(a: Card, b: Card) {
  return setIndex.get(a.set)! - setIndex.get(b.set)! || compareCn(a.cn, b.cn);
}

/** URL d'image Scryfall, déduite de l'id (le JSON ne la stocke pas). */
export function cardImage(id: string, size: "normal" | "large" = "normal", face: "front" | "back" = "front") {
  return `https://cards.scryfall.io/${size}/${face}/${id[0]}/${id[1]}/${id}.jpg`;
}

export const FINISHES: { id: Finish; label: string }[] = [
  { id: "nonfoil", label: "Normale" },
  { id: "foil", label: "Foil" },
  { id: "etched", label: "Etched" },
];
export const FINISH_LABEL = Object.fromEntries(FINISHES.map((f) => [f.id, f.label])) as Record<Finish, string>;

/** Langues d'impression Magic. Les 3 premières sont mises en avant. */
export const LANGUAGES = [
  { id: "en", label: "EN", name: "Anglais" },
  { id: "fr", label: "FR", name: "Français" },
  { id: "ja", label: "JA", name: "Japonais" },
  { id: "de", label: "DE", name: "Allemand" },
  { id: "it", label: "IT", name: "Italien" },
  { id: "es", label: "ES", name: "Espagnol" },
  { id: "pt", label: "PT", name: "Portugais" },
  { id: "ko", label: "KO", name: "Coréen" },
  { id: "ru", label: "RU", name: "Russe" },
  { id: "zhs", label: "ZHS", name: "Chinois simplifié" },
  { id: "zht", label: "ZHT", name: "Chinois traditionnel" },
] as const;
export type Lang = (typeof LANGUAGES)[number]["id"];
export const MAIN_LANGUAGES = LANGUAGES.slice(0, 3);
export const LANG_LABEL = Object.fromEntries(LANGUAGES.map((l) => [l.id, l.label])) as Record<Lang, string>;
export const isLang = (v: unknown): v is Lang => LANGUAGES.some((l) => l.id === v);

export const RARITIES = [
  { id: "common", label: "Commune", color: "#a3a3a3" },
  { id: "uncommon", label: "Peu commune", color: "#b8c7d9" },
  { id: "rare", label: "Rare", color: "#d4b062" },
  { id: "mythic", label: "Mythique", color: "#e8692c" },
] as const;
export const RARITY_RANK: Record<string, number> = Object.fromEntries(RARITIES.map((r, i) => [r.id, i]));

/** Couleurs Magic (WUBRG), plus incolore. */
export const COLORS = [
  { id: "W", label: "Blanc", hex: "#f8f1d4" },
  { id: "U", label: "Bleu", hex: "#3b82f6" },
  { id: "B", label: "Noir", hex: "#3f3f46" },
  { id: "R", label: "Rouge", hex: "#dc2626" },
  { id: "G", label: "Vert", hex: "#16a34a" },
  { id: "C", label: "Incolore", hex: "#a8a29e" },
] as const;
