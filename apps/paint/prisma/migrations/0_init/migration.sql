-- CreateTable
CREATE TABLE "OwnedPaint" (
    "id" SERIAL NOT NULL,
    "paintId" TEXT NOT NULL,
    "range" TEXT NOT NULL DEFAULT 'citadel',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "demoSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OwnedPaint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OwnedPaint_demoSessionId_idx" ON "OwnedPaint"("demoSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "OwnedPaint_paintId_range_demoSessionId_key" ON "OwnedPaint"("paintId", "range", "demoSessionId");

