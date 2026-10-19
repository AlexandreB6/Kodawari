-- CreateTable
CREATE TABLE "OwnedCard" (
    "id" SERIAL NOT NULL,
    "scryfallId" TEXT NOT NULL,
    "finish" TEXT NOT NULL DEFAULT 'nonfoil',
    "lang" TEXT NOT NULL DEFAULT 'en',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OwnedCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OwnedCard_userId_idx" ON "OwnedCard"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OwnedCard_scryfallId_finish_lang_userId_key" ON "OwnedCard"("scryfallId", "finish", "lang", "userId");

