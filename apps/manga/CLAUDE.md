# apps/manga

App **Manga** — collection MyAnimeList et suivi des volumes possédés.
Voir le `CLAUDE.md` racine pour les règles communes au monorepo.

## Routes

| Route | Rôle |
|---|---|
| `/` | Home — collection, recherche Jikan, ajout manuel ou par scan ISBN |
| `/manga/[slug]` | Détail d'une série + grille des volumes. Slug `titre-slug-{malId}` — `extractMalIdFromSlug()` de `src/lib/jikan.ts`. |
| `/login`, `/offline` | Connexion / inscription, page hors ligne |

## API

- `/api/manga` — CRUD de la collection
- `/api/manga/search` — proxy de recherche Jikan
- `/api/manga/isbn` — lookup ISBN : Google Books → recherche Jikan

## Fichiers

- `src/lib/jikan.ts` — helpers et types Jikan (api.jikan.moe/v4, sans auth)
- `src/lib/anilist.ts` — complément AniList (GraphQL) pour certaines métadonnées
- `src/lib/constants.ts` — `DEMOGRAPHIC_OPTIONS`
- `src/components/` — `MangaClient`, `MangaCard`, `MangaDetailClient`,
  `AddMangaDialog`, `ScanMangaDialog`, `MangaSearchResults`, `VolumeGrid`
- `prisma/schema.prisma` — modèle `Manga` uniquement

## Points d'attention

- Les volumes possédés sont stockés en **JSON dans `ownedVolumesMap`**
  (ex. `"[1,2,3,5]"`), pas en table dédiée.
- Le scan de code-barres (Quagga2) demande `getUserMedia`, donc **HTTPS** —
  à retester après chaque changement touchant `ScanMangaDialog`, en particulier
  en mode PWA standalone sur iOS.
