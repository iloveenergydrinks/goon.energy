"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCustomSlots() {
  return await prisma.customSlotType.findMany({
    orderBy: [
      { isSystemSlot: "asc" },
      { name: "asc" }
    ]
  });
}

export async function createCustomSlot(data: {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  accepts: string[];
  preferredType?: string;
  bwMultiplier: number;
  color: string;
  archetypeHints?: string[];
}) {
  const slot = await prisma.customSlotType.create({
    data: {
      ...data,
      isSystemSlot: false,
      isActive: true,
    }
  });
  
  revalidatePath("/admin/slots");
  return slot;
}

export async function updateCustomSlot(
  id: string,
  data: {
    name?: string;
    displayName?: string;
    description?: string;
    accepts?: string[];
    preferredType?: string;
    bwMultiplier?: number;
    color?: string;
    archetypeHints?: string[];
    isActive?: boolean;
  }
) {
  const slot = await prisma.customSlotType.update({
    where: { id },
    data
  });
  
  revalidatePath("/admin/slots");
  return slot;
}

export async function deleteCustomSlot(id: string) {
  // Only allow deletion of non-system slots
  const slot = await prisma.customSlotType.findUnique({
    where: { id }
  });
  
  if (slot?.isSystemSlot) {
    throw new Error("Cannot delete system slot types");
  }
  
  await prisma.customSlotType.delete({
    where: { id }
  });
  
  revalidatePath("/admin/slots");
}

export async function seedSystemSlots() {
  // Seed the built-in slot types if they don't exist
  const systemSlots = [
    {
      id: "Power",
      name: "Power",
      displayName: "Power",
      description: "Standard power slot for energy-based modules",
      accepts: ["Power"],
      preferredType: "Power",
      bwMultiplier: 1.0,
      color: "#1E90FF",
      isSystemSlot: true,
      archetypeHints: []
    },
    {
      id: "Ammo",
      name: "Ammo",
      displayName: "Ammo",
      description: "Standard ammo slot for ammunition-based modules",
      accepts: ["Ammo"],
      preferredType: "Ammo",
      bwMultiplier: 1.0,
      color: "#FF8C00",
      isSystemSlot: true,
      archetypeHints: []
    },
    {
      id: "Utility",
      name: "Utility",
      displayName: "Utility",
      description: "Standard utility slot for support modules",
      accepts: ["Utility"],
      preferredType: "Utility",
      bwMultiplier: 1.0,
      color: "#32CD32",
      isSystemSlot: true,
      archetypeHints: []
    },
    {
      id: "Hybrid-PA",
      name: "Hybrid-PA",
      displayName: "Power/Ammo",
      description: "Hybrid slot accepting both Power and Ammo modules",
      accepts: ["Power", "Ammo"],
      preferredType: "Power",
      bwMultiplier: 1.2,
      color: "#8B5CF6",
      isSystemSlot: true,
      archetypeHints: ["assault", "artillery"]
    },
    {
      id: "Hybrid-PU",
      name: "Hybrid-PU",
      displayName: "Power/Utility",
      description: "Hybrid slot accepting both Power and Utility modules",
      accepts: ["Power", "Utility"],
      preferredType: "Power",
      bwMultiplier: 1.2,
      color: "#06B6D4",
      isSystemSlot: true,
      archetypeHints: ["defender", "bulwark"]
    },
    {
      id: "Hybrid-AU",
      name: "Hybrid-AU",
      displayName: "Ammo/Utility",
      description: "Hybrid slot accepting both Ammo and Utility modules",
      accepts: ["Ammo", "Utility"],
      preferredType: "Ammo",
      bwMultiplier: 1.2,
      color: "#84CC16",
      isSystemSlot: true,
      archetypeHints: ["recon", "infiltrator"]
    },
    {
      id: "Hybrid-PAU",
      name: "Hybrid-PAU",
      displayName: "Universal",
      description: "Universal slot accepting all module types",
      accepts: ["Power", "Ammo", "Utility"],
      preferredType: undefined,
      bwMultiplier: 1.3,
      color: "#EC4899",
      isSystemSlot: true,
      archetypeHints: ["support", "carrier"]
    }
  ];
  
  for (const slot of systemSlots) {
    await prisma.customSlotType.upsert({
      where: { id: slot.id },
      update: slot,
      create: slot
    });
  }
  
  revalidatePath("/admin/slots");
  return { message: "System slots seeded successfully" };
}
