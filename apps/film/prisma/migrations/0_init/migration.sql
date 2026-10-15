-- CreateTable
CREATE TABLE "Movie" (
    "id" SERIAL NOT NULL,
    "tmdbId" INTEGER,
    "title" TEXT NOT NULL,
    "posterPath" TEXT,
    "overview" TEXT,
    "director" TEXT,
    "releaseYear" INTEGER,
    "watchedAt" TIMESTAMP(3),
    "watchedPrecision" TEXT NOT NULL DEFAULT 'day',
    "rating" DOUBLE PRECISION,
    "owned" BOOLEAN NOT NULL DEFAULT false,
    "ownedFormat" TEXT,
    "demoSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Movie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Movie_demoSessionId_idx" ON "Movie"("demoSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Movie_tmdbId_demoSessionId_key" ON "Movie"("tmdbId", "demoSessionId");

