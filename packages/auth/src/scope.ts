/**
 * Scoping des données par utilisateur, côté serveur.
 *
 * Chaque ligne d'app porte un `userId` (compte ou invité). Une app crée son
 * scope une fois, dans `src/lib/scope.ts` :
 *
 *   export const { currentUser, currentUserId, ownerFilter } = createUserScope({
 *     app: "film",
 *     mergeGuestData: async (fromId, toId) => { … },
 *   });
 *
 * `mergeGuestData` transfère les lignes d'un invité vers son nouveau compte.
 * Seule l'app connaît ses contraintes d'unicité, d'où le callback.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth, type SessionUser } from "./server";
import { authDb } from "./prisma";

export type AppId = "film" | "manga" | "paint" | "tcg";

/** Ne correspond à aucune ligne : un visiteur sans session voit une liste vide. */
const NO_USER = "__no-user__";

export interface UserScopeOptions {
  app: AppId;
  /** Transfère les lignes de `fromId` (invité) vers `toId`, sans violer les uniques. */
  mergeGuestData: (fromId: string, toId: string) => Promise<void>;
}

export function createUserScope({ app, mergeGuestData }: UserScopeOptions) {
  /** Applique les rattachements invité → compte pas encore faits dans cette app. */
  async function applyPendingMerges(where: { newId?: string } = {}): Promise<number> {
    const pending = await authDb.userMerge.findMany({
      where: { ...where, NOT: { mergedApps: { has: app } } },
    });
    for (const merge of pending) {
      await mergeGuestData(merge.anonId, merge.newId);
      await authDb.userMerge.update({
        where: { id: merge.id },
        data: { mergedApps: { push: app } },
      });
    }
    return pending.length;
  }

  /** Utilisateur de la requête (invité compris), ou null sans session. */
  async function currentUser(): Promise<SessionUser | null> {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return null;
    // Un invité n'a jamais de rattachement en attente : inutile de requêter.
    if (!session.user.isAnonymous) await applyPendingMerges({ newId: session.user.id });
    return session.user;
  }

  async function currentUserId(): Promise<string | null> {
    return (await currentUser())?.id ?? null;
  }

  /** Identité affichée dans le header (sérialisable vers le client). */
  async function currentAccount() {
    const user = await currentUser();
    if (!user) return null;
    return {
      name: user.name,
      email: user.email,
      image: user.image ?? null,
      isAnonymous: !!user.isAnonymous,
    };
  }

  /** Clause `where` Prisma : les lignes de l'utilisateur courant uniquement. */
  async function ownerFilter(): Promise<{ userId: string }> {
    return { userId: (await currentUserId()) ?? NO_USER };
  }

  return { currentUser, currentUserId, currentAccount, ownerFilter, applyPendingMerges };
}

/**
 * 401 renvoyée par les routes mutantes sans session. `apiFetch` reconnaît le
 * code `NO_SESSION`, crée un invité puis rejoue la requête.
 */
export function noSessionResponse(): NextResponse {
  return NextResponse.json(
    { error: "Session requise.", code: "NO_SESSION" },
    { status: 401 },
  );
}
