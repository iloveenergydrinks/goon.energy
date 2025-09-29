-- CreateTable
CREATE TABLE "public"."Player" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isk" BIGINT NOT NULL DEFAULT 1000000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ResourceNode" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "resourceType" TEXT NOT NULL,
    "totalAmount" BIGINT NOT NULL,
    "currentAmount" BIGINT NOT NULL,
    "baseYield" INTEGER NOT NULL DEFAULT 100,
    "purity" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "sector" TEXT NOT NULL,
    "coordinates" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "depleted" BOOLEAN NOT NULL DEFAULT false,
    "respawnAt" TIMESTAMP(3),
    "discoveredBy" TEXT,
    "discoveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Material" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "baseValue" INTEGER NOT NULL DEFAULT 100,
    "baseAttributes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PlayerMaterial" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantity" BIGINT NOT NULL,
    "tier" INTEGER NOT NULL,
    "purity" DOUBLE PRECISION NOT NULL,
    "attributes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MiningOperation" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "materialGained" TEXT NOT NULL,
    "quantityMined" BIGINT NOT NULL,
    "purityGained" DOUBLE PRECISION NOT NULL,
    "tierGained" INTEGER NOT NULL,
    "minedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MiningOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Blueprint" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "baseItemId" TEXT NOT NULL,
    "researchLevel" INTEGER NOT NULL DEFAULT 0,
    "researchPoints" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "statImprovements" JSONB NOT NULL DEFAULT '{}',
    "materialEfficiency" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "productionTime" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "inResearch" BOOLEAN NOT NULL DEFAULT false,
    "researchStarted" TIMESTAMP(3),
    "lastResearchSuccess" BOOLEAN NOT NULL DEFAULT true,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "isOriginal" BOOLEAN NOT NULL DEFAULT true,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "sharedWith" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "securityLevel" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blueprint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_name_key" ON "public"."Player"("name");

-- CreateIndex
CREATE INDEX "ResourceNode_active_depleted_idx" ON "public"."ResourceNode"("active", "depleted");

-- CreateIndex
CREATE INDEX "ResourceNode_sector_idx" ON "public"."ResourceNode"("sector");

-- CreateIndex
CREATE INDEX "PlayerMaterial_playerId_idx" ON "public"."PlayerMaterial"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerMaterial_playerId_materialId_tier_purity_key" ON "public"."PlayerMaterial"("playerId", "materialId", "tier", "purity");

-- CreateIndex
CREATE INDEX "MiningOperation_playerId_idx" ON "public"."MiningOperation"("playerId");

-- CreateIndex
CREATE INDEX "MiningOperation_nodeId_idx" ON "public"."MiningOperation"("nodeId");

-- CreateIndex
CREATE INDEX "Blueprint_playerId_idx" ON "public"."Blueprint"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "Blueprint_playerId_baseItemId_key" ON "public"."Blueprint"("playerId", "baseItemId");

-- AddForeignKey
ALTER TABLE "public"."ResourceNode" ADD CONSTRAINT "ResourceNode_discoveredBy_fkey" FOREIGN KEY ("discoveredBy") REFERENCES "public"."Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlayerMaterial" ADD CONSTRAINT "PlayerMaterial_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlayerMaterial" ADD CONSTRAINT "PlayerMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "public"."Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MiningOperation" ADD CONSTRAINT "MiningOperation_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MiningOperation" ADD CONSTRAINT "MiningOperation_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "public"."ResourceNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Blueprint" ADD CONSTRAINT "Blueprint_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
