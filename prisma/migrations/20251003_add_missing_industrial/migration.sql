-- Add missing column to Player
ALTER TABLE "public"."Player" ADD COLUMN "manufacturingMastery" INTEGER NOT NULL DEFAULT 0;

-- Add PlayerBlueprint table
CREATE TABLE "public"."PlayerBlueprint" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "blueprintId" TEXT NOT NULL,
    "unlocked" BOOLEAN NOT NULL DEFAULT true,
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerBlueprint_pkey" PRIMARY KEY ("id")
);

-- Add PlayerComponent table
CREATE TABLE "public"."PlayerComponent" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "quantity" BIGINT NOT NULL,
    "quality" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerComponent_pkey" PRIMARY KEY ("id")
);

-- Add PlayerModule table
CREATE TABLE "public"."PlayerModule" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "blueprintId" TEXT,
    "quality" DOUBLE PRECISION NOT NULL,
    "stats" JSONB NOT NULL,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "shipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerModule_pkey" PRIMARY KEY ("id")
);

-- Add missing columns to RefiningJob
ALTER TABLE "public"."RefiningJob" ADD COLUMN IF NOT EXISTS "estimatedCompletion" TIMESTAMP(3);
ALTER TABLE "public"."RefiningJob" ADD COLUMN IF NOT EXISTS "captainId" TEXT;
ALTER TABLE "public"."RefiningJob" ADD COLUMN IF NOT EXISTS "batchId" TEXT;

-- Add missing columns to ManufacturingJob
ALTER TABLE "public"."ManufacturingJob" ADD COLUMN IF NOT EXISTS "estimatedCompletion" TIMESTAMP(3);
ALTER TABLE "public"."ManufacturingJob" ADD COLUMN IF NOT EXISTS "captainId" TEXT;
ALTER TABLE "public"."ManufacturingJob" ADD COLUMN IF NOT EXISTS "batchId" TEXT;
ALTER TABLE "public"."ManufacturingJob" ADD COLUMN IF NOT EXISTS "batchIndex" INTEGER;
ALTER TABLE "public"."ManufacturingJob" ADD COLUMN IF NOT EXISTS "batchSize" INTEGER NOT NULL DEFAULT 1;

-- Update Blueprint table schema
ALTER TABLE "public"."Blueprint" DROP CONSTRAINT IF EXISTS "Blueprint_playerId_fkey";
ALTER TABLE "public"."Blueprint" DROP CONSTRAINT IF EXISTS "Blueprint_playerId_baseItemId_key";
ALTER TABLE "public"."Blueprint" DROP COLUMN IF EXISTS "playerId";
ALTER TABLE "public"."Blueprint" DROP COLUMN IF EXISTS "baseItemId";
ALTER TABLE "public"."Blueprint" DROP COLUMN IF EXISTS "researchLevel";
ALTER TABLE "public"."Blueprint" DROP COLUMN IF EXISTS "researchPoints";
ALTER TABLE "public"."Blueprint" DROP COLUMN IF EXISTS "statImprovements";
ALTER TABLE "public"."Blueprint" DROP COLUMN IF EXISTS "materialEfficiency";
ALTER TABLE "public"."Blueprint" DROP COLUMN IF EXISTS "productionTime";
ALTER TABLE "public"."Blueprint" DROP COLUMN IF EXISTS "inResearch";
ALTER TABLE "public"."Blueprint" DROP COLUMN IF EXISTS "researchStarted";
ALTER TABLE "public"."Blueprint" DROP COLUMN IF EXISTS "lastResearchSuccess";
ALTER TABLE "public"."Blueprint" DROP COLUMN IF EXISTS "consecutiveFailures";
ALTER TABLE "public"."Blueprint" DROP COLUMN IF EXISTS "isOriginal";
ALTER TABLE "public"."Blueprint" DROP COLUMN IF EXISTS "isShared";
ALTER TABLE "public"."Blueprint" DROP COLUMN IF EXISTS "sharedWith";
ALTER TABLE "public"."Blueprint" DROP COLUMN IF EXISTS "securityLevel";

ALTER TABLE "public"."Blueprint" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "public"."Blueprint" ADD COLUMN IF NOT EXISTS "moduleId" TEXT;
ALTER TABLE "public"."Blueprint" ADD COLUMN IF NOT EXISTS "requiredMaterials" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "public"."Blueprint" ADD COLUMN IF NOT EXISTS "requiredComponents" JSONB;
ALTER TABLE "public"."Blueprint" ADD COLUMN IF NOT EXISTS "baseStats" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "public"."Blueprint" ADD COLUMN IF NOT EXISTS "tier" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "public"."Blueprint" ADD COLUMN IF NOT EXISTS "masteryRequired" INTEGER NOT NULL DEFAULT 0;

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "PlayerBlueprint_playerId_blueprintId_key" ON "public"."PlayerBlueprint"("playerId", "blueprintId");
CREATE UNIQUE INDEX IF NOT EXISTS "PlayerComponent_playerId_componentId_quality_key" ON "public"."PlayerComponent"("playerId", "componentId", "quality");
CREATE INDEX IF NOT EXISTS "PlayerComponent_playerId_idx" ON "public"."PlayerComponent"("playerId");
CREATE INDEX IF NOT EXISTS "PlayerModule_playerId_idx" ON "public"."PlayerModule"("playerId");
CREATE UNIQUE INDEX IF NOT EXISTS "Blueprint_name_key" ON "public"."Blueprint"("name");

-- Add foreign keys
ALTER TABLE "public"."PlayerBlueprint" ADD CONSTRAINT "PlayerBlueprint_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."PlayerBlueprint" ADD CONSTRAINT "PlayerBlueprint_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "public"."Blueprint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."PlayerComponent" ADD CONSTRAINT "PlayerComponent_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."PlayerModule" ADD CONSTRAINT "PlayerModule_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."PlayerModule" ADD CONSTRAINT "PlayerModule_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "public"."Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."Blueprint" ADD CONSTRAINT "Blueprint_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "public"."Module"("id") ON DELETE SET NULL ON UPDATE CASCADE;

