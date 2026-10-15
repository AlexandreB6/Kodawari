/**
 * Seed de la base de démo de l'app Peinture.
 *
 * Crée la base commune visible par tous les visiteurs de la démo
 * (demoSessionId = NULL). Idempotent : deleteMany sur les lignes NULL puis
 * createMany, donc rejouable. Ne touche jamais une ligne au demoSessionId
 * non nul (sandbox d'un visiteur).
 *
 * À lancer uniquement contre la base de DÉMO :
 *   DATABASE_URL=<url-demo> npx tsx prisma/seed.ts
 */

import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Peinture demo baseline…");

  // Efface les lignes de seed (demoSessionId NULL), garde les sandboxes.
  await prisma.ownedPaint.deleteMany({ where: { demoSessionId: null } });

  await prisma.ownedPaint.createMany({
    data: [
      { paintId: "abaddon-black", range: "citadel", quantity: 2 },
      { paintId: "mephiston-red", range: "citadel", quantity: 1 },
      { paintId: "caliban-green", range: "citadel", quantity: 1 },
      { paintId: "macragge-blue", range: "citadel", quantity: 1 },
      { paintId: "leadbelcher", range: "citadel", quantity: 1 },
      { paintId: "retributor-armour", range: "citadel", quantity: 1 },
      { paintId: "nuln-oil", range: "citadel", quantity: 3 },
      { paintId: "agrax-earthshade", range: "citadel", quantity: 2 },
    ],
  });


  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
