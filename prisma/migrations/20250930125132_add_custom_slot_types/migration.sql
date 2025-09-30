-- CreateTable
CREATE TABLE "public"."CustomSlotType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "accepts" TEXT[],
    "preferredType" TEXT,
    "bwMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.2,
    "color" TEXT NOT NULL,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystemSlot" BOOLEAN NOT NULL DEFAULT false,
    "archetypeHints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomSlotType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomSlotType_name_key" ON "public"."CustomSlotType"("name");
