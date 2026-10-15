-- Mode démo -> comptes : chaque ligne appartient à un utilisateur de la base auth.
-- Les lignes existantes (toutes à demoSessionId NULL en prod) gardent userId NULL
-- jusqu'à leur rattachement au compte du propriétaire, puis userId deviendra NOT NULL.

-- Sandboxes démo éventuelles : sans propriétaire, elles disparaissent.
DELETE FROM "Manga" WHERE "demoSessionId" IS NOT NULL;

-- DropIndex
DROP INDEX "Manga_demoSessionId_idx";

-- DropIndex
DROP INDEX "Manga_malId_demoSessionId_key";

-- AlterTable
ALTER TABLE "Manga" DROP COLUMN "demoSessionId",
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "Manga_userId_idx" ON "Manga"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Manga_malId_userId_key" ON "Manga"("malId", "userId");

