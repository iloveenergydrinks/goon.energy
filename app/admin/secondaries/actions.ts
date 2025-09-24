"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

function parseStringArray(value: FormDataEntryValue | null): string[] {
  if (!value) return [];
  return value
    .toString()
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
}

function parseSlotAdjustments(raw: string | null): { Power: number; Ammo: number; Utility: number } | null {
  if (!raw) return null;
  const adjustments = { Power: 0, Ammo: 0, Utility: 0 };
  // Parse from "Power:2,Ammo:-1,Utility:1" format
  raw.split(",").forEach((pair) => {
    const [slot, value] = pair.split(":");
    if (slot && value) {
      const key = slot.trim() as keyof typeof adjustments;
      if (key in adjustments) {
        adjustments[key] = Number(value.trim());
      }
    }
  });
  return adjustments;
}

export async function createSecondaryAction(formData: FormData) {
  const name = formData.get("name")?.toString().trim();
  if (!name) throw new Error("Name is required");

  const description = formData.get("description")?.toString().trim() || null;
  const category = formData.get("category")?.toString().trim() || "Utility";
  const powerCost = Number(formData.get("powerCost")) || 10;
  const slotAdjustmentsRaw = formData.get("slotAdjustments")?.toString() ?? null;
  const archetypeFocus = formData.get("archetypeFocus")?.toString().trim() || null;

  const slotAdjustments = parseSlotAdjustments(slotAdjustmentsRaw) ?? { Power: 0, Ammo: 0, Utility: 0 };

  await prisma.secondarySystem.create({
    data: {
      id: randomUUID(),
      name,
      description,
      category,
      powerCost,
      slotAdjustments,
      compatibleTags: parseStringArray(formData.get("compatibleTags")),
      archetypeFocus,
    },
  });

  revalidatePath("/admin/secondaries");
  revalidatePath("/");
}

export async function updateSecondaryAction(formData: FormData) {
  const id = formData.get("id")?.toString().trim();
  if (!id) throw new Error("Secondary ID missing");

  const name = formData.get("name")?.toString().trim() || "";
  const description = formData.get("description")?.toString().trim() || null;
  const category = formData.get("category")?.toString().trim() || "Utility";
  const powerCost = Number(formData.get("powerCost")) || 10;
  const slotAdjustmentsRaw = formData.get("slotAdjustments")?.toString() ?? null;
  const archetypeFocus = formData.get("archetypeFocus")?.toString().trim() || null;

  const slotAdjustments = parseSlotAdjustments(slotAdjustmentsRaw) ?? { Power: 0, Ammo: 0, Utility: 0 };

  await prisma.secondarySystem.update({
    where: { id },
    data: {
      name,
      description,
      category,
      powerCost,
      slotAdjustments,
      compatibleTags: parseStringArray(formData.get("compatibleTags")),
      archetypeFocus,
    },
  });

  revalidatePath("/admin/secondaries");
  revalidatePath("/");
}

export async function deleteSecondaryAction(formData: FormData) {
  const id = formData.get("id")?.toString().trim();
  if (!id) return;

  await prisma.secondarySystem.delete({ where: { id } });

  revalidatePath("/admin/secondaries");
  revalidatePath("/");
}
