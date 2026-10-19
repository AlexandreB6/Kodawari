/**
 * Prix Cardmarket, côté serveur.
 *
 * Source : le price guide public de Cardmarket (toutes les cartes Magic,
 * ~26 Mo, régénéré chaque nuit). L'API Cardmarket n'accepte plus de
 * nouveaux comptes et ce fichier est la seule donnée officielle : un prix
 * par produit, en normal et en foil, sans détail de langue ni d'état.
 *
 * Le fichier est filtré sur nos cartes (clé `cm` de cards.json) et seul ce
 * résultat, quelques dizaines de Ko, est mis en cache.
 */

import { unstable_cache } from "next/cache";
import { CARDS } from "@/data/catalog";
import type { PriceGuide } from "@/lib/pricing";

const PRICE_GUIDE_URL = "https://downloads.s3.cardmarket.com/productCatalog/priceGuide/price_guide_1.json";

interface CardmarketEntry {
  idProduct: number;
  trend: number | null;
  "trend-foil": number | null;
}

async function fetchPriceGuide(): Promise<PriceGuide> {
  // no-store : 26 Mo dépassent la limite du cache de fetch ; on met en cache
  // le résultat filtré à la place.
  const res = await fetch(PRICE_GUIDE_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Price guide Cardmarket : ${res.status}`);
  const json = (await res.json()) as { createdAt: string; priceGuides: CardmarketEntry[] };

  const byProduct = new Map(json.priceGuides.map((p) => [p.idProduct, p]));
  const prices: PriceGuide["prices"] = {};
  for (const card of CARDS) {
    const entry = card.cm ? byProduct.get(card.cm) : undefined;
    if (entry) prices[card.id] = [entry.trend, entry["trend-foil"]];
  }
  return { date: json.createdAt, prices };
}

// Une erreur n'est pas mise en cache : le prochain appel réessaie.
const cachedPriceGuide = unstable_cache(fetchPriceGuide, ["cardmarket-price-guide"], {
  revalidate: 6 * 60 * 60,
});

/** Prix tendance de nos cartes ; vide si Cardmarket est injoignable. */
export async function getPriceGuide(): Promise<PriceGuide> {
  try {
    return await cachedPriceGuide();
  } catch (error) {
    console.error(error);
    return { date: null, prices: {} };
  }
}
