import primaries from "@/app/data/primaries.json";
import secondaries from "@/app/data/secondaries.json";
import sizes from "@/app/data/ship_sizes.json";
import modules from "@/app/data/modules.json";
import type {
  PrimaryArchetype,
  SecondaryDef,
  ShipSize,
  ModuleDef,
  ModulesById,
  PrimariesById,
  SecondariesById,
  ShipSizesById,
} from "@/types/fitting";

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
  sizes: ShipSize[];
  modules: ModuleDef[];
  modulesById: ModulesById;
  primariesById: PrimariesById;
  secondariesById: SecondariesById;
  shipSizesById: ShipSizesById;
}

export function loadCatalog(): Catalog {
  // Shallow runtime guards
  const prim = uniqueBy(primaries as PrimaryArchetype[]);
  const secs = uniqueBy(secondaries as SecondaryDef[]);
  const sz = uniqueBy(sizes as ShipSize[]);
  const mods = uniqueBy(modules as ModuleDef[]);

  assert(prim.length > 0, "No primaries loaded");
  assert(secs.length > 0, "No secondaries loaded");
  assert(sz.length > 0, "No ship sizes loaded");
  assert(mods.length > 0, "No modules loaded");

  for (const p of prim) {
    const sum = p.baseRatio.P + p.baseRatio.A + p.baseRatio.U;
    assert(Math.abs(sum - 1) < 1e-6, `Primary ${p.id} baseRatio must sum to 1`);
  }

  for (const s of secs) {
    const { dP, dA, dU } = s.delta;
    assert(dP >= -0.4 && dP <= 0.4, `Secondary ${s.id} dP out of bounds`);
    assert(dA >= -0.4 && dA <= 0.4, `Secondary ${s.id} dA out of bounds`);
    assert(dU >= -0.4 && dU <= 0.4, `Secondary ${s.id} dU out of bounds`);
  }

  for (const m of mods) {
    assert(m.shape.cells.length > 0, `Module ${m.id} has empty shape`);
  }

  const modulesById: ModulesById = Object.fromEntries(mods.map((m) => [m.id, m]));
  const primariesById: PrimariesById = Object.fromEntries(prim.map((p) => [p.id, p]));
  const secondariesById: SecondariesById = Object.fromEntries(secs.map((s) => [s.id, s]));
  const shipSizesById: ShipSizesById = Object.fromEntries(sz.map((s) => [s.id, s]));

  return {
    primaries: prim,
    secondaries: secs,
    sizes: sz,
    modules: mods,
    modulesById,
    primariesById,
    secondariesById,
    shipSizesById,
  };
}

