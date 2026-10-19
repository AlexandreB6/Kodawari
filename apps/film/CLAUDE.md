# apps/film

App **Cinéma** — collection de films vus + exploration du catalogue TMDB.
Voir le `CLAUDE.md` racine pour les règles communes au monorepo.

## Routes

| Route | Rôle |
|---|---|
| `/` | Home — deux onglets, « Explorer » (discover TMDB) et « Films vus ». L'onglet actif est synchronisé avec `?tab=collection`. |
| `/movie/[slug]` | Détail d'un film. Slug `titre-slug-{tmdbId}` — `slugify()` / `extractIdFromSlug()` de `src/lib/tmdb.ts`. |
| `/login` | Connexion / inscription (Better Auth) |
| `/offline` | Servie par le service worker hors ligne |

## API

- `GET /api/discover` — proxy TMDB discover/search enrichi des crédits
  (filtres : query, year, genres, runtime, rating, certification, sort).
  Sert la pagination côté client.
- `/api/movies` — CRUD de la collection : `POST` (upsert), `PUT`
  (note / possédé / date), `DELETE`.

## Fichiers

- `src/lib/tmdb.ts` — `discoverMovies()`, `searchMovies()`,
  `getMovieWithCredits()`, `getMovieReviews()`, `getGenreList()`,
  `getDirector()`, `getTopCast()`, `getTrailer()`, `formatRuntime()`
- `src/components/` — `CinemaClient.tsx` (le gros de l'état), `MovieCard`,
  `MovieGrid`, `MarkWatchedDialog`, `WatchedToggle`, `BackToCinema`
- `prisma/schema.prisma` — modèle `Movie` uniquement

## Env

`TMDB_API_KEY` en plus des variables communes — voir `.env.local.example`.
