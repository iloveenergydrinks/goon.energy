-- AlterTable
ALTER TABLE "public"."Hull" ADD COLUMN     "mismatchTolerance" DOUBLE PRECISION,
ADD COLUMN     "slotBias" JSONB,
ADD COLUMN     "tagAffinities" JSONB,
ADD COLUMN     "tagPenalties" JSONB;

-- AlterTable
ALTER TABLE "public"."PrimarySystem" ALTER COLUMN "minPowerSlots" SET DEFAULT 0,
ALTER COLUMN "powerDraw" SET DEFAULT 30;

-- AlterTable
ALTER TABLE "public"."SecondarySystem" ALTER COLUMN "deltaPowerSlots" SET DEFAULT 0,
ALTER COLUMN "deltaAmmoSlots" SET DEFAULT 0,
ALTER COLUMN "deltaUtilitySlots" SET DEFAULT 0,
ALTER COLUMN "powerDraw" SET DEFAULT 10;
