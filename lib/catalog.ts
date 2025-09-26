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

// -------------------- Hull generator (16 hulls, 2 per archetype) --------------------
type ArchetypeWeights = { P: number; A: number; U: number };
type SizeDims = { rows: number; cols: number };

const ARCH_WEIGHTS: Record<string, ArchetypeWeights> = {
  assault: { P: 0.6, A: 0.25, U: 0.15 },
  artillery: { P: 0.4, A: 0.45, U: 0.15 },
  defender: { P: 0.35, A: 0.15, U: 0.5 },
  bulwark: { P: 0.3, A: 0.15, U: 0.55 },
  support: { P: 0.3, A: 0.15, U: 0.55 },
  recon: { P: 0.25, A: 0.2, U: 0.55 },
  infiltrator: { P: 0.25, A: 0.35, U: 0.4 },
  carrier: { P: 0.35, A: 0.2, U: 0.45 },
};

const SIZE_DIMS: Record<string, SizeDims> = {
  Frigate: { rows: 3, cols: 3 },
  Destroyer: { rows: 4, cols: 4 },
  Cruiser: { rows: 4, cols: 5 },
  Capital: { rows: 5, cols: 5 },
};

function largestRemainderCounts(T: number, weights: ArchetypeWeights, archetype: string): { CP: number; CA: number; CU: number } {
  const w = weights;
  const exactP = T * w.P;
  const exactA = T * w.A;
  let CP = Math.floor(exactP);
  let CA = Math.floor(exactA);
  let CU = T - CP - CA;
  const remainders: Array<{ key: "P" | "A" | "U"; frac: number }> = [
    { key: "P" as const, frac: exactP - Math.floor(exactP) },
    { key: "A" as const, frac: exactA - Math.floor(exactA) },
    { key: "U" as const, frac: (T * w.U) - Math.floor(T * w.U) },
  ].sort((a, b) => b.frac - a.frac);
  const assigned = CP + CA + CU;
  let remaining = T - assigned;
  let idx = 0;
  while (remaining > 0 && idx < remainders.length) {
    const k = remainders[idx].key;
    if (k === "P") CP += 1; else if (k === "A") CA += 1; else CU += 1;
    remaining -= 1;
    idx += 1;
  }
  // Floors and adjustments
  if (T >= 5) {
    if (CP === 0) { CP += 1; if (CA >= CU) CA -= 1; else CU -= 1; }
    if (CA === 0) { CA += 1; if (CP >= CU) CP -= 1; else CU -= 1; }
    if (CU === 0) { CU += 1; if (CP >= CA) CP -= 1; else CA -= 1; }
  }
  if (archetype === "artillery") {
    if (CA < 4 && T >= 12) {
      const need = 4 - CA;
      for (let i = 0; i < need; i++) { if (CU > 1) { CA += 1; CU -= 1; } }
    }
  }
  return { CP, CA, CU };
}

function coordList(rows: number, cols: number): Array<{ r: number; c: number }> {
  const out: Array<{ r: number; c: number }> = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) out.push({ r, c });
  }
  return out;
}

function centerScore(r: number, c: number, rows: number, cols: number): number {
  const cr = (rows - 1) / 2;
  const cc = (cols - 1) / 2;
  const dr = Math.abs(r - cr);
  const dc = Math.abs(c - cc);
  return -Math.sqrt(dr * dr + dc * dc);
}

function perimeterScore(r: number, c: number, rows: number, cols: number): number {
  const dTop = r;
  const dLeft = c;
  const dBottom = rows - 1 - r;
  const dRight = cols - 1 - c;
  const d = Math.min(dTop, dLeft, dBottom, dRight);
  return -d; // higher at edges
}

function crossScore(r: number, c: number, rows: number, cols: number): number {
  const cr = (rows - 1) / 2;
  const cc = (cols - 1) / 2;
  return -Math.min(Math.abs(r - cr), Math.abs(c - cc));
}

function frontScore(r: number): number {
  return -r; // favor top/front
}

function backScore(r: number, rows: number): number {
  return -(rows - 1 - r); // favor bottom/rear
}

function columnBandScore(c: number, cols: number): number {
  const t1 = cols / 3;
  const t2 = (2 * cols) / 3;
  const d = Math.min(Math.abs(c - t1), Math.abs(c - t2));
  return -d;
}

function buildSlotsForArchetype(
  archetype: string,
  rows: number,
  cols: number,
  CP: number,
  CA: number,
  CU: number
): Array<{ r: number; c: number; type: "Power" | "Ammo" | "Utility" }> {
  const all = coordList(rows, cols);
  function scoreP(rc: { r: number; c: number }): number {
    switch (archetype) {
      case "assault": return centerScore(rc.r, rc.c, rows, cols) + crossScore(rc.r, rc.c, rows, cols) * 0.25;
      case "artillery": return centerScore(rc.r, rc.c, rows, cols) + (-(Math.abs(rc.r - (rows - 1) / 2))) * 0.15;
      case "defender": return centerScore(rc.r, rc.c, rows, cols) + crossScore(rc.r, rc.c, rows, cols) * 0.2;
      case "bulwark": return crossScore(rc.r, rc.c, rows, cols) + centerScore(rc.r, rc.c, rows, cols) * 0.2;
      case "support": return centerScore(rc.r, rc.c, rows, cols);
      case "recon": return columnBandScore(rc.c, cols) * 0.8 + centerScore(rc.r, rc.c, rows, cols) * 0.2;
      case "infiltrator": return centerScore(rc.r, rc.c, rows, cols) * 0.2 + perimeterScore(rc.r, rc.c, rows, cols) * 0.3;
      case "carrier": return columnBandScore(rc.c, cols) + centerScore(rc.r, rc.c, rows, cols) * 0.3;
      default: return centerScore(rc.r, rc.c, rows, cols);
    }
  }
  function scoreA(rc: { r: number; c: number }): number {
    switch (archetype) {
      case "assault": return frontScore(rc.r) + perimeterScore(rc.r, rc.c, rows, cols) * 0.2;
      case "artillery": return perimeterScore(rc.r, rc.c, rows, cols) + backScore(rc.r, rows) * 0.3;
      case "defender": return perimeterScore(rc.r, rc.c, rows, cols) * 0.3 + frontScore(rc.r) * 0.1;
      case "bulwark": return perimeterScore(rc.r, rc.c, rows, cols) * 0.3 + backScore(rc.r, rows) * 0.2;
      case "support": return perimeterScore(rc.r, rc.c, rows, cols) * 0.2;
      case "recon": return perimeterScore(rc.r, rc.c, rows, cols) * 0.25 + frontScore(rc.r) * 0.1;
      case "infiltrator": return perimeterScore(rc.r, rc.c, rows, cols) * 0.35;
      case "carrier": return frontScore(rc.r) * 0.2 + perimeterScore(rc.r, rc.c, rows, cols) * 0.2;
      default: return perimeterScore(rc.r, rc.c, rows, cols) * 0.2;
    }
  }
  function scoreU(rc: { r: number; c: number }): number {
    switch (archetype) {
      case "assault": return perimeterScore(rc.r, rc.c, rows, cols);
      case "artillery": return backScore(rc.r, rows) + perimeterScore(rc.r, rc.c, rows, cols) * 0.2;
      case "defender": return perimeterScore(rc.r, rc.c, rows, cols) * 1.2;
      case "bulwark": return perimeterScore(rc.r, rc.c, rows, cols) * 1.3;
      case "support": return perimeterScore(rc.r, rc.c, rows, cols) * 0.8 + centerScore(rc.r, rc.c, rows, cols) * 0.2;
      case "recon": return columnBandScore(rc.c, cols) * 0.6 + perimeterScore(rc.r, rc.c, rows, cols) * 0.4;
      case "infiltrator": return perimeterScore(rc.r, rc.c, rows, cols) * 0.9;
      case "carrier": return perimeterScore(rc.r, rc.c, rows, cols) * 1.1;
      default: return perimeterScore(rc.r, rc.c, rows, cols);
    }
  }
  const pickTop = (
    list: Array<{ r: number; c: number }>,
    scorer: (rc: { r: number; c: number }) => number,
    count: number
  ) => list
    .slice()
    .sort((a, b) => scorer(b) - scorer(a))
    .slice(0, count);

  const Pcells = new Set(pickTop(all, scoreP, CP).map((x) => `${x.r},${x.c}`));
  const rem1 = all.filter((rc) => !Pcells.has(`${rc.r},${rc.c}`));
  const Acells = new Set(pickTop(rem1, scoreA, CA).map((x) => `${x.r},${x.c}`));
  const rem2 = rem1.filter((rc) => !Acells.has(`${rc.r},${rc.c}`));
  const Ucells = new Set(pickTop(rem2, scoreU, CU).map((x) => `${x.r},${x.c}`));

  const slots: Array<{ r: number; c: number; type: "Power" | "Ammo" | "Utility" }> = [];
  for (const { r, c } of all) {
    const key = `${r},${c}`;
    let type: "Power" | "Ammo" | "Utility" = "Utility";
    if (Pcells.has(key)) type = "Power";
    else if (Acells.has(key)) type = "Ammo";
    else type = "Utility";
    slots.push({ r, c, type });
  }
  return slots;
}

function computeBudgets(rows: number, cols: number, CP: number, CA: number, CU: number): { powerCapacity: number; bandwidthLimit: number } {
  const T = rows * cols;
  const PC = Math.round(3 * T + 4 * CP);
  const BW = Math.round(1 * T + 1.5 * CP + 1.2 * CA + 1.0 * CU);
  return { powerCapacity: PC, bandwidthLimit: BW };
}

type HullArchetypeSpec = { id: string; name: string; sizeId: string; archetype: string; description?: string };

function plannedHulls(): HullArchetypeSpec[] {
  return [
    { id: "assault_frigate", name: "Assault Frigate", sizeId: "Frigate", archetype: "assault" },
    { id: "assault_cruiser", name: "Assault Cruiser", sizeId: "Cruiser", archetype: "assault" },
    { id: "artillery_destroyer", name: "Artillery Destroyer", sizeId: "Destroyer", archetype: "artillery" },
    { id: "artillery_capital", name: "Artillery Dreadnought", sizeId: "Capital", archetype: "artillery" },
    { id: "defender_frigate", name: "Defender Frigate", sizeId: "Frigate", archetype: "defender" },
    { id: "defender_cruiser", name: "Defender Cruiser", sizeId: "Cruiser", archetype: "defender" },
    { id: "bulwark_cruiser", name: "Bulwark Cruiser", sizeId: "Cruiser", archetype: "bulwark" },
    { id: "bulwark_capital", name: "Bulwark Bastion", sizeId: "Capital", archetype: "bulwark" },
    { id: "support_frigate", name: "Support Frigate", sizeId: "Frigate", archetype: "support" },
    { id: "support_cruiser", name: "Support Cruiser", sizeId: "Cruiser", archetype: "support" },
    { id: "recon_frigate", name: "Recon Frigate", sizeId: "Frigate", archetype: "recon" },
    { id: "recon_destroyer", name: "Recon Destroyer", sizeId: "Destroyer", archetype: "recon" },
    { id: "infiltrator_frigate", name: "Infiltrator Corvette", sizeId: "Frigate", archetype: "infiltrator" },
    { id: "infiltrator_destroyer", name: "Infiltrator Destroyer", sizeId: "Destroyer", archetype: "infiltrator" },
    { id: "carrier_cruiser", name: "Light Carrier", sizeId: "Cruiser", archetype: "carrier" },
    { id: "carrier_capital", name: "Fleet Carrier", sizeId: "Capital", archetype: "carrier" },
  ];
}

async function ensureNewHulls() {
  const specs = plannedHulls();
  const keepIds = specs.map((s) => s.id);
  await prisma.hull.deleteMany({ where: { id: { notIn: keepIds } } });

  for (const spec of specs) {
    const dims = SIZE_DIMS[spec.sizeId] || SIZE_DIMS.Frigate;
    let weights = ARCH_WEIGHTS[spec.archetype] || ARCH_WEIGHTS.assault;
    // Size scaling tweaks
    if (spec.sizeId === "Cruiser" || spec.sizeId === "Capital") {
      if (["defender", "bulwark", "support"].includes(spec.archetype)) {
        weights = { P: weights.P, A: Math.max(0, weights.A - 0.05), U: Math.min(1, weights.U + 0.05) };
      }
      if (spec.archetype === "artillery") {
        weights = { P: weights.P, A: Math.min(1, weights.A + 0.05), U: Math.max(0, weights.U - 0.05) };
      }
      const total = weights.P + weights.A + weights.U;
      weights = { P: weights.P / total, A: weights.A / total, U: weights.U / total };
    }

    const T = dims.rows * dims.cols;
    const { CP, CA, CU } = largestRemainderCounts(T, weights, spec.archetype);
    const slots = buildSlotsForArchetype(spec.archetype, dims.rows, dims.cols, CP, CA, CU);
    const { powerCapacity, bandwidthLimit } = computeBudgets(dims.rows, dims.cols, CP, CA, CU);

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const data: any = {
      id: spec.id,
      name: spec.name,
      description: spec.description ?? null,
      sizeId: spec.sizeId,
      archetype: spec.archetype,
      powerCapacity,
      bandwidthLimit,
      grid: { rows: dims.rows, cols: dims.cols, slots },
      compatibleTags: [spec.archetype],
    };
    await prisma.hull.upsert({ where: { id: spec.id }, update: data, create: data });
    /* eslint-enable @typescript-eslint/no-explicit-any */
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
  await ensureNewHulls();
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
  // Do NOT pre-clone into variants here; keep a single base record per module
  const mods = uniqueBy(
    modFromDb.map((m) =>
      applyModuleOverrides({
        ...m,
        description: m.description || undefined,
        stats: m.stats as ModuleDef["stats"],
        shape: m.shape as unknown as ModuleDef["shape"],
      } as unknown as ModuleDef)
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

