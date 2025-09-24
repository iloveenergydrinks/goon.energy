"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import type { SlotType } from "@/types/fitting";

function parseStringArray(value: FormDataEntryValue | null): string[] {
  if (!value) return [];
  return value
    .toString()
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
}

function parseGrid(json: string | null): { rows: number; cols: number; slots: { r: number; c: number; type: SlotType }[] } | null {
  if (!json) return null;
  const parsed = JSON.parse(json);
  if (!parsed || typeof parsed !== "object") return null;
  return parsed;
}

function parseBaseStats(raw: string | null): Record<string, number> | null {
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

export async function createHullAction(formData: FormData) {
  const name = formData.get("name")?.toString().trim();
  if (!name) throw new Error("Name is required");

  const description = formData.get("description")?.toString().trim() || null;
  const sizeId = formData.get("sizeId")?.toString().trim() || "Frigate";
  const powerCapacity = Number(formData.get("powerCapacity")) || 0;
  const bandwidthLimit = Number(formData.get("bandwidthLimit")) || 0;
  const gridJson = formData.get("grid")?.toString() ?? null;
  const baseStatsRaw = formData.get("baseStats")?.toString() ?? null;
  const archetype = formData.get("archetype")?.toString().trim() || null;
  const mismatchTolerance = formData.get("mismatchTolerance") ? Number(formData.get("mismatchTolerance")) : null;

  const grid = parseGrid(gridJson) ?? { rows: 3, cols: 3, slots: [] };
  const baseStats = parseBaseStats(baseStatsRaw) ?? {};

  await prisma.hull.create({
    data: {
      id: randomUUID(),
      name,
      description,
      sizeId,
      powerCapacity,
      bandwidthLimit,
      grid,
      baseStats,
      compatibleTags: parseStringArray(formData.get("compatibleTags")),
      incompatibleTags: parseStringArray(formData.get("incompatibleTags")),
      preferredWeapons: parseStringArray(formData.get("preferredWeapons")),
      archetype,
      mismatchTolerance,
    },
  });

  revalidatePath("/admin/hulls");
  revalidatePath("/");
}

export async function updateHullAction(formData: FormData) {
  const id = formData.get("id")?.toString().trim();
  if (!id) throw new Error("Hull ID missing");

  const name = formData.get("name")?.toString().trim() || "";
  const description = formData.get("description")?.toString().trim() || null;
  const sizeId = formData.get("sizeId")?.toString().trim() || "Frigate";
  const powerCapacity = Number(formData.get("powerCapacity")) || 0;
  const bandwidthLimit = Number(formData.get("bandwidthLimit")) || 0;
  const gridJson = formData.get("grid")?.toString() ?? null;
  const baseStatsRaw = formData.get("baseStats")?.toString() ?? null;
  const archetype = formData.get("archetype")?.toString().trim() || null;
  const mismatchTolerance = formData.get("mismatchTolerance") ? Number(formData.get("mismatchTolerance")) : null;

  const grid = parseGrid(gridJson) ?? { rows: 3, cols: 3, slots: [] };
  const baseStats = parseBaseStats(baseStatsRaw) ?? {};

  await prisma.hull.update({
    where: { id },
    data: {
      name,
      description,
      sizeId,
      powerCapacity,
      bandwidthLimit,
      grid,
      baseStats,
      compatibleTags: parseStringArray(formData.get("compatibleTags")),
      incompatibleTags: parseStringArray(formData.get("incompatibleTags")),
      preferredWeapons: parseStringArray(formData.get("preferredWeapons")),
      archetype,
      mismatchTolerance,
    },
  });

  revalidatePath("/admin/hulls");
  revalidatePath("/");
}

export async function deleteHullAction(formData: FormData) {
  const id = formData.get("id")?.toString().trim();
  if (!id) return;

  await prisma.hull.delete({ where: { id } });

  revalidatePath("/admin/hulls");
  revalidatePath("/");
}

