# Kodawari

Monorepo de trois applications indépendantes pour gérer mes collections personnelles.
Chacune est une **PWA installable** sur téléphone, déployée séparément.

| App | Dossier | Contenu | Port dev |
|---|---|---|---|
| 🎬 **Cinéma** | [`apps/film`](apps/film) | Films vus, notes 0.5–5 ★, découverte du catalogue TMDB | 3000 |
| 📚 **Manga** | [`apps/manga`](apps/manga) | Collection MyAnimeList, suivi des volumes, scan ISBN | 3001 |
| 🎨 **Peinture** | [`apps/paint`](apps/paint) | Inventaire multi-gammes (Citadel, Monument Hobbies) | 3002 |

## Pourquoi trois apps

Le projet était à l'origine une seule application avec trois espaces et un dashboard
commun. Les trois domaines n'ont aucune donnée en commun : les séparer donne trois
icônes distinctes sur l'écran d'accueil du téléphone, trois cycles de déploiement et
trois bases indépendantes. Le code réellement transverse (thème, write-gate,
mode démo, coquille d'UI) vit dans `packages/`.

## Structure

```
apps/
  film/ manga/ paint/          3 apps Next.js 16, une base Neon chacune
packages/
  core/                        demo mode, write-gate owner, apiFetch, utils
  ui/                          thème Tailwind, AppShell, BottomNav, dialogs
  tsconfig/                    tsconfig de base
scripts/
  generate-icons.mjs           icônes PWA des 3 apps
```

Les packages sont consommés en TypeScript brut : chaque app les déclare dans
`transpilePackages` (voir `apps/*/next.config.ts`).

## Développement

```bash
npm install                    # une seule fois, à la racine

npm run dev:film               # http://localhost:3000
npm run dev:manga              # http://localhost:3001
npm run dev:paint              # http://localhost:3002

npm run build:all              # build les 3
npm run typecheck              # tsc --noEmit sur les 3
```

Chaque app a son propre `.env.local` — partir de son `.env.local.example`.

```bash
cp apps/film/.env.local.example apps/film/.env.local
```

Prisma se pilote depuis le dossier de l'app :

```bash
cd apps/film
npx prisma migrate dev --name <nom>
npx prisma studio
```

> ⚠️ Le client Prisma est généré dans `apps/<app>/src/generated/prisma`, pas dans
> `node_modules/.prisma`. En monorepo ce dernier est hoisté à la racine et les trois
> apps s'écraseraient mutuellement.

## Stack

- **Next.js 16** (App Router, Server Components, TypeScript)
- **Tailwind CSS v4** + **shadcn/ui v4** (primitives `@base-ui/react`)
- **Prisma 5** + **PostgreSQL** (Neon — une base par app)
- **TMDB** (films), **Jikan / MyAnimeList** (mangas), **Google Books** (lookup ISBN)
- **Quagga2** pour le scan de code-barres dans le navigateur
- **sonner** pour les toasts d'erreur
- Déployé sur **Vercel** — un projet par app, `Root Directory` = `apps/<app>`

## PWA

Chaque app fournit un `manifest.webmanifest` (via `src/app/manifest.ts`), ses icônes
(`public/icon-*.png`, générées par `node scripts/generate-icons.mjs`) et un service
worker minimal (`public/sw.js`) : réseau d'abord sur les pages avec repli sur
`/offline`, cache d'abord sur `/_next/static`. Le service worker n'est enregistré
qu'en production (`packages/ui/src/PwaRegister.tsx`).

## Mode démo

Chaque app peut tourner en deux exemplaires : le déploiement privé (`DEMO_MODE=false`)
et un déploiement portfolio public (`DEMO_MODE=true`). En mode démo chaque visiteur
reçoit un sandbox isolé via un cookie `demo_session` posé par `src/proxy.ts` ; les
lectures voient le seed partagé (`demoSessionId IS NULL`) plus ses propres lignes, les
écritures sont estampillées, et un cron Vercel quotidien purge les sandboxes de plus
de 24 h. Toute la logique est dans `packages/core/src/demo.ts`.

## Write-gate propriétaire

En mode privé, si `OWNER_PASSWORD` est défini, les routes API mutantes exigent un
cookie `owner_session` obtenu sur `/login`. Sans session, les lectures restent
publiques et les écritures renvoient 401. Stateless : le cookie contient
`sha256(OWNER_PASSWORD)`, changer le mot de passe invalide toutes les sessions.
Voir `packages/core/src/owner.ts`.
