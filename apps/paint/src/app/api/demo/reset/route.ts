/**
 * Route API : /api/demo/reset
 * Purge la sandbox démo du visiteur courant (peintures uniquement — chaque app
 * gère la sienne) et efface son cookie, forçant la création d'une nouvelle
 * session au prochain hit.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { isDemoMode } from "@repo/core/demo";

const COOKIE_NAME = "demo_session";

export async function POST() {
  if (!isDemoMode()) {
    return NextResponse.json({ error: "Not in demo mode" }, { status: 404 });
  }

  const jar = await cookies();
  const sid = jar.get(COOKIE_NAME)?.value;
  if (!sid) return NextResponse.json({ ok: true, cleared: 0 });

  const paints = await prisma.ownedPaint.deleteMany({ where: { demoSessionId: sid } });

  jar.delete(COOKIE_NAME);

  return NextResponse.json({ ok: true, cleared: paints.count });
}
