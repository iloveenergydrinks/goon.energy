"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getBlueprints() {
  return await prisma.blueprint.findMany({
    include: {
      module: true
    },
    orderBy: [
      { tier: "asc" },
      { name: "asc" }
    ]
  });
}

export async function createBlueprint(data: {
  name: string;
  description?: string;
  type: string;
  moduleId?: string;
  requiredMaterials: any; // JSON array
  requiredComponents?: any; // JSON array
  baseStats: any; // JSON object
  tier: number;
  masteryRequired: number;
}) {
  const blueprint = await prisma.blueprint.create({
    data: {
      ...data,
      requiredMaterials: data.requiredMaterials,
      requiredComponents: data.requiredComponents || [],
      baseStats: data.baseStats
    }
  });
  
  // Auto-unlock for demo player
  const demoPlayer = await prisma.player.findFirst({
    where: { id: 'demo-player' }
  });
  
  if (demoPlayer) {
    await prisma.playerBlueprint.create({
      data: {
        playerId: demoPlayer.id,
        blueprintId: blueprint.id,
        unlocked: true
      }
    }).catch(() => {}); // Ignore if already exists
  }
  
  revalidatePath("/admin/blueprints");
  return blueprint;
}

export async function updateBlueprint(
  id: string,
  data: {
    name?: string;
    description?: string;
    type?: string;
    moduleId?: string;
    requiredMaterials?: any;
    requiredComponents?: any;
    baseStats?: any;
    tier?: number;
    masteryRequired?: number;
  }
) {
  const blueprint = await prisma.blueprint.update({
    where: { id },
    data
  });
  
  revalidatePath("/admin/blueprints");
  return blueprint;
}

export async function deleteBlueprint(id: string) {
  // Delete related data first
  await prisma.playerBlueprint.deleteMany({
    where: { blueprintId: id }
  });
  
  await prisma.manufacturingJob.deleteMany({
    where: { blueprintId: id }
  });
  
  const blueprint = await prisma.blueprint.delete({
    where: { id }
  });
  
  revalidatePath("/admin/blueprints");
  return blueprint;
}

export async function getMaterials() {
  return await prisma.material.findMany({
    orderBy: { name: 'asc' }
  });
}

