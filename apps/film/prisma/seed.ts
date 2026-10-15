/**
 * Seed de la base de démo de l'app Cinéma.
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
  console.log("Seeding Cinéma demo baseline…");

  // Efface les lignes de seed (demoSessionId NULL), garde les sandboxes.
  await prisma.movie.deleteMany({ where: { demoSessionId: null } });

  await prisma.movie.createMany({
    data: [
      // posterPath left null: TMDB poster paths change and the fallback in
      // MovieCard is neutral. The detail page re-fetches the real poster from
      // TMDB on click regardless of what's stored here.
      {
        tmdbId: 27205,
        title: "Inception",
        posterPath: null,
        overview: null,
        director: "Christopher Nolan",
        releaseYear: 2010,
        rating: 4.5,
        watchedAt: new Date("2023-06-15"),
        watchedPrecision: "day",
      },
      {
        tmdbId: 496243,
        title: "Parasite",
        posterPath: null,
        overview: null,
        director: "Bong Joon-ho",
        releaseYear: 2019,
        rating: 5,
        watchedAt: new Date("2022-11-02"),
        watchedPrecision: "day",
      },
      {
        tmdbId: 129,
        title: "Le Voyage de Chihiro",
        posterPath: null,
        overview: null,
        director: "Hayao Miyazaki",
        releaseYear: 2001,
        rating: 5,
        watchedAt: new Date("2020-01-01"),
        watchedPrecision: "year",
      },
      {
        tmdbId: 155,
        title: "The Dark Knight",
        posterPath: null,
        overview: null,
        director: "Christopher Nolan",
        releaseYear: 2008,
        rating: 4.5,
        watchedAt: new Date("2021-08-20"),
        watchedPrecision: "day",
      },
      {
        tmdbId: 438631,
        title: "Dune",
        posterPath: null,
        overview: null,
        director: "Denis Villeneuve",
        releaseYear: 2021,
        rating: 4,
        watchedAt: new Date("2021-10-12"),
        watchedPrecision: "day",
      },
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
