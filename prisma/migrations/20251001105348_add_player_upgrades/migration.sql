-- CreateTable
CREATE TABLE "public"."PlayerUpgrades" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "clickPower" INTEGER NOT NULL DEFAULT 1,
    "autoMiners" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerUpgrades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RefiningJob" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "inputQuantity" BIGINT NOT NULL,
    "inputPurity" DOUBLE PRECISION NOT NULL,
    "inputTier" INTEGER NOT NULL,
    "cycleNumber" INTEGER NOT NULL,
    "facilityType" TEXT NOT NULL,
    "facilityEfficiency" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "outputQuantity" BIGINT,
    "outputPurity" DOUBLE PRECISION,
    "outputTier" INTEGER,
    "wasteQuantity" BIGINT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefiningJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ManufacturingJob" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "blueprintId" TEXT NOT NULL,
    "materials" JSONB NOT NULL,
    "facilityType" TEXT NOT NULL,
    "facilityQualityBonus" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "outputType" TEXT NOT NULL,
    "outputId" TEXT,
    "outputQuality" DOUBLE PRECISION,
    "statBonuses" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "estimatedTime" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManufacturingJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerUpgrades_playerId_key" ON "public"."PlayerUpgrades"("playerId");

-- CreateIndex
CREATE INDEX "RefiningJob_playerId_idx" ON "public"."RefiningJob"("playerId");

-- CreateIndex
CREATE INDEX "RefiningJob_status_idx" ON "public"."RefiningJob"("status");

-- CreateIndex
CREATE INDEX "ManufacturingJob_playerId_idx" ON "public"."ManufacturingJob"("playerId");

-- CreateIndex
CREATE INDEX "ManufacturingJob_status_idx" ON "public"."ManufacturingJob"("status");

-- CreateIndex
CREATE INDEX "ManufacturingJob_blueprintId_idx" ON "public"."ManufacturingJob"("blueprintId");

-- AddForeignKey
ALTER TABLE "public"."PlayerUpgrades" ADD CONSTRAINT "PlayerUpgrades_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RefiningJob" ADD CONSTRAINT "RefiningJob_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ManufacturingJob" ADD CONSTRAINT "ManufacturingJob_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ManufacturingJob" ADD CONSTRAINT "ManufacturingJob_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "public"."Blueprint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
