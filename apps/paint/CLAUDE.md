# apps/paint

App **Peinture** — inventaire de peintures pour figurines.
Voir le `CLAUDE.md` racine pour les règles communes au monorepo.

## Routes

| Route | Rôle |
|---|---|
| `/` | Home — liste des gammes avec compteurs de possession |
| `/peinture/[range]` | Catalogue d'une gamme, filtres type / couleur / métallique / stock |
| `/login`, `/offline` | Connexion / inscription, page hors ligne |

## API

- `/api/paints` — CRUD des peintures possédées

## Fichiers

- `src/data/` — **catalogue statique**, pas en base : `citadel-paints.ts`,
  `monument-hobbies-paints.ts`, `paint-ranges.ts`, `paint-types.ts`.
  `RANGE_MAP` (dans `paint-ranges.ts`) associe un slug de gamme à sa config.
- `src/components/` — `PeintureClient`, `PaintCard`
- `prisma/schema.prisma` — modèle `OwnedPaint` uniquement, contrainte unique
  `(paintId, range, userId)`

## Point d'attention

La base ne stocke que la **possession**. Ajouter une gamme = ajouter un fichier
dans `src/data/` et l'enregistrer dans `paint-ranges.ts` ; aucune migration.
Les onglets de la BottomNav sont dérivés de `PAINT_RANGES` dans
`src/app/layout.tsx`.
