import primaries from "@/app/data/primaries.json";
import secondaries from "@/app/data/secondaries.json";
import modules from "@/app/data/modules.json";
import hulls from "@/app/data/hulls.json";
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

export function loadCatalog(): Catalog {
  // Shallow runtime guards
  const prim = uniqueBy(primaries as PrimaryArchetype[]);
  const secs = uniqueBy(secondaries as SecondaryDef[]);
  const hls = uniqueBy(hulls as Hull[]);
  const mods = uniqueBy(modules as ModuleDef[]);

  assert(prim.length > 0, "No primaries loaded");
  assert(secs.length > 0, "No secondaries loaded");
  assert(hls.length > 0, "No hulls loaded");
  assert(mods.length > 0, "No modules loaded");

  // Validate hulls have proper grids
  for (const h of hls) {
    assert(h.grid.slots.length > 0, `Hull ${h.id} has empty grid`);
  }

  for (const m of mods) {
    assert(m.shape.cells.length > 0, `Module ${m.id} has empty shape`);
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

