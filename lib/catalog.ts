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
  SlotType,
  BaseSlotType,
  SlotCompatibility,
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
  // DISABLED: No longer seeding ship components
  return;
  /*
  await prisma.$transaction([
    prisma.module.deleteMany(),
    prisma.secondarySystem.deleteMany(),
    prisma.primarySystem.deleteMany(),
    prisma.hull.deleteMany(),
  ]);

  await prisma.hull.createMany({ data: hullSeed as any });
  await prisma.primarySystem.createMany({ data: primarySeed as any });
  await prisma.secondarySystem.createMany({ data: secondarySeed as any });
  await prisma.module.createMany({ data: moduleSeed as any });
  */
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
  // DISABLED: No longer creating primaries
  return;
  /*
  const specs = (newPrimaries as unknown as Array<NewPrimarySpec>);
  const keepIds = specs.map((x) => x.id);

  // Remove any old primaries not in the new spec
  await prisma.primarySystem.deleteMany({ where: { id: { notIn: keepIds } } });

  for (const p of specs) {
    // Attempt write with metadata; if client/schema mismatch, fallback to tagAffinities
    try {
      // eslint-disable @typescript-eslint/no-explicit-any
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
    } catch (err) {
      const message = (err as Error)?.message ?? String(err);
      if (!message.includes("Unknown argument `metadata`")) {
        throw err;
      }
      // Fallback path: encode metadata under tagAffinities
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
    }
  }
  */
}

// -------------------- Hull generator (16 hulls, 2 per archetype) --------------------
type ArchetypeWeights = { P: number; A: number; U: number };
type SizeDims = { rows: number; cols: number };

const ARCH_WEIGHTS: Record<string, ArchetypeWeights> = {
  assault: { P: 0.6, A: 0.25, U: 0.15 },
  artillery: { P: 0.4, A: 0.45, U: 0.15 },
  defender: { P: 0.35, A: 0.15, U: 0.5 },
  bulwark: { P: 0.4, A: 0.1, U: 0.5 },  // Revised to differentiate from support
  support: { P: 0.25, A: 0.1, U: 0.65 }, // Revised for more utility
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
  CU: number,
  hybridRatio: number = 0.15 // Percentage of slots to convert to hybrids
): Array<{ r: number; c: number; type: SlotType; compatibility?: SlotCompatibility }> {
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

  const slots: Array<{ r: number; c: number; type: SlotType; compatibility?: SlotCompatibility }> = [];
  
  // First assign base types
  const baseSlots: Array<{ r: number; c: number; type: BaseSlotType }> = [];
  for (const { r, c } of all) {
    const key = `${r},${c}`;
    let type: BaseSlotType = "Utility";
    if (Pcells.has(key)) type = "Power";
    else if (Acells.has(key)) type = "Ammo";
    else type = "Utility";
    baseSlots.push({ r, c, type });
  }
  
  // Convert some slots to hybrids based on archetype
  const hybridCount = Math.floor(all.length * hybridRatio);
  const hybridIndices = new Set<number>();
  
  // Select slots to convert to hybrids (prefer edge/corner slots)
  const edgeSlots = baseSlots
    .map((s, idx) => ({ ...s, idx, edgeScore: Math.min(s.r, rows - 1 - s.r, s.c, cols - 1 - s.c) }))
    .sort((a, b) => a.edgeScore - b.edgeScore)
    .slice(0, hybridCount);
  
  for (const slot of edgeSlots) {
    hybridIndices.add(slot.idx);
  }
  
  // Build final slots with hybrids
  baseSlots.forEach((slot, idx) => {
    if (hybridIndices.has(idx)) {
      // Determine hybrid type based on archetype and position
      let hybridType: SlotType;
      let compatibility: SlotCompatibility;
      
      if (archetype === "carrier" || archetype === "support") {
        // More universal slots for versatile archetypes
        if (Math.random() < 0.3) {
          hybridType = "Hybrid-PAU";
          compatibility = { accepts: ["Power", "Ammo", "Utility"], bwMultiplier: 1.3 };
        } else {
          hybridType = "Hybrid-PU";
          compatibility = { accepts: ["Power", "Utility"], preferredType: "Utility", bwMultiplier: 1.2 };
        }
      } else if (archetype === "assault" || archetype === "artillery") {
        // Weapon-focused hybrids
        hybridType = "Hybrid-PA";
        compatibility = { accepts: ["Power", "Ammo"], preferredType: "Power", bwMultiplier: 1.2 };
      } else if (archetype === "defender" || archetype === "bulwark") {
        // Defense-focused hybrids
        hybridType = "Hybrid-PU";
        compatibility = { accepts: ["Power", "Utility"], preferredType: "Utility", bwMultiplier: 1.2 };
      } else {
        // Balanced hybrids for other archetypes
        const rand = Math.random();
        if (rand < 0.33) {
          hybridType = "Hybrid-PA";
          compatibility = { accepts: ["Power", "Ammo"], preferredType: slot.type === "Power" ? "Power" : "Ammo", bwMultiplier: 1.2 };
        } else if (rand < 0.66) {
          hybridType = "Hybrid-PU";
          compatibility = { accepts: ["Power", "Utility"], preferredType: slot.type === "Power" ? "Power" : "Utility", bwMultiplier: 1.2 };
        } else {
          hybridType = "Hybrid-AU";
          compatibility = { accepts: ["Ammo", "Utility"], preferredType: slot.type === "Ammo" ? "Ammo" : "Utility", bwMultiplier: 1.2 };
        }
      }
      
      slots.push({ r: slot.r, c: slot.c, type: hybridType, compatibility });
    } else {
      // Regular slot
      slots.push({ r: slot.r, c: slot.c, type: slot.type });
    }
  });
  
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
  // DISABLED: No longer creating hulls
  return [];
  /*
  return [
    // SUPPORT
    { id: "swift_medic_frigate", name: "Swift Medic", sizeId: "Frigate", archetype: "support" },
    { id: "field_station_frigate", name: "Field Station", sizeId: "Frigate", archetype: "support" },
    { id: "combat_medic_destroyer", name: "Combat Medic", sizeId: "Destroyer", archetype: "support" },
    { id: "sanctuary_destroyer", name: "Sanctuary", sizeId: "Destroyer", archetype: "support" },
    { id: "angel_wing_cruiser", name: "Angel Wing", sizeId: "Cruiser", archetype: "support" },
    { id: "haven_cruiser", name: "Haven", sizeId: "Cruiser", archetype: "support" },
    
    // DEFENDER  
    { id: "sentinel_frigate", name: "Sentinel", sizeId: "Frigate", archetype: "defender" },
    { id: "ironclad_frigate", name: "Ironclad", sizeId: "Frigate", archetype: "defender" },
    { id: "guardian_destroyer", name: "Guardian", sizeId: "Destroyer", archetype: "defender" },
    { id: "fortress_destroyer", name: "Fortress", sizeId: "Destroyer", archetype: "defender" },
    { id: "aegis_cruiser", name: "Aegis", sizeId: "Cruiser", archetype: "defender" },
    { id: "citadel_cruiser", name: "Citadel", sizeId: "Cruiser", archetype: "defender" },
    
    // ASSAULT
    { id: "striker_frigate", name: "Striker", sizeId: "Frigate", archetype: "assault" },
    { id: "brawler_frigate", name: "Brawler", sizeId: "Frigate", archetype: "assault" },
    { id: "ravager_destroyer", name: "Ravager", sizeId: "Destroyer", archetype: "assault" },
    { id: "marauder_destroyer", name: "Marauder", sizeId: "Destroyer", archetype: "assault" },
    { id: "devastator_cruiser", name: "Devastator", sizeId: "Cruiser", archetype: "assault" },
    { id: "berserker_cruiser", name: "Berserker", sizeId: "Cruiser", archetype: "assault" },
    
    // ARTILLERY
    { id: "longbow_frigate", name: "Longbow", sizeId: "Frigate", archetype: "artillery" },
    { id: "trebuchet_frigate", name: "Trebuchet", sizeId: "Frigate", archetype: "artillery" },
    { id: "ballista_destroyer", name: "Ballista", sizeId: "Destroyer", archetype: "artillery" },
    { id: "howitzer_destroyer", name: "Howitzer", sizeId: "Destroyer", archetype: "artillery" },
    { id: "raildriver_cruiser", name: "Raildriver", sizeId: "Cruiser", archetype: "artillery" },
    { id: "siege_engine_cruiser", name: "Siege Engine", sizeId: "Cruiser", archetype: "artillery" },
    
    // RECON
    { id: "scout_frigate", name: "Scout", sizeId: "Frigate", archetype: "recon" },
    { id: "watcher_frigate", name: "Watcher", sizeId: "Frigate", archetype: "recon" },
    { id: "pathfinder_destroyer", name: "Pathfinder", sizeId: "Destroyer", archetype: "recon" },
    { id: "sentinel_destroyer", name: "Sentinel", sizeId: "Destroyer", archetype: "recon" },
    { id: "oracle_cruiser", name: "Oracle", sizeId: "Cruiser", archetype: "recon" },
    { id: "overseer_cruiser", name: "Overseer", sizeId: "Cruiser", archetype: "recon" },
    
    // INFILTRATOR
    { id: "ghost_frigate", name: "Ghost", sizeId: "Frigate", archetype: "infiltrator" },
    { id: "phantom_frigate", name: "Phantom", sizeId: "Frigate", archetype: "infiltrator" },
    { id: "specter_destroyer", name: "Specter", sizeId: "Destroyer", archetype: "infiltrator" },
    { id: "wraith_destroyer", name: "Wraith", sizeId: "Destroyer", archetype: "infiltrator" },
    { id: "shadow_cruiser", name: "Shadow", sizeId: "Cruiser", archetype: "infiltrator" },
    { id: "nightfall_cruiser", name: "Nightfall", sizeId: "Cruiser", archetype: "infiltrator" },
    
    // CARRIER
    { id: "hive_frigate", name: "Hive", sizeId: "Frigate", archetype: "carrier" },
    { id: "nest_frigate", name: "Nest", sizeId: "Frigate", archetype: "carrier" },
    { id: "swarm_lord_destroyer", name: "Swarm Lord", sizeId: "Destroyer", archetype: "carrier" },
    { id: "colony_destroyer", name: "Colony", sizeId: "Destroyer", archetype: "carrier" },
    { id: "mothership_cruiser", name: "Mothership", sizeId: "Cruiser", archetype: "carrier" },
    { id: "ark_cruiser", name: "Ark", sizeId: "Cruiser", archetype: "carrier" },
    
    // BULWARK
    { id: "bastion_frigate", name: "Bastion", sizeId: "Frigate", archetype: "bulwark" },
    { id: "rampart_frigate", name: "Rampart", sizeId: "Frigate", archetype: "bulwark" },
    { id: "stronghold_destroyer", name: "Stronghold", sizeId: "Destroyer", archetype: "bulwark" },
    { id: "citadel_destroyer", name: "Citadel", sizeId: "Destroyer", archetype: "bulwark" },
    { id: "fortress_cruiser", name: "Fortress", sizeId: "Cruiser", archetype: "bulwark" },
    { id: "redoubt_cruiser", name: "Redoubt", sizeId: "Cruiser", archetype: "bulwark" },
  ];
  */
}

function getBaseStatsForHull(spec: HullArchetypeSpec): Record<string, number> {
  // Base stats by size
  const sizeBase: Record<string, Record<string, number>> = {
    Frigate: { hull: 700, armor: 150, speed: 110, evasion: 25 },
    Destroyer: { hull: 1100, armor: 300, speed: 85, evasion: 15 },
    Cruiser: { hull: 1500, armor: 400, speed: 70, evasion: 12 },
    Capital: { hull: 2000, armor: 550, speed: 50, evasion: 8 }
  };
  
  // Archetype modifiers
  const archMods: Record<string, Record<string, number>> = {
    support: { hull: -0.1, armor: -0.2, speed: 0.1, evasion: 0.2 },
    defender: { hull: 0.2, armor: 0.4, speed: -0.2, evasion: -0.2 },
    assault: { hull: -0.1, armor: -0.2, speed: 0.2, evasion: 0.2 },
    artillery: { hull: 0, armor: 0, speed: -0.2, evasion: -0.3 },
    recon: { hull: -0.2, armor: -0.3, speed: 0.3, evasion: 0.4 },
    infiltrator: { hull: -0.2, armor: -0.4, speed: 0.2, evasion: 0.3 },
    carrier: { hull: 0, armor: 0, speed: 0, evasion: 0 },
    bulwark: { hull: 0.2, armor: 0.3, speed: -0.3, evasion: -0.4 }
  };
  
  const base = sizeBase[spec.sizeId] || sizeBase.Frigate;
  const mods = archMods[spec.archetype] || {};
  
  // Apply variant modifier based on name patterns
  let variantMod = 0;
  if (spec.name.includes("Swift") || spec.name.includes("Scout") || spec.name.includes("Ghost")) {
    variantMod = -0.15; // Fast variant: less hull/armor, more speed
  } else if (spec.name.includes("Fortress") || spec.name.includes("Citadel") || spec.name.includes("Haven")) {
    variantMod = 0.15; // Tanky variant: more hull/armor, less speed
  }
  
  return {
    hull: Math.round(base.hull * (1 + (mods.hull || 0) + (mods.hull ? variantMod : 0))),
    armor: Math.round(base.armor * (1 + (mods.armor || 0) + (mods.armor ? variantMod : 0))),
    speed: Math.round(base.speed * (1 + (mods.speed || 0) - (mods.speed ? variantMod : 0))),
    evasion: Math.round(base.evasion * (1 + (mods.evasion || 0) - (mods.evasion ? variantMod : 0)))
  };
}

async function ensureNewHulls() {
  // DISABLED: No longer creating hulls
  return;
  /*
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
    const baseStats = getBaseStatsForHull(spec);
    
    // Generate description if not provided
    const description = spec.description || 
      `${spec.archetype.charAt(0).toUpperCase() + spec.archetype.slice(1)}-class ${spec.sizeId.toLowerCase()} optimized for ${
        spec.archetype === 'support' ? 'fleet support and healing' :
        spec.archetype === 'defender' ? 'damage mitigation and protection' :
        spec.archetype === 'assault' ? 'close-range combat' :
        spec.archetype === 'artillery' ? 'long-range bombardment' :
        spec.archetype === 'recon' ? 'information warfare' :
        spec.archetype === 'infiltrator' ? 'stealth and disruption' :
        spec.archetype === 'carrier' ? 'drone operations' :
        spec.archetype === 'bulwark' ? 'area denial and fortification' : 'combat'
      }`;

    // eslint-disable @typescript-eslint/no-explicit-any
    const data: any = {
      id: spec.id,
      name: spec.name,
      description,
      sizeId: spec.sizeId,
      archetype: spec.archetype,
      powerCapacity,
      bandwidthLimit,
      baseStats,
      grid: { rows: dims.rows, cols: dims.cols, slots },
      compatibleTags: [spec.archetype],
    };
    await prisma.hull.upsert({ where: { id: spec.id }, update: data, create: data });
  }
  */
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
  // DISABLED: No longer creating secondaries
  return;
  /*
  const specs = (newSecondaries as unknown as Array<NewSecondarySpec>);
  const keepIds = specs.map((x) => x.id);
  await prisma.secondarySystem.deleteMany({ where: { id: { notIn: keepIds } } });
  for (const s of specs) {
    // eslint-disable @typescript-eslint/no-explicit-any
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
  }
  */
}

export async function loadCatalog(): Promise<Catalog> {
  if (typeof window !== "undefined") {
    throw new Error("loadCatalog must be invoked on the server");
  }

  // DISABLED: No longer auto-creating ship components
  // await ensureNewHulls();
  // await ensureNewPrimaries();
  // await ensureNewSecondaries();

  let [primFromDb, secFromDb, hullFromDb, modFromDb] = await fetchCatalogRows();

  // DISABLED: No longer auto-seeding ship components
  // Only return empty arrays if nothing in DB
  // if (!primFromDb.length && !secFromDb.length && !hullFromDb.length && !modFromDb.length) {
  //   await seedFromJson();
  //   [primFromDb, secFromDb, hullFromDb, modFromDb] = await fetchCatalogRows();
  // }
  
  // If any component is empty, just use empty array
  if (!modFromDb.length) {
    modFromDb = [];
  }
  if (!hullFromDb.length) {
    hullFromDb = [];
  }
  if (!primFromDb.length) {
    primFromDb = [];
  }
  if (!secFromDb.length) {
    secFromDb = [];
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

  // Allow empty catalogs - users will add components via admin
  // assert(prim.length > 0, "No primaries loaded");
  // assert(secs.length > 0, "No secondaries loaded");
  // assert(hls.length > 0, "No hulls loaded");
  // assert(mods.length > 0, "No modules loaded");

  // Skip validation for now - allow incomplete data
  /*
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
  */

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

