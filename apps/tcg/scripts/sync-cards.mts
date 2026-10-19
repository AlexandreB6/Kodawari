/**
 * Synchronise le catalogue Final Fantasy depuis Scryfall.
 *
 *   npm run sync-cards -w tcg
 *
 * Garde tous les sets FF (principal, Commander, Through the Ages) et leurs
 * sous-sets (jetons, promos, art series…), puis écrit src/data/sets.json et
 * src/data/cards.json. À relancer quand une nouvelle extension FF sort.
 */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_SETS = new Set(["fin", "fic", "fca"]);
const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");

// Scryfall exige un User-Agent et un Accept explicites, et ~10 req/s maximum.
const HEADERS = { "User-Agent": "Kodawari/1.0 (collection perso)", Accept: "application/json" };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get<T>(url: string): Promise<T> {
  await sleep(100);
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json() as Promise<T>;
}

interface ScryfallSet {
  code: string;
  name: string;
  set_type: string;
  released_at: string;
  parent_set_code?: string;
  icon_svg_uri: string;
  card_count: number;
}

interface ScryfallCard {
  id: string;
  set: string;
  collector_number: string;
  name: string;
  rarity: string;
  colors?: string[];
  type_line?: string;
  finishes: string[];
  layout: string;
  cardmarket_id?: number;
  card_faces?: { colors?: string[]; type_line?: string; image_uris?: unknown }[];
  image_uris?: unknown;
}

const { data: allSets } = await get<{ data: ScryfallSet[] }>("https://api.scryfall.com/sets");
const sets = allSets
  .filter((s) => s.card_count > 0)
  .filter((s) => ROOT_SETS.has(s.code) || (s.parent_set_code && ROOT_SETS.has(s.parent_set_code)))
  .sort((a, b) => a.released_at.localeCompare(b.released_at) || a.code.localeCompare(b.code));

const cards: { set: string; [field: string]: unknown }[] = [];
for (const set of sets) {
  let url: string | null =
    `https://api.scryfall.com/cards/search?q=e:${set.code}` +
    "&unique=prints&include_extras=true&include_variations=true&order=set";
  let count = 0;
  while (url) {
    const page: { data: ScryfallCard[]; has_more: boolean; next_page?: string } = await get(url);
    for (const c of page.data) {
      const front = c.card_faces?.[0];
      cards.push({
        id: c.id,
        set: c.set,
        cn: c.collector_number,
        name: c.name,
        rarity: c.rarity,
        colors: c.colors ?? front?.colors ?? [],
        type: (front?.type_line ?? c.type_line ?? "").split(" — ")[0],
        // Scryfall ne distingue pas les art cards signées (signature dorée) :
        // elles sont suivies comme une finition à part. La Scene Box a le même
        // layout mais n'existe pas en version signée, d'où le filtre sur le set.
        finishes:
          c.layout === "art_series" && set.name.endsWith("Art Series") ? [...c.finishes, "signed"] : c.finishes,
        // Double face : chaque face a sa propre image (pas d'image_uris racine).
        ...(c.card_faces && !c.image_uris ? { dfc: true } : {}),
        // Produit Cardmarket : clé du price guide (src/lib/prices.ts)
        ...(c.cardmarket_id ? { cm: c.cardmarket_id } : {}),
      });
      count++;
    }
    url = page.has_more ? page.next_page! : null;
  }
  console.log(`${set.code.padEnd(6)} ${String(count).padStart(4)}  ${set.name}`);
}

const setsOut = sets.map((s) => ({
  code: s.code,
  name: s.name,
  type: s.set_type,
  parent: s.parent_set_code ?? null,
  releasedAt: s.released_at,
  icon: s.icon_svg_uri,
  count: cards.filter((c) => c.set === s.code).length,
}));

await writeFile(join(DATA_DIR, "sets.json"), JSON.stringify(setsOut, null, 2) + "\n");
// Une carte par ligne : diff lisible à chaque resynchronisation.
await writeFile(
  join(DATA_DIR, "cards.json"),
  "[\n" + cards.map((c) => JSON.stringify(c)).join(",\n") + "\n]\n",
);
console.log(`\n${sets.length} sets, ${cards.length} cartes`);
