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

function parseStats(raw: string | null): Record<string, number> | null {
  if (!raw) return null;
  const stats: Record<string, number> = {};
  // Parse from "key1:value1,key2:value2" format
  raw.split(",").forEach((pair) => {
    const [key, value] = pair.split(":");
    if (key && value) {
      stats[key.trim()] = Number(value.trim());
    }
  });
  return Object.keys(stats).length > 0 ? stats : null;
}

export async function createPrimaryAction(formData: FormData) {
  const name = formData.get("name")?.toString().trim();
  if (!name) throw new Error("Name is required");

  const description = formData.get("description")?.toString().trim() || null;
  const statsRaw = formData.get("stats")?.toString() ?? null;
  const powerCost = Number(formData.get("powerCost")) || 30;
  const archetypeFocus = formData.get("archetypeFocus")?.toString().trim() || null;

  const stats = parseStats(statsRaw) ?? {};

  await prisma.primarySystem.create({
    data: {
      id: randomUUID(),
      name,
      description,
      baseStats: stats,
      powerDraw: powerCost,
      tags: parseStringArray(formData.get("compatibleTags")),
      archetypeFocus: archetypeFocus ? [archetypeFocus] : [],
    },
  });

  revalidatePath("/admin/primaries");
  revalidatePath("/");
}

export async function updatePrimaryAction(formData: FormData) {
  const id = formData.get("id")?.toString().trim();
  if (!id) throw new Error("Primary ID missing");

  const name = formData.get("name")?.toString().trim() || "";
  const description = formData.get("description")?.toString().trim() || null;
  const statsRaw = formData.get("stats")?.toString() ?? null;
  const powerCost = Number(formData.get("powerCost")) || 30;
  const archetypeFocus = formData.get("archetypeFocus")?.toString().trim() || null;

  const stats = parseStats(statsRaw) ?? {};

  await prisma.primarySystem.update({
    where: { id },
    data: {
      name,
      description,
      baseStats: stats,
      powerDraw: powerCost,
      tags: parseStringArray(formData.get("compatibleTags")),
      archetypeFocus: archetypeFocus ? [archetypeFocus] : [],
    },
  });

  revalidatePath("/admin/primaries");
  revalidatePath("/");
}

export async function deletePrimaryAction(formData: FormData) {
  const id = formData.get("id")?.toString().trim();
  if (!id) return;

  await prisma.primarySystem.delete({ where: { id } });

  revalidatePath("/admin/primaries");
  revalidatePath("/");
}
