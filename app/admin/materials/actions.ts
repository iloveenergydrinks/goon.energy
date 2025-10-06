"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMaterials() {
  return await prisma.material.findMany({
    orderBy: { name: 'asc' }
  });
}

export async function updateMaterial(
  id: string,
  data: {
    name?: string;
    category?: string;
    baseValue?: number;
    baseAttributes?: any;
    tierStats?: any;
  }
) {
  const material = await prisma.material.update({
    where: { id },
    data
  });
  
  revalidatePath("/admin/materials");
  return material;
}

export async function createMaterial(data: {
  name: string;
  category: string;
  baseValue: number;
  baseAttributes: any;
  tierStats?: any;
}) {
  if (!data.name || data.name.trim() === '') {
    throw new Error('Material name is required');
  }
  
  const material = await prisma.material.create({
    data: {
      name: data.name.trim(),
      category: data.category,
      baseValue: data.baseValue,
      baseAttributes: data.baseAttributes,
      tierStats: data.tierStats
    }
  });
  
  revalidatePath("/admin/materials");
  return material;
}

export async function deleteMaterial(id: string) {
  // Check if any player has this material
  const playerMaterials = await prisma.playerMaterial.count({
    where: { materialId: id }
  });
  
  if (playerMaterials > 0) {
    throw new Error('Cannot delete material: players have this in inventory');
  }
  
  const material = await prisma.material.delete({
    where: { id }
  });
  
  revalidatePath("/admin/materials");
  return material;
}

