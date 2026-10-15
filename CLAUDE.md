# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo

Trois applications Next.js **indépendantes** (npm workspaces), une par domaine.
Elles ne partagent aucune donnée : ni base, ni déploiement, ni navigation.

```
apps/film       apps/manga     apps/paint
packages/core   packages/ui    packages/tsconfig
```

Chaque app a son `CLAUDE.md` — le lire avant de toucher à son code.

## Commands

```bash
npm install                    # racine uniquement

npm run dev:film               # :3000   (idem :manga :3001, :paint :3002)
npm run build:all              # build les 3
npm run typecheck              # tsc --noEmit sur les 3

npm run build -w film          # une seule app
```

Prisma se pilote **depuis le dossier de l'app** (`cd apps/<app>`) :

```bash
npx prisma migrate dev --name <name>
npx prisma generate
npx prisma studio
```

Pas de lint ni de tests configurés.

## Règles structurantes

- **Client Prisma par app** : chaque `schema.prisma` déclare
  `output = "../src/generated/prisma"`, et l'app importe `@/generated/prisma`
  (jamais `@prisma/client`). Le chemin par défaut est hoisté à la racine en
  monorepo : les trois apps s'écraseraient mutuellement.
- **Packages en TS brut** : toute app qui consomme `@repo/*` doit les lister
  dans `transpilePackages` (`next.config.ts`).
- **Tailwind v4** : `packages/ui/src/theme.css` porte le thème et son propre
  `@source`. Le `globals.css` d'une app se contente de l'importer et de
  déclarer ses sources.
- **`export const config` du proxy** doit rester un littéral dans
  `apps/<app>/src/proxy.ts` : Next l'analyse à la compilation et refuse une
  valeur importée.
- **Rien de transverse dans `packages/`** : le vocabulaire métier d'un domaine
  (démographies manga, gammes de peinture…) reste dans son app.

## packages/core

Logique sans UI, importée par les 3 apps :

- `demo.ts` — mode démo : `isDemoMode`, `demoFilter` (scope les reads),
  `demoWriteData` (estampille les writes), `assertDemoOwnership`, `dedupBySid`
- `owner.ts` — write-gate propriétaire, dont `ownerGateResponse()` appelé en
  tête de chaque handler mutant
- `authRoutes.ts` — `createLoginRoute()` / `createLogoutRoute()`
- `proxy.ts` — `createDemoProxy()`
- `apiFetch.ts` — `fetch` + toast d'erreur automatique (mutations côté client)
- `clientDemo.ts` — `IS_DEMO`, `isSharedItem` (côté client)
- `utils.ts` — `cn`, `makeSlug`, `extractIdFromSlug`, helpers d'années

## packages/ui

- `theme.css` — tokens du thème (dark only)
- `AppShell.tsx` — coquille commune : bandeau démo, header, `<main>`,
  BottomNav, toasts, enregistrement du service worker. **Server component** :
  les icônes lui sont passées en `ReactNode`, jamais en composant.
- `AppSwitcher.tsx` — pastilles 🎬 📚 🎨 du header vers les 2 autres apps.
  URLs via `NEXT_PUBLIC_APP_URL_FILM|MANGA|PAINT`, avec repli sur les URLs de prod
- `InstallPrompt.tsx` — bandeau « Installer l'app » : `beforeinstallprompt` sur
  Chromium, marche à suivre sur iOS, masqué en standalone ou 30 j après fermeture
- `BottomNav.tsx`, `ConfirmDialog.tsx`, `DemoBanner.tsx`, `LoginForm.tsx`,
  `PwaRegister.tsx`

## shadcn/ui v4 — différence critique

- Pas de prop `asChild`. Utiliser `render={<Component />}` pour la composition.
- Exemple : `<DialogTrigger render={<Button />}>Label</DialogTrigger>`

## Mode démo

Deux déploiements Vercel possibles par app : privé (`DEMO_MODE=false`) et
portfolio public (`DEMO_MODE=true`). En démo, `src/proxy.ts` pose un cookie
`demo_session`, les reads sont scopés à `demoSessionId IS NULL` (seed partagé)
+ la session du visiteur, les writes sont estampillés, et
`/api/cron/cleanup-demo` (cron dans `vercel.json`) purge les sandboxes de plus
de 24 h. `/api/demo/reset` vide la sandbox du visiteur.

Les index uniques (`Movie.tmdbId`, `Manga.malId`, `OwnedPaint.(paintId, range)`)
sont **composites avec `demoSessionId`**, pour que deux visiteurs puissent
ajouter la même entrée. En mode privé, la couche applicative filtre toujours
sur `demoSessionId: null`.

Seed de démo : `apps/<app>/prisma/seed.ts`, à lancer avec
`DATABASE_URL=<url-demo> npx tsx prisma/seed.ts`.

## Write-gate propriétaire

En mode privé, si `OWNER_PASSWORD` est défini, les `POST`/`PUT`/`DELETE` exigent
un cookie `owner_session` (`sha256(OWNER_PASSWORD)`, httpOnly) obtenu sur
`/login`. Les lectures restent publiques. Sans sessions en base : changer le mot
de passe invalide tous les cookies. Ignoré en mode démo et quand la variable est
absente (dev local).

## PWA

`src/app/manifest.ts` + `public/icon-*.png` (`node scripts/generate-icons.mjs
[app]`) + `public/sw.js` (réseau d'abord sur les pages, repli `/offline` ;
cache d'abord sur `/_next/static`). Le service worker n'est enregistré qu'en
production.

## Locale

L'UI et les requêtes TMDB sont en français (`fr-FR`, région `FR`).
