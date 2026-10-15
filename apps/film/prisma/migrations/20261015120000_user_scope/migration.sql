-- Mode démo -> comptes : chaque ligne appartient à un utilisateur de la base auth.
-- Les lignes existantes (toutes à demoSessionId NULL en prod) gardent userId NULL
-- jusqu'à leur rattachement au compte du propriétaire, puis userId deviendra NOT NULL.

-- Sandboxes démo éventuelles : sans propriétaire, elles disparaissent.
DELETE FROM "Movie" WHERE "demoSessionId" IS NOT NULL;

-- DropIndex
DROP INDEX "Movie_demoSessionId_idx";

-- DropIndex
DROP INDEX "Movie_tmdbId_demoSessionId_key";

-- AlterTable
ALTER TABLE "Movie" DROP COLUMN "demoSessionId",
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "Movie_userId_idx" ON "Movie"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Movie_tmdbId_userId_key" ON "Movie"("tmdbId", "userId");

