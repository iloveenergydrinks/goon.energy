import type { Hull, ModuleDef, ShipSize } from "@/types/fitting";

type VariantDefinition = {
  tier: string;
  minHullSize: ShipSize["id"];
  slot: ModuleDef["slot"];
  shape: ModuleDef["shape"];
  baseBW: number;
  stats: ModuleDef["stats"];
};

interface ModuleFamily {
  familyId: string;
  familyName?: string;
  variants: VariantDefinition[];
}

const FAMILIES: Record<string, ModuleFamily> = {
  flux_support: {
    familyId: "flux_support",
    familyName: "Flux Support Matrix",
    variants: [
      {
        tier: "frigate",
        minHullSize: "Frigate",
        slot: "Utility",
        shape: {
          id: "FluxSupport_S",
          cells: [{ dr: 0, dc: 0 }],
          rotations: [0, 90, 180, 270],
          sizeClass: "S",
        },
        baseBW: 7,
        stats: { powerGen: 10, capBuffer: 8, repairRate: 4 },
      },
      {
        tier: "destroyer",
        minHullSize: "Destroyer",
        slot: "Utility",
        shape: {
          id: "FluxSupport_M",
          cells: [
            { dr: 0, dc: 0 },
            { dr: 0, dc: 1 },
          ],
          rotations: [0, 90],
          sizeClass: "M",
        },
        baseBW: 11,
        stats: { powerGen: 14, capBuffer: 12, repairRate: 6 },
      },
      {
        tier: "cruiser",
        minHullSize: "Cruiser",
        slot: "Utility",
        shape: {
          id: "FluxSupport_L",
          cells: [
            { dr: 0, dc: 0 },
            { dr: 0, dc: 1 },
            { dr: 1, dc: 0 },
            { dr: 1, dc: 1 },
          ],
          rotations: [0],
          sizeClass: "L",
        },
        baseBW: 17,
        stats: { powerGen: 22, capBuffer: 18, repairRate: 8 },
      },
      {
        tier: "capital",
        minHullSize: "Capital",
        slot: "Utility",
        shape: {
          id: "FluxSupport_XL",
          cells: [
            { dr: 0, dc: 0 },
            { dr: 0, dc: 1 },
            { dr: 0, dc: 2 },
            { dr: 1, dc: 0 },
            { dr: 1, dc: 1 },
            { dr: 1, dc: 2 },
          ],
          rotations: [0],
          sizeClass: "L",
        },
        baseBW: 24,
        stats: { powerGen: 30, capBuffer: 24, repairRate: 12 },
      },
    ],
  },
  energy_redistributor: {
    familyId: "energy_redistributor",
    familyName: "Energy Redistributor",
    variants: [
      {
        tier: "frigate",
        minHullSize: "Frigate",
        slot: "Power",
        shape: {
          id: "EnergyRedist_S",
          cells: [
            { dr: 0, dc: 0 },
          ],
          rotations: [0, 90, 180, 270],
          sizeClass: "S",
        },
        baseBW: 8,
        stats: { powerGen: 10, rofBonus: 2 },
      },
      {
        tier: "destroyer",
        minHullSize: "Destroyer",
        slot: "Power",
        shape: {
          id: "EnergyRedist_M",
          cells: [
            { dr: 0, dc: 0 },
            { dr: 0, dc: 1 },
          ],
          rotations: [0, 90],
          sizeClass: "M",
        },
        baseBW: 12,
        stats: { powerGen: 16, rofBonus: 3 },
      },
      {
        tier: "cruiser",
        minHullSize: "Cruiser",
        slot: "Power",
        shape: {
          id: "EnergyRedist_L",
          cells: [
            { dr: 0, dc: 0 },
            { dr: 0, dc: 1 },
            { dr: 1, dc: 0 },
          ],
          rotations: [0, 90, 180, 270],
          sizeClass: "M",
        },
        baseBW: 17,
        stats: { powerGen: 24, rofBonus: 4 },
      },
      {
        tier: "capital",
        minHullSize: "Capital",
        slot: "Power",
        shape: {
          id: "EnergyRedist_XL",
          cells: [
            { dr: 0, dc: 0 },
            { dr: 0, dc: 1 },
            { dr: 0, dc: 2 },
            { dr: 1, dc: 0 },
            { dr: 1, dc: 1 },
            { dr: 1, dc: 2 },
          ],
          rotations: [0],
          sizeClass: "L",
        },
        baseBW: 22,
        stats: { powerGen: 32, rofBonus: 5 },
      },
    ],
  },
  surge_protector: {
    familyId: "surge_protector",
    familyName: "Surge Protector Array",
    variants: [
      {
        tier: "frigate",
        minHullSize: "Frigate",
        slot: "Power",
        shape: {
          id: "SurgeS",
          cells: [
            { dr: 0, dc: 0 },
          ],
          rotations: [0, 90, 180, 270],
          sizeClass: "S",
        },
        baseBW: 8,
        stats: { capBuffer: 10, repairRate: 1 },
      },
      {
        tier: "destroyer",
        minHullSize: "Destroyer",
        slot: "Power",
        shape: {
          id: "SurgeM",
          cells: [
            { dr: 0, dc: 0 },
            { dr: 0, dc: 1 },
          ],
          rotations: [0, 90],
          sizeClass: "M",
        },
        baseBW: 13,
        stats: { capBuffer: 16, repairRate: 2 },
      },
      {
        tier: "cruiser",
        minHullSize: "Cruiser",
        slot: "Power",
        shape: {
          id: "SurgeL",
          cells: [
            { dr: 0, dc: 0 },
            { dr: 0, dc: 1 },
            { dr: 1, dc: 0 },
            { dr: 1, dc: 1 },
          ],
          rotations: [0],
          sizeClass: "L",
        },
        baseBW: 18,
        stats: { capBuffer: 24, repairRate: 3 },
      },
      {
        tier: "capital",
        minHullSize: "Capital",
        slot: "Power",
        shape: {
          id: "SurgeXL",
          cells: [
            { dr: 0, dc: 0 },
            { dr: 0, dc: 1 },
            { dr: 1, dc: 0 },
            { dr: 1, dc: 1 },
            { dr: 2, dc: 0 },
            { dr: 2, dc: 1 },
          ],
          rotations: [0],
          sizeClass: "L",
        },
        baseBW: 24,
        stats: { capBuffer: 32, repairRate: 4 },
      },
    ],
  },
  aux_reactor: {
    familyId: "aux_reactor",
    familyName: "Auxiliary Reactor Node",
    variants: [
      {
        tier: "frigate",
        minHullSize: "Frigate",
        slot: "Power",
        shape: {
          id: "AuxReactor_S",
          cells: [
            { dr: 0, dc: 0 },
          ],
          rotations: [0, 90, 180, 270],
          sizeClass: "S",
        },
        baseBW: 9,
        stats: { powerGen: 16 },
      },
      {
        tier: "destroyer",
        minHullSize: "Destroyer",
        slot: "Power",
        shape: {
          id: "AuxReactor_M",
          cells: [
            { dr: 0, dc: 0 },
            { dr: 1, dc: 0 },
          ],
          rotations: [0, 90],
          sizeClass: "M",
        },
        baseBW: 13,
        stats: { powerGen: 22 },
      },
      {
        tier: "cruiser",
        minHullSize: "Cruiser",
        slot: "Power",
        shape: {
          id: "AuxReactor_L",
          cells: [
            { dr: 0, dc: 0 },
            { dr: 0, dc: 1 },
            { dr: 1, dc: 0 },
            { dr: 1, dc: 1 },
          ],
          rotations: [0],
          sizeClass: "L",
        },
        baseBW: 18,
        stats: { powerGen: 30 },
      },
      {
        tier: "capital",
        minHullSize: "Capital",
        slot: "Power",
        shape: {
          id: "AuxReactor_XL",
          cells: [
            { dr: 0, dc: 0 },
            { dr: 0, dc: 1 },
            { dr: 0, dc: 2 },
            { dr: 1, dc: 0 },
            { dr: 1, dc: 1 },
            { dr: 1, dc: 2 },
          ],
          rotations: [0],
          sizeClass: "L",
        },
        baseBW: 24,
        stats: { powerGen: 38 },
      },
    ],
  },
};

const HULL_ORDER: ShipSize["id"][] = ["Frigate", "Destroyer", "Cruiser", "Capital"];

function hullSizeIndex(size?: ShipSize["id"]): number {
  if (!size) return 0;
  const idx = HULL_ORDER.indexOf(size);
  return idx >= 0 ? idx : 0;
}

function cloneModule(base: ModuleDef, overrides: Partial<ModuleDef>): ModuleDef {
  return {
    ...base,
    ...overrides,
    stats: { ...base.stats, ...overrides.stats },
    shape: overrides.shape ?? base.shape,
  };
}

export function resolveModuleVariants(modules: ModuleDef[]): ModuleDef[] {
  const resolved: ModuleDef[] = [];

  for (const def of modules) {
    const familyId = def.familyId ?? def.id;
    const family = FAMILIES[familyId];

    if (!family) {
      resolved.push(def);
      continue;
    }

    for (const variant of family.variants) {
      const variantId = `${def.id}::${variant.tier}`;
      resolved.push(
        cloneModule(def, {
          id: variantId,
          familyId: family.familyId,
          familyName: family.familyName ?? def.familyName,
          variantTier: variant.tier,
          minHullSize: variant.minHullSize,
          slot: variant.slot,
          shape: variant.shape,
          baseBW: variant.baseBW,
          stats: {
            ...def.stats,
            ...variant.stats,
          },
        })
      );
    }
  }

  return resolved;
}

export function selectVariantForHull(module: ModuleDef, hull: Hull | undefined): ModuleDef {
  if (!module.familyId || !module.variantTier || !hull?.sizeId) {
    return module;
  }

  const family = FAMILIES[module.familyId];
  if (!family) return module;

  const hullIdx = hullSizeIndex(hull.sizeId);
  const bestVariant = family.variants
    .filter((variant) => hullSizeIndex(variant.minHullSize) <= hullIdx)
    .sort((a, b) => hullSizeIndex(b.minHullSize) - hullSizeIndex(a.minHullSize))[0];

  if (!bestVariant) return module;

  return cloneModule(module, {
    slot: bestVariant.slot,
    shape: bestVariant.shape,
    baseBW: bestVariant.baseBW,
    stats: {
      ...module.stats,
      ...bestVariant.stats,
    },
    variantTier: bestVariant.tier,
  });
}

