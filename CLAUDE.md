# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo

Quatre applications Next.js **indépendantes** (npm workspaces), une par domaine.
Chacune a sa base et son déploiement. Seuls les **comptes** sont communs : une
base `auth` partagée (voir « Comptes et invités »).

```
apps/film       apps/manga     apps/paint     apps/tcg
packages/auth   packages/core  packages/ui    packages/tsconfig
```

Chaque app a son `CLAUDE.md` — le lire avant de toucher à son code.

## Commands

```bash
npm install                    # racine uniquement

npm run dev:film               # :3000   (idem :manga :3001, :paint :3002, :tcg :3003)
npm run build:all              # build les 4
npm run typecheck              # tsc --noEmit sur les 4

npm run build -w film          # une seule app
```

Prisma se pilote **depuis le dossier de l'app** (`cd apps/<app>`) :

```bash
npx prisma migrate dev --name <name>
npx prisma generate
npx prisma studio
```

Le schéma de la base `auth` vit dans `packages/auth/prisma` :
`npx prisma migrate dev` depuis ce dossier, avec `AUTH_DATABASE_URL` /
`AUTH_DIRECT_URL` dans l'environnement. Le `build` de chaque app applique
aussi ses migrations (`npm run db:auth`).

⚠️ Le `build` lance `prisma migrate deploy` sur les URLs de `.env`, donc la
**prod**. En local, ne lancer un build qu'avec les URLs d'une branche Neon de
dev dans l'environnement. `.env.development.local`, prioritaire en `next dev`,
peut pointer vers cette branche.

Pas de lint ni de tests configurés.

## Règles structurantes

- **Client Prisma par app** (et pour `packages/auth`) : chaque `schema.prisma` déclare
  `output = "../src/generated/prisma"`, et l'app importe `@/generated/prisma`
  (jamais `@prisma/client`). Le chemin par défaut est hoisté à la racine en
  monorepo : les apps s'écraseraient mutuellement.
- **Packages en TS brut** : toute app qui consomme `@repo/*` doit les lister
  dans `transpilePackages` (`next.config.ts`).
- **Tailwind v4** : `packages/ui/src/theme.css` porte le thème et son propre
  `@source`. Le `globals.css` d'une app se contente de l'importer et de
  déclarer ses sources.
- **Dépendances de `packages/auth`** : `better-auth` y est installé, pas à la
  racine. Les apps passent donc par ses exports (`@repo/auth/handler`…) plutôt
  que d'importer `better-auth` directement.
- **Casse du chemin sous Windows** : le dépôt est dans `D:Projet`. Si
  `npm install` est lancé depuis `D:projet`, le lien `node_modules/@repo/*`
  d'un nouveau package prend la mauvaise casse et Turbopack ne le résout pas
  (« Module not found »). Il faut le recréer avec `mklink /J`.
- **Rien de transverse dans `packages/`** : le vocabulaire métier d'un domaine
  (démographies manga, gammes de peinture…) reste dans son app.

## packages/core

Logique sans UI, importée par les apps :

- `apiFetch.ts` — `fetch` pour les mutations côté client : toast d'erreur
  automatique, et création d'un invité puis nouvel essai sur une 401 `NO_SESSION`
- `utils.ts` — `cn`, `makeSlug`, `extractIdFromSlug`, helpers d'années

## packages/auth

Comptes, sessions et scoping par utilisateur (Better Auth + Prisma) :

- `server.ts` — instance `auth` : email/mot de passe, Google si
  `GOOGLE_CLIENT_*`, plugin `anonymous` (invités), rate limit en base,
  cookie partagé si `AUTH_COOKIE_DOMAIN`
- `handler.ts` — `GET`/`POST` réexportés par `api/auth/[...all]/route.ts`
- `scope.ts` — `createUserScope({ app, mergeGuestData })`, instancié dans
  `apps/<app>/src/lib/scope.ts` : `currentUser`, `currentUserId`,
  `currentAccount`, `ownerFilter` ; plus `noSessionResponse()`
- `guests.ts` — `createGuestCleanupRoute()` pour le cron
- `client.ts` — `authClient` (navigateur)

## packages/ui

- `theme.css` — tokens du thème (dark only)
- `AppShell.tsx` — coquille commune : header (sélecteur d'apps, compte),
  bandeau d'installation, `<main>`, BottomNav, toasts, enregistrement du
  service worker. Reçoit `user` (`currentAccount()` du layout). **Server component** :
  les icônes lui sont passées en `ReactNode`, jamais en composant.
- `AppSwitcher.tsx` — pastilles 🎬 📚 🎨 🃏 du header vers les autres apps.
  URLs via `NEXT_PUBLIC_APP_URL_FILM|MANGA|PAINT|TCG`, avec repli sur les URLs de prod
- `InstallPrompt.tsx` — bandeau « Installer l'app » : `beforeinstallprompt` sur
  Chromium, marche à suivre sur iOS, masqué en standalone ou 30 j après fermeture
- `AccountMenu.tsx` — Connexion, pastille « Invité », ou avatar + déconnexion
- `LoginForm.tsx` — connexion / inscription email, bouton Google
- `BottomNav.tsx`, `ConfirmDialog.tsx`, `PwaRegister.tsx`

## shadcn/ui v4 — différence critique

- Pas de prop `asChild`. Utiliser `render={<Component />}` pour la composition.
- Exemple : `<DialogTrigger render={<Button />}>Label</DialogTrigger>`

## Comptes et invités

Chaque ligne d'app porte un `userId` : un compte, ou un **invité** (utilisateur
anonyme Better Auth). Lectures comme écritures passent par le scope de l'app
(`ownerFilter()`, `currentUserId()`) : chacun ne voit que ses données. Un
visiteur sans session voit une collection vide.

- Pas de session à la première visite : la première mutation répond 401
  `NO_SESSION`, `apiFetch` crée l'invité puis rejoue la requête.
- À l'inscription ou à la connexion d'un invité, `onLinkAccount` écrit un
  `UserMerge` dans la base `auth`. Chaque app transfère ses lignes au
  prochain passage de l'utilisateur, via `mergeGuestData` : en cas de doublon,
  la ligne du compte l'emporte.
- `/api/cron/cleanup-guests` (`vercel.json`) applique les rattachements en
  attente et purge les invités inactifs depuis 30 jours. L'app film supprime
  ensuite ces invités de la base `auth`, à 35 jours.
- Index uniques composites avec `userId` : `Movie.(tmdbId)`, `Manga.(malId)`,
  `OwnedPaint.(paintId, range)`, `OwnedCard.(scryfallId, finish, lang)`.
- Sur `*.vercel.app`, une connexion par app : même compte, cookie séparé. Avec
  un domaine perso, `AUTH_COOKIE_DOMAIN` partage la session.

## PWA

`src/app/manifest.ts` + `public/icon-*.png` (`node scripts/generate-icons.mjs
[app]`) + `public/sw.js` (réseau d'abord sur les pages, repli `/offline` ;
cache d'abord sur `/_next/static`). Le service worker n'est enregistré qu'en
production.

## Locale

L'UI et les requêtes TMDB sont en français (`fr-FR`, région `FR`).
