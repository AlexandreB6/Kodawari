# apps/tcg

App **TCG** : collection de cartes Magic: The Gathering × Final Fantasy.
Voir le `CLAUDE.md` racine pour les règles communes au monorepo.

## Routes

| Route | Rôle |
|---|---|
| `/` | Catalogue complet : filtres extension / rareté / couleur / stock, ajout au survol |
| `/collection` | Même client, ouvert sur « Possédées », avec stats par set et par langue, valeur estimée et coût pour compléter |
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
  Les cartes d'un set « Art Series » reçoivent en plus la finition `signed`
  (signature d'artiste dorée), que Scryfall ne distingue pas.
- `src/data/catalog.ts` : types, tri, groupes d'extensions, langues,
  finitions, et `cardImage()`. Les URLs d'image sont déduites de l'id Scryfall.
- `src/lib/useCollection.ts` : état optimiste. Les PUT d'une même ligne
  sont chaînés, la dernière valeur gagne.
- `src/lib/prices.ts` (serveur) : price guide public Cardmarket (~26 Mo,
  régénéré chaque nuit), filtré sur nos cartes via `cm` (id produit Cardmarket,
  fourni par Scryfall) ; seul le résultat filtré est mis en cache (6 h).
- `src/lib/pricing.ts` : estimation = tendance (normale ou foil) × coefficient
  de langue ; une carte manquante compte en normale NM anglaise.
- `src/components/` : `CatalogClient`, `BinderPage` (page de classeur 4 × 3,
  deux pages côte à côte sur grand écran), `BinderBook` (classeur feuilletable
  de /collection : couverture, pages qui tournent en 3D, flèches et swipe), `MtgCard` (carte en pochette, CTA au survol, « + »
  permanent sur tactile), `CardDialog` (`<dialog>` natif), `Chip`
- `prisma/schema.prisma` : modèle `OwnedCard` uniquement, une ligne par
  carte × finition × langue, unique `(scryfallId, finish, lang, userId)`

## Points d'attention

- La base Neon s'appelle **`tcg`**.
- Prix : l'API Cardmarket n'accepte plus de nouveaux comptes, et le price guide
  n'a ni langue ni état. La langue passe par des coefficients réglables
  (`tcg:lang-coefficients` en localStorage, donc par appareil) ; l'état n'est
  pas suivi, tout est compté en Near Mint.
- Thème « menu FF » propre à l'app dans `globals.css` : tokens du mode sombre
  redéfinis (bleu nuit), accent `gold` (`bg-gold`…), utilitaire `ff-window`.
- Les images viennent de `cards.scryfall.io` en `<img>` simple : le CDN les
  sert déjà en cache 1 an. On n'utilise pas next/image.
- La langue et la finition d'ajout rapide sont retenues en `localStorage`
  (`tcg:quick-add`), comme le mode d'affichage de /collection
  (`tcg:collection-view`, pages ou classeur). Si la finition choisie n'existe pas pour une carte,
  on prend la première disponible.
