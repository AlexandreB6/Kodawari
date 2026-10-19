# apps/tcg

App **TCG** : collection de cartes Magic: The Gathering × Final Fantasy.
Voir le `CLAUDE.md` racine pour les règles communes au monorepo.

## Routes

| Route | Rôle |
|---|---|
| `/` | Catalogue complet : filtres extension / rareté / couleur / stock, ajout au survol |
| `/collection` | Même client, ouvert sur « Possédées », avec stats par set et par langue |
| `/login`, `/offline` | Connexion / inscription, page hors ligne |

## API

- `/api/cards` : `GET` liste, `PUT {scryfallId, finish, lang, quantity}`
  fixe la quantité d'une ligne (0 = suppression)

## Fichiers

- `src/data/` : **catalogue statique**, pas en base. `cards.json` et
  `sets.json` sont **générés** par `npm run sync-cards -w tcg`
  (`scripts/sync-cards.mts`, API Scryfall). Il ne faut pas les éditer à la main.
  Le script garde `fin`, `fic`, `fca` et leurs sous-sets (jetons, promos,
  art series…). On le relance quand une extension FF sort.
- `src/data/catalog.ts` : types, tri, groupes d'extensions, langues,
  finitions, et `cardImage()`. Les URLs d'image sont déduites de l'id Scryfall.
- `src/lib/useCollection.ts` : état optimiste. Les PUT d'une même ligne
  sont chaînés, la dernière valeur gagne.
- `src/components/` : `CatalogClient`, `MtgCard` (CTA au survol, « + »
  permanent sur tactile), `CardDialog` (`<dialog>` natif), `Chip`
- `prisma/schema.prisma` : modèle `OwnedCard` uniquement, une ligne par
  carte × finition × langue, unique `(scryfallId, finish, lang, userId)`

## Points d'attention

- La base Neon s'appelle **`tcg`**.
- Les images viennent de `cards.scryfall.io` en `<img>` simple : le CDN les
  sert déjà en cache 1 an. On n'utilise pas next/image.
- La langue et la finition d'ajout rapide sont retenues en `localStorage`
  (`tcg:quick-add`). Si la finition choisie n'existe pas pour une carte,
  on prend la première disponible.
