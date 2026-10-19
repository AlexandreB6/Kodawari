# Kodawari

> **こだわり** (*kodawari*) : le souci du détail, l'exigence qu'on met dans ce qui
> nous tient à cœur. C'est l'état d'esprit du passionné qui veut savoir quel film
> il a vu, quel tome lui manque et quel pot de peinture est presque vide.

Kodawari rassemble mes carnets de passionné : un endroit à moi pour noter, suivre
et retrouver ce que je collectionne. Chaque passion a son app, pensée pour son
usage, et de nouvelles pourront s'ajouter au fil des envies.

Monorepo de trois applications indépendantes. Chacune est une **PWA installable**
sur téléphone, déployée séparément.

| App | Dossier | Contenu | En ligne | Port dev |
|---|---|---|---|---|
| 🎬 **Cinéma** | [`apps/film`](apps/film) | Films vus, notes 0.5–5 ★, découverte du catalogue TMDB | [kodawari-film](https://kodawari-film.vercel.app) | 3000 |
| 📚 **Manga** | [`apps/manga`](apps/manga) | Collection MyAnimeList, suivi des volumes, scan ISBN | [kodawari-manga](https://kodawari-manga.vercel.app) | 3001 |
| 🎨 **Peinture** | [`apps/paint`](apps/paint) | Inventaire multi-gammes (Citadel, Monument Hobbies) | [kodawari-paint](https://kodawari-paint.vercel.app) | 3002 |

## Pourquoi trois apps

Le projet était à l'origine une seule application avec trois espaces et un dashboard
commun. Les trois domaines n'ont aucune donnée métier en commun : les séparer donne trois
icônes distinctes sur l'écran d'accueil du téléphone, trois cycles de déploiement et
trois bases indépendantes. Seuls les comptes sont partagés, dans une base `auth`.
Le code réellement transverse (comptes, thème, coquille d'UI) vit dans `packages/`.

## Structure

```
apps/
  film/ manga/ paint/          3 apps Next.js 16, une base Neon chacune
packages/
  auth/                        comptes Better Auth, invités, scoping par utilisateur
  core/                        apiFetch, utils
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

## Comptes et invités

Un compte (email + mot de passe, ou Google) vaut pour les 3 apps : une seule base
`auth`, gérée par [Better Auth](https://www.better-auth.com) dans `packages/auth`.
Chaque collection est privée.

Pas besoin de compte pour essayer : au premier ajout, le visiteur devient
**invité**. Sa collection d'essai est liée à un cookie et il ne voit qu'elle. S'il
crée un compte ou se connecte ensuite, tout ce qu'il a ajouté est rattaché à son
compte, dans chacune des apps. Un cron quotidien purge les invités inactifs depuis
30 jours.

Sur `*.vercel.app`, il faut se connecter une fois par app : les navigateurs
interdisent de partager un cookie entre deux sous-domaines `vercel.app`. Avec un
domaine perso (`film.kodawari.fr`…), `AUTH_COOKIE_DOMAIN=.kodawari.fr` partage
la session entre les 3 apps.
