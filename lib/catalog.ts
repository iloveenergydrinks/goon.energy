import {
  applyHullOverrides,
  applyModuleOverrides,
  applyPrimaryOverrides,
  applySecondaryOverrides,
} from "@/lib/catalog/softArchetypeConfig";
import type {
  PrimaryArchetype,
  SecondaryDef,
  ModuleDef,
  Hull,
  ModulesById,
  PrimariesById,
  SecondariesById,
  HullsById,
} from "@/types/fitting";
import { resolveModuleVariants } from "@/lib/catalog/variants/resolveModuleVariants";
import { prisma } from "@/lib/prisma";
import hullSeed from "@/app/data/hulls.json";
import primarySeed from "@/app/data/primaries.json";
import secondarySeed from "@/app/data/secondaries.json";
import moduleSeed from "@/app/data/modules.json";

function uniqueBy<T extends { id: string }>(list: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of list) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      out.push(item);
    }
  }
  return out;
}

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

export interface Catalog {
  primaries: PrimaryArchetype[];
  secondaries: SecondaryDef[];
  hulls: Hull[];
  modules: ModuleDef[];
  modulesById: ModulesById;
  primariesById: PrimariesById;
  secondariesById: SecondariesById;
  hullsById: HullsById;
}

async function seedFromJson() {
  await prisma.$transaction([
    prisma.module.deleteMany(),
    prisma.secondarySystem.deleteMany(),
    prisma.primarySystem.deleteMany(),
    prisma.hull.deleteMany(),
  ]);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  await prisma.hull.createMany({ data: hullSeed as any });
  await prisma.primarySystem.createMany({ data: primarySeed as any });
  await prisma.secondarySystem.createMany({ data: secondarySeed as any });
  await prisma.module.createMany({ data: moduleSeed as any });
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

async function fetchCatalogRows() {
  return Promise.all([
    prisma.primarySystem.findMany(),
    prisma.secondarySystem.findMany(),
    prisma.hull.findMany(),
    prisma.module.findMany(),
  ]);
}

export async function loadCatalog(): Promise<Catalog> {
  if (typeof window !== "undefined") {
    throw new Error("loadCatalog must be invoked on the server");
  }

  let [primFromDb, secFromDb, hullFromDb, modFromDb] = await fetchCatalogRows();

  if (!primFromDb.length || !secFromDb.length || !hullFromDb.length || !modFromDb.length) {
    await seedFromJson();
    [primFromDb, secFromDb, hullFromDb, modFromDb] = await fetchCatalogRows();
  }

  const prim = uniqueBy(
    primFromDb.map((p) =>
      applyPrimaryOverrides({
        ...p,
        baseStats: p.baseStats as PrimaryArchetype["baseStats"],
        stats: p.baseStats as PrimaryArchetype["stats"],
        minPowerSlots: 0, // Default value
        powerDraw: p.powerDraw || 30,
        tags: p.tags || [],
      } as unknown as PrimaryArchetype)
    )
  );
  const secs = uniqueBy(
    secFromDb.map((s) =>
      applySecondaryOverrides({
        ...s,
        baseStats: {} as SecondaryDef["baseStats"],
        deltaPowerSlots: s.deltaPowerSlots || 0,
        deltaAmmoSlots: s.deltaAmmoSlots || 0,
        deltaUtilitySlots: s.deltaUtilitySlots || 0,
        powerDraw: s.powerDraw || 10,
        tags: s.tags || [],
      } as unknown as SecondaryDef)
    )
  );
  const hls = uniqueBy(
    hullFromDb.map((h) =>
      applyHullOverrides({
        ...h,
        description: h.description || undefined,
        baseStats: h.baseStats as Hull["baseStats"],
        grid: h.grid as Hull["grid"],
      } as unknown as Hull)
    )
  );
  const mods = uniqueBy(
    resolveModuleVariants(
      modFromDb.map((m) =>
        applyModuleOverrides({
          ...m,
          // name: m.name || undefined, // TODO: Add name to database
          description: m.description || undefined,
          stats: m.stats as ModuleDef["stats"],
          shape: m.shape as unknown as ModuleDef["shape"],
        } as unknown as ModuleDef)
      )
    )
  );

  assert(prim.length > 0, "No primaries loaded");
  assert(secs.length > 0, "No secondaries loaded");
  assert(hls.length > 0, "No hulls loaded");
  assert(mods.length > 0, "No modules loaded");

  // Validate hulls have proper grids
  for (const h of hls) {
    assert(h.grid.slots.length > 0, `Hull ${h.id} has empty grid`);
    if (!h.archetype) {
      console.warn(`Hull ${h.id} missing archetype assignment`);
    }
  }

  for (const m of mods) {
    assert(m.shape.cells.length > 0, `Module ${m.id} has empty shape`);
    if (!m.tags?.length) {
      console.warn(`Module ${m.id} missing tags`);
    }
  }

  const modulesById: ModulesById = Object.fromEntries(mods.map((m) => [m.id, m]));
  const primariesById: PrimariesById = Object.fromEntries(prim.map((p) => [p.id, p]));
  const secondariesById: SecondariesById = Object.fromEntries(secs.map((s) => [s.id, s]));
  const hullsById: HullsById = Object.fromEntries(hls.map((h) => [h.id, h]));

  return {
    primaries: prim,
    secondaries: secs,
    hulls: hls,
    modules: mods,
    modulesById,
    primariesById,
    secondariesById,
    hullsById,
  };
}

