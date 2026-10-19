-- Mode démo -> comptes : chaque ligne appartient à un utilisateur de la base auth.
-- Les lignes existantes (toutes à demoSessionId NULL en prod) gardent userId NULL
-- jusqu'à leur rattachement au compte du propriétaire, puis userId deviendra NOT NULL.

-- Sandboxes démo éventuelles : sans propriétaire, elles disparaissent.
DELETE FROM "OwnedPaint" WHERE "demoSessionId" IS NOT NULL;

-- DropIndex
DROP INDEX "OwnedPaint_demoSessionId_idx";

-- DropIndex
DROP INDEX "OwnedPaint_paintId_range_demoSessionId_key";

-- AlterTable
ALTER TABLE "OwnedPaint" DROP COLUMN "demoSessionId",
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "OwnedPaint_userId_idx" ON "OwnedPaint"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OwnedPaint_paintId_range_userId_key" ON "OwnedPaint"("paintId", "range", "userId");

