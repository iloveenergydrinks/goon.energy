-- DropForeignKey
ALTER TABLE "public"."PlayerBlueprint" DROP CONSTRAINT "PlayerBlueprint_playerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PlayerModule" DROP CONSTRAINT "PlayerModule_playerId_fkey";

-- AlterTable
ALTER TABLE "public"."Blueprint" ALTER COLUMN "requiredMaterials" DROP DEFAULT,
ALTER COLUMN "baseStats" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Material" ADD COLUMN     "tierStats" JSONB;

-- AlterTable
ALTER TABLE "public"."PlayerMaterial" ADD COLUMN     "isRefined" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "public"."PlayerBlueprint" ADD CONSTRAINT "PlayerBlueprint_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlayerModule" ADD CONSTRAINT "PlayerModule_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
