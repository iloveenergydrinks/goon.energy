"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getModuleTypes() {
  return await prisma.moduleType.findMany({
    orderBy: [
      { isSystemType: "desc" },
      { category: "asc" },
      { name: "asc" }
    ]
  });
}

export async function createModuleType(data: {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  color: string;
  baseBandwidth: number;
  category: string;
}) {
  const moduleType = await prisma.moduleType.create({
    data: {
      ...data,
      isSystemType: false,
      isActive: true,
    }
  });
  
  revalidatePath("/admin/module-types");
  revalidatePath("/admin/slots");
  return moduleType;
}

export async function updateModuleType(
  id: string,
  data: {
    name?: string;
    displayName?: string;
    description?: string;
    color?: string;
    baseBandwidth?: number;
    category?: string;
    isActive?: boolean;
  }
) {
  const moduleType = await prisma.moduleType.update({
    where: { id },
    data
  });
  
  revalidatePath("/admin/module-types");
  revalidatePath("/admin/slots");
  return moduleType;
}

export async function deleteModuleType(id: string) {
  // Only allow deletion of non-system types
  const moduleType = await prisma.moduleType.findUnique({
    where: { id }
  });
  
  if (moduleType?.isSystemType) {
    throw new Error("Cannot delete system module types");
  }
  
  await prisma.moduleType.delete({
    where: { id }
  });
  
  revalidatePath("/admin/module-types");
  revalidatePath("/admin/slots");
}

export async function seedSystemModuleTypes() {
  const systemTypes = [
    {
      id: "Power",
      name: "Power",
      displayName: "Power",
      description: "Energy-based modules for weapons, shields, and power systems",
      color: "#1E90FF",
      baseBandwidth: 10,
      category: "base",
      isSystemType: true,
      isActive: true
    },
    {
      id: "Ammo",
      name: "Ammo",
      displayName: "Ammo",
      description: "Ammunition-based modules for ballistic and missile weapons",
      color: "#FF8C00",
      baseBandwidth: 10,
      category: "base",
      isSystemType: true,
      isActive: true
    },
    {
      id: "Utility",
      name: "Utility",
      displayName: "Utility",
      description: "Support modules for sensors, repair, and special systems",
      color: "#32CD32",
      baseBandwidth: 10,
      category: "base",
      isSystemType: true,
      isActive: true
    }
  ];
  
  for (const type of systemTypes) {
    await prisma.moduleType.upsert({
      where: { id: type.id },
      update: type,
      create: type
    });
  }
  
  revalidatePath("/admin/module-types");
  revalidatePath("/admin/slots");
  return { message: "System module types seeded successfully" };
}
