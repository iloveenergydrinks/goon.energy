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

function parseShape(raw: string | null): Array<{ r: number; c: number }> {
  if (!raw) return [{ r: 0, c: 0 }];
  // Parse from "0,0|0,1|1,0|1,1" format
  const cells = raw.split("|").map(cell => {
    const [r, c] = cell.split(",").map(Number);
    return { r, c };
  });
  return cells.length > 0 ? cells : [{ r: 0, c: 0 }];
}

export async function createModuleAction(formData: FormData) {
  const name = formData.get("name")?.toString().trim();
  if (!name) throw new Error("Name is required");

  const description = formData.get("description")?.toString().trim() || null;
  const slot = formData.get("slot")?.toString().trim() || "Power";
  const baseBW = Number(formData.get("baseBW")) || 10;
  const statsRaw = formData.get("stats")?.toString() ?? null;
  const shapeRaw = formData.get("shape")?.toString() ?? null;
  const familyName = formData.get("familyName")?.toString().trim() || null;
  const variantTier = formData.get("variantTier")?.toString().trim() || null;
  const minHullSize = formData.get("minHullSize")?.toString().trim() || null;

  const stats = parseStats(statsRaw) ?? {};
  const shape = parseShape(shapeRaw);

  await prisma.module.create({
    data: {
      id: randomUUID(),
      name: name, // Using name as the ID for now (we might want to change this)
      slot,
      shape,
      stats,
      description,
      baseBW,
      tags: parseStringArray(formData.get("tags")),
      familyName,
      variantTier,
      minHullSize,
    },
  });

  revalidatePath("/admin/modules");
  revalidatePath("/");
}

export async function updateModuleAction(formData: FormData) {
  const id = formData.get("id")?.toString().trim();
  if (!id) throw new Error("Module ID missing");

  const name = formData.get("name")?.toString().trim() || "";
  const description = formData.get("description")?.toString().trim() || null;
  const slot = formData.get("slot")?.toString().trim() || "Power";
  const baseBW = Number(formData.get("baseBW")) || 10;
  const statsRaw = formData.get("stats")?.toString() ?? null;
  const shapeRaw = formData.get("shape")?.toString() ?? null;
  const familyName = formData.get("familyName")?.toString().trim() || null;
  const variantTier = formData.get("variantTier")?.toString().trim() || null;
  const minHullSize = formData.get("minHullSize")?.toString().trim() || null;

  const stats = parseStats(statsRaw) ?? {};
  const shape = parseShape(shapeRaw);

  await prisma.module.update({
    where: { id },
    data: {
      name,
      slot,
      shape,
      stats,
      description,
      baseBW,
      tags: parseStringArray(formData.get("tags")),
      familyName,
      variantTier,
      minHullSize,
    },
  });

  revalidatePath("/admin/modules");
  revalidatePath("/");
}

export async function deleteModuleAction(formData: FormData) {
  const id = formData.get("id")?.toString().trim();
  if (!id) return;

  await prisma.module.delete({ where: { id } });

  revalidatePath("/admin/modules");
  revalidatePath("/");
}
