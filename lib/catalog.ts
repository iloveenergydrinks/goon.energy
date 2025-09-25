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
import newPrimaries from "@/app/data/primaries_new.json";
import secondarySeed from "@/app/data/secondaries.json";
import newSecondaries from "@/app/data/secondaries_new.json";
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

type NewPrimarySpec = {
  id: string;
  name: string;
  description?: string;
  archetypeFocus?: string[];
  powerDraw?: number;
  tags?: string[];
  baseStats?: Record<string, number>;
  metadata?: unknown;
};

async function ensureNewPrimaries() {
  const specs = (newPrimaries as unknown as Array<NewPrimarySpec>);
  const keepIds = specs.map((x) => x.id);

  // Remove any old primaries not in the new spec
  await prisma.primarySystem.deleteMany({ where: { id: { notIn: keepIds } } });

  for (const p of specs) {
    // Attempt write with metadata; if client/schema mismatch, fallback to tagAffinities
    try {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const updateData: any = {
        name: p.name,
        description: p.description,
        baseStats: p.baseStats,
        powerDraw: p.powerDraw ?? 30,
        tags: p.tags ?? [],
        archetypeFocus: (p.archetypeFocus ?? []) as string[],
        metadata: p.metadata ?? {},
      };
      const createData: any = {
        id: p.id,
        name: p.name,
        description: p.description,
        baseStats: p.baseStats,
        minPowerSlots: 0,
        minAmmoSlots: (p.baseStats as Record<string, number> | undefined)?.ammo_mag ? 4 : 0,
        powerDraw: p.powerDraw ?? 30,
        tags: p.tags ?? [],
        archetypeFocus: (p.archetypeFocus ?? []) as string[],
        metadata: p.metadata ?? {},
      };
      await prisma.primarySystem.upsert({
        where: { id: p.id },
        update: updateData,
        create: createData,
      });
      /* eslint-enable @typescript-eslint/no-explicit-any */
    } catch (err) {
      const message = (err as Error)?.message ?? String(err);
      if (!message.includes("Unknown argument `metadata`")) {
        throw err;
      }
      // Fallback path: encode metadata under tagAffinities
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const updateDataFallback: any = {
        name: p.name,
        description: p.description,
        baseStats: p.baseStats,
        powerDraw: p.powerDraw ?? 30,
        tags: p.tags ?? [],
        archetypeFocus: (p.archetypeFocus ?? []) as string[],
        tagAffinities: { metadata: p.metadata ?? {} },
      };
      const createDataFallback: any = {
        id: p.id,
        name: p.name,
        description: p.description,
        baseStats: p.baseStats,
        minPowerSlots: 0,
        minAmmoSlots: (p.baseStats as Record<string, number> | undefined)?.ammo_mag ? 4 : 0,
        powerDraw: p.powerDraw ?? 30,
        tags: p.tags ?? [],
        archetypeFocus: (p.archetypeFocus ?? []) as string[],
        tagAffinities: { metadata: p.metadata ?? {} },
      };
      await prisma.primarySystem.upsert({
        where: { id: p.id },
        update: updateDataFallback,
        create: createDataFallback,
      });
      /* eslint-enable @typescript-eslint/no-explicit-any */
    }
  }
}

type NewSecondarySpec = {
  id: string;
  name: string;
  description?: string;
  archetypeFocus?: string[];
  category: string;
  powerDraw?: number;
  tags?: string[];
  baseStats?: Record<string, number>;
  tagAffinities?: unknown;
};

async function ensureNewSecondaries() {
  const specs = (newSecondaries as unknown as Array<NewSecondarySpec>);
  const keepIds = specs.map((x) => x.id);
  await prisma.secondarySystem.deleteMany({ where: { id: { notIn: keepIds } } });
  for (const s of specs) {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const updateData: any = {
      name: s.name,
      description: s.description ?? null,
      category: s.category,
      baseStats: s.baseStats ?? {},
      deltaPowerSlots: 0,
      deltaAmmoSlots: 0,
      deltaUtilitySlots: 0,
      powerDraw: s.powerDraw ?? 10,
      tags: s.tags ?? [],
      archetypeFocus: (s.archetypeFocus ?? []) as string[],
      tagAffinities: s.tagAffinities ?? null,
    };
    const createData: any = {
      id: s.id,
      name: s.name,
      description: s.description ?? null,
      category: s.category,
      baseStats: s.baseStats ?? {},
      deltaPowerSlots: 0,
      deltaAmmoSlots: 0,
      deltaUtilitySlots: 0,
      powerDraw: s.powerDraw ?? 10,
      tags: s.tags ?? [],
      archetypeFocus: (s.archetypeFocus ?? []) as string[],
      tagAffinities: s.tagAffinities ?? null,
    };
    await prisma.secondarySystem.upsert({ where: { id: s.id }, update: updateData, create: createData });
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }
}

export async function loadCatalog(): Promise<Catalog> {
  if (typeof window !== "undefined") {
    throw new Error("loadCatalog must be invoked on the server");
  }

  // First, ensure the new primaries/secondaries exist
  await ensureNewPrimaries();
  await ensureNewSecondaries();

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

