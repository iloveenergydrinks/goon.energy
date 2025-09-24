-- CreateTable
CREATE TABLE "public"."Hull" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sizeId" TEXT NOT NULL,
    "archetype" TEXT,
    "powerCapacity" INTEGER NOT NULL,
    "bandwidthLimit" INTEGER NOT NULL,
    "compatibleTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "incompatibleTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredWeapons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "baseStats" JSONB,
    "grid" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hull_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PrimarySystem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "baseStats" JSONB,
    "minPowerSlots" INTEGER NOT NULL,
    "minAmmoSlots" INTEGER,
    "powerDraw" INTEGER NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "archetypeFocus" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tagAffinities" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrimarySystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SecondarySystem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "baseStats" JSONB,
    "deltaPowerSlots" INTEGER NOT NULL,
    "deltaAmmoSlots" INTEGER NOT NULL,
    "deltaUtilitySlots" INTEGER NOT NULL,
    "powerDraw" INTEGER NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "archetypeFocus" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tagAffinities" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecondarySystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Module" (
    "id" TEXT NOT NULL,
    "familyId" TEXT,
    "familyName" TEXT,
    "variantTier" TEXT,
    "minHullSize" TEXT,
    "slot" TEXT NOT NULL,
    "shape" JSONB NOT NULL,
    "stats" JSONB,
    "description" TEXT,
    "baseBW" INTEGER,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "archetypeBias" JSONB,
    "tagAffinities" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);
