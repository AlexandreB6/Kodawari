/**
 * Estimation des prix à partir du price guide Cardmarket (voir prices.ts).
 *
 * Cardmarket ne publie qu'un prix tendance par carte, en normal et en foil.
 * La langue est prise en compte par un coefficient réglable ; l'état n'est
 * pas suivi : tout est compté en Near Mint.
 */

import { isFoil, LANGUAGES, type Card, type Finish, type Lang } from "@/data/catalog";

export interface PriceGuide {
  /** Date de génération du price guide (ISO), null s'il n'a pas pu être chargé */
  date: string | null;
  /** Par id Scryfall : [tendance normale, tendance foil] en euros */
  prices: Record<string, [number | null, number | null]>;
}

export type LangCoefficients = Record<Lang, number>;

/**
 * Coefficients par défaut, relatifs à l'anglais : ordres de grandeur
 * habituels sur Cardmarket, à ajuster selon ce que tu observes.
 */
export const DEFAULT_LANG_COEFFICIENTS: LangCoefficients = {
  en: 1,
  fr: 0.9,
  ja: 1.1,
  de: 0.85,
  it: 0.85,
  es: 0.85,
  pt: 0.85,
  ko: 0.9,
  ru: 0.85,
  zhs: 0.9,
  zht: 0.9,
};

/** Coefficients enregistrés, complétés par les valeurs par défaut. */
export function parseCoefficients(raw: unknown): LangCoefficients {
  const out = { ...DEFAULT_LANG_COEFFICIENTS };
  if (raw && typeof raw === "object") {
    for (const { id } of LANGUAGES) {
      const v = (raw as Record<string, unknown>)[id];
      if (typeof v === "number" && v >= 0 && v <= 10) out[id] = v;
    }
  }
  return out;
}

/**
 * Prix tendance d'une carte dans une finition, sans coefficient. Une carte
 * uniquement foil n'a parfois que le prix « normal » côté Cardmarket.
 * Les art cards signées n'ont pas de cote : null.
 */
export function basePrice(guide: PriceGuide, card: Card, finish: Finish): number | null {
  const p = guide.prices[card.id];
  if (!p) return null;
  if (finish === "nonfoil") return p[0];
  if (isFoil(finish)) return p[1] ?? (card.finishes.includes("nonfoil") ? null : p[0]);
  return null;
}

/** Prix estimé d'un exemplaire : tendance × coefficient de langue. */
export function unitPrice(
  guide: PriceGuide,
  card: Card,
  finish: Finish,
  lang: Lang,
  coefficients: LangCoefficients,
): number | null {
  const base = basePrice(guide, card, finish);
  return base === null ? null : base * coefficients[lang];
}

/** Coût d'une carte manquante : version normale NM anglaise, sinon foil. */
export function missingPrice(guide: PriceGuide, card: Card): number | null {
  return basePrice(guide, card, card.finishes.includes("nonfoil") ? "nonfoil" : "foil");
}

const EUR = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
export const formatEur = (n: number) => EUR.format(n);
