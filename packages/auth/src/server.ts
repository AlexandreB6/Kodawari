/**
 * Instance Better Auth partagée par les 3 apps.
 *
 * Chaque app la monte sur `src/app/api/auth/[...all]/route.ts` et pointe sur
 * la même base `auth` : un compte vaut pour toutes les apps.
 *
 * Cookie de session : par défaut propre à chaque app (une connexion par
 * app, *.vercel.app ne pouvant pas partager de cookie). Avec un domaine perso,
 * `AUTH_COOKIE_DOMAIN=.kodawari.fr` le partage entre sous-domaines : une
 * connexion vaut alors pour les 3.
 */

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { anonymous } from "better-auth/plugins";
import { authDb } from "./prisma";

const cookieDomain = process.env.AUTH_COOKIE_DOMAIN;

/** Origines des 3 apps, autorisées à appeler l'API d'auth (CSRF). */
const trustedOrigins = [
  process.env.BETTER_AUTH_URL,
  process.env.NEXT_PUBLIC_APP_URL_FILM,
  process.env.NEXT_PUBLIC_APP_URL_MANGA,
  process.env.NEXT_PUBLIC_APP_URL_PAINT,
].filter((o): o is string => !!o);

/** Google n'est proposé que si ses identifiants OAuth sont configurés. */
export const isGoogleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
  database: prismaAdapter(authDb, { provider: "postgresql" }),
  trustedOrigins,

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Pas d'envoi d'email en v1 : ni vérification, ni mot de passe oublié.
    requireEmailVerification: false,
  },

  socialProviders: isGoogleEnabled
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : {},

  session: {
    expiresIn: 60 * 60 * 24 * 90, // 90 j, renouvelée à l'usage
    // Évite une requête en base à chaque lecture de session.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  // En base : la mémoire d'une fonction serverless ne survit pas aux requêtes.
  rateLimit: { enabled: true, storage: "database" },

  advanced: cookieDomain
    ? { crossSubDomainCookies: { enabled: true, domain: cookieDomain } }
    : {},

  plugins: [
    anonymous({
      emailDomainName: "invite.kodawari.local",
      // L'invité devient un vrai compte : chaque app transférera ses lignes
      // au prochain passage de l'utilisateur (voir scope.ts).
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        await authDb.userMerge.upsert({
          where: { anonId_newId: { anonId: anonymousUser.user.id, newId: newUser.user.id } },
          create: { anonId: anonymousUser.user.id, newId: newUser.user.id },
          update: {},
        });
      },
    }),
    nextCookies(), // doit rester le dernier plugin
  ],
});

export type SessionUser = typeof auth.$Infer.Session.user;
