/**
 * Fabriques de route handlers pour le write-gate owner.
 *
 * Les trois apps (film / manga / paint) exposent chacune un
 * `/api/auth/login` et un `/api/auth/logout` strictement identiques : elles se
 * contentent de réexporter les handlers produits ici.
 *
 *   // apps/<app>/src/app/api/auth/login/route.ts
 *   export const POST = createLoginRoute();
 */

import { NextRequest, NextResponse } from "next/server";
import { isDemoMode } from "./demo";
import { clearOwnerCookie, setOwnerCookie, verifyOwnerPassword } from "./owner";

/** POST /api/auth/login — vérifie le mot de passe et pose `owner_session`. */
export function createLoginRoute() {
  return async function POST(req: NextRequest) {
    if (isDemoMode()) {
      return NextResponse.json({ error: "Disabled in demo mode" }, { status: 404 });
    }
    if (!process.env.OWNER_PASSWORD) {
      return NextResponse.json({ error: "Owner gate not configured" }, { status: 404 });
    }

    let body: { password?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const password = typeof body.password === "string" ? body.password : "";
    if (!verifyOwnerPassword(password)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    await setOwnerCookie();
    return NextResponse.json({ ok: true });
  };
}

/** POST /api/auth/logout — efface le cookie puis renvoie sur la home. */
export function createLogoutRoute() {
  return async function POST(req: NextRequest) {
    await clearOwnerCookie();
    return NextResponse.redirect(new URL("/", req.url), { status: 303 });
  };
}
