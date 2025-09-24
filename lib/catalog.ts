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

  await prisma.hull.createMany({ data: hullSeed as unknown as Parameters<typeof prisma.hull.createMany>[0]["data"] });
  await prisma.primarySystem.createMany({ data: primarySeed as unknown as Parameters<typeof prisma.primarySystem.createMany>[0]["data"] });
  await prisma.secondarySystem.createMany({ data: secondarySeed as unknown as Parameters<typeof prisma.secondarySystem.createMany>[0]["data"] });
  await prisma.module.createMany({ data: moduleSeed as unknown as Parameters<typeof prisma.module.createMany>[0]["data"] });
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
      })
    )
  );
  const secs = uniqueBy(
    secFromDb.map((s) =>
      applySecondaryOverrides({
        ...s,
        baseStats: s.baseStats as SecondaryDef["baseStats"],
      })
    )
  );
  const hls = uniqueBy(
    hullFromDb.map((h) =>
      applyHullOverrides({
        ...h,
        baseStats: h.baseStats as Hull["baseStats"],
        grid: h.grid as Hull["grid"],
      })
    )
  );
  const mods = uniqueBy(
    resolveModuleVariants(
      modFromDb.map((m) =>
        applyModuleOverrides({
          ...m,
          stats: m.stats as ModuleDef["stats"],
          shape: m.shape as ModuleDef["shape"],
        })
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

