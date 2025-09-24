import type {
  ArchetypeBias,
  ArchetypeId,
  Hull,
  ModuleDef,
  PrimaryArchetype,
  SecondaryDef,
  SlotType,
  TagModifier,
} from "@/types/fitting";

interface HullOverride {
  archetype: ArchetypeId;
  mismatchTolerance?: number;
  slotBias?: Partial<Record<SlotType, number>>;
  tagAffinities?: TagModifier[];
  tagPenalties?: TagModifier[];
  addCompatibleTags?: string[];
  addIncompatibleTags?: string[];
}

interface PrimaryOverride {
  archetypeFocus?: ArchetypeId | string;
  tagAffinities?: TagModifier[];
}

interface SecondaryOverride {
  archetypeFocus?: ArchetypeId | string;
  tagAffinities?: TagModifier[];
}

interface ModuleOverride {
  tags?: string[];
  archetypeBias?: ArchetypeBias[];
  tagAffinities?: TagModifier[];
  familyId?: string;
  familyName?: string;
}

const HULL_OVERRIDES: Record<string, HullOverride> = {
  kestrel: {
    archetype: "recon",
    mismatchTolerance: 0.25,
    slotBias: {
      Power: 1,
      Ammo: 0.9,
      Utility: 1.25,
    },
    tagAffinities: [
      {
        tag: "recon",
        bwMultiplier: 0.9,
        statBonuses: {
          evasion: 4,
          tracking: 3,
        },
        mismatchAdjustment: 0.05,
      },
      {
        tag: "support",
        bwMultiplier: 0.94,
        statBonuses: {
          sensorStrength: 8,
        },
      },
    ],
    tagPenalties: [
      {
        tag: "bulwark",
        bwMultiplier: 1.18,
        mismatchAdjustment: -0.05,
      },
      {
        tag: "heavy",
        bwMultiplier: 1.12,
      },
    ],
    addCompatibleTags: ["recon", "support", "precision"],
  },
  vindicator: {
    archetype: "assault",
    mismatchTolerance: 0.12,
    slotBias: {
      Power: 1.25,
      Ammo: 1.1,
      Utility: 0.9,
    },
    tagAffinities: [
      {
        tag: "assault",
        bwMultiplier: 0.9,
        statBonuses: {
          damage: 6,
          mobility: 3,
        },
      },
      {
        tag: "defender",
        bwMultiplier: 0.95,
        statBonuses: {
          armor: 30,
        },
      },
    ],
    tagPenalties: [
      {
        tag: "ultra-long-range",
        bwMultiplier: 1.18,
      },
    ],
    addCompatibleTags: ["assault", "mobility"],
  },
  basilisk: {
    archetype: "artillery",
    mismatchTolerance: 0.08,
    slotBias: {
      Power: 1.15,
      Ammo: 1.3,
      Utility: 0.85,
    },
    tagAffinities: [
      {
        tag: "artillery",
        bwMultiplier: 0.88,
        statBonuses: {
          range: 20,
        },
      },
      {
        tag: "precision",
        bwMultiplier: 0.93,
        statBonuses: {
          tracking: 6,
        },
      },
    ],
    tagPenalties: [
      {
        tag: "close-combat",
        bwMultiplier: 1.2,
        mismatchAdjustment: -0.05,
      },
      {
        tag: "mobility",
        bwMultiplier: 1.1,
      },
    ],
    addCompatibleTags: ["artillery", "precision", "siege"],
  },
  aegis: {
    archetype: "bulwark",
    mismatchTolerance: 0.06,
    slotBias: {
      Power: 1.3,
      Ammo: 1.05,
      Utility: 1.1,
    },
    tagAffinities: [
      {
        tag: "bulwark",
        bwMultiplier: 0.9,
        statBonuses: {
          armor: 40,
          hull: 120,
        },
      },
      {
        tag: "defender",
        bwMultiplier: 0.94,
        statBonuses: {
          shieldStrength: 40,
        },
      },
    ],
    tagPenalties: [
      {
        tag: "agile",
        bwMultiplier: 1.15,
        mismatchAdjustment: -0.04,
      },
      {
        tag: "mobility",
        bwMultiplier: 1.1,
      },
    ],
    addCompatibleTags: ["bulwark", "defender", "area-denial"],
  },
  harbinger: {
    archetype: "carrier",
    mismatchTolerance: 0.18,
    slotBias: {
      Power: 1,
      Ammo: 1.1,
      Utility: 1.35,
    },
    tagAffinities: [
      {
        tag: "carrier",
        bwMultiplier: 0.88,
        statBonuses: {
          droneCapacity: 2,
          droneControl: 1,
        },
        mismatchAdjustment: 0.04,
      },
      {
        tag: "support",
        bwMultiplier: 0.94,
        statBonuses: {
          repairRate: 10,
        },
      },
      {
        tag: "drone",
        bwMultiplier: 0.9,
        statBonuses: {
          droneAI: 8,
        },
      },
    ],
    tagPenalties: [
      {
        tag: "siege",
        bwMultiplier: 1.16,
      },
    ],
    addCompatibleTags: ["carrier", "support", "drone"],
  },
  phantom: {
    archetype: "infiltrator",
    mismatchTolerance: 0.22,
    slotBias: {
      Power: 0.95,
      Ammo: 0.85,
      Utility: 1.35,
    },
    tagAffinities: [
      {
        tag: "infiltrator",
        bwMultiplier: 0.88,
        statBonuses: {
          ecm: 10,
          evasion: 5,
        },
        mismatchAdjustment: 0.06,
      },
      {
        tag: "stealth",
        bwMultiplier: 0.92,
        statBonuses: {
          lockStrength: -10,
        },
      },
    ],
    tagPenalties: [
      {
        tag: "heavy",
        bwMultiplier: 1.14,
      },
      {
        tag: "siege",
        bwMultiplier: 1.16,
      },
    ],
    addCompatibleTags: ["infiltrator", "stealth", "ecm"],
  },
  tempest: {
    archetype: "assault",
    mismatchTolerance: 0.1,
    slotBias: {
      Power: 1.3,
      Ammo: 1.15,
      Utility: 0.95,
    },
    tagAffinities: [
      {
        tag: "assault",
        bwMultiplier: 0.88,
        statBonuses: {
          damage: 8,
          rofBonus: 5,
        },
      },
      {
        tag: "area-effect",
        bwMultiplier: 0.93,
        statBonuses: {
          arcBonus: 6,
        },
      },
    ],
    tagPenalties: [
      {
        tag: "information",
        bwMultiplier: 1.12,
      },
      {
        tag: "passive",
        bwMultiplier: 1.1,
      },
    ],
    addCompatibleTags: ["assault", "area-effect", "heavy"],
  },
};

const PRIMARY_OVERRIDES: Record<string, PrimaryOverride> = {
  railgun: {
    archetypeFocus: "artillery",
    tagAffinities: [
      {
        tag: "artillery",
        bwMultiplier: 0.92,
        statBonuses: {
          range: 10,
        },
      },
      {
        tag: "precision",
        bwMultiplier: 0.94,
        statBonuses: {
          tracking: 4,
        },
      },
    ],
  },
  plasma: {
    archetypeFocus: "assault",
    tagAffinities: [
      {
        tag: "assault",
        bwMultiplier: 0.9,
        statBonuses: {
          damage: 8,
        },
      },
      {
        tag: "area-effect",
        bwMultiplier: 0.94,
        statBonuses: {
          arcBonus: 8,
        },
      },
    ],
  },
  missiles: {
    archetypeFocus: "recon",
    tagAffinities: [
      {
        tag: "recon",
        bwMultiplier: 0.92,
        statBonuses: {
          tracking: 5,
        },
      },
      {
        tag: "support",
        bwMultiplier: 0.95,
        statBonuses: {
          lockRange: 10,
        },
      },
    ],
  },
  repair: {
    archetypeFocus: "support",
    tagAffinities: [
      {
        tag: "support",
        bwMultiplier: 0.9,
        statBonuses: {
          repairRate: 12,
        },
      },
      {
        tag: "carrier",
        bwMultiplier: 0.94,
        statBonuses: {
          droneRepair: 10,
        },
      },
    ],
  },
  emp: {
    archetypeFocus: "infiltrator",
    tagAffinities: [
      {
        tag: "infiltrator",
        bwMultiplier: 0.88,
        statBonuses: {
          ecm: 10,
        },
      },
      {
        tag: "tactical",
        bwMultiplier: 0.94,
        statBonuses: {
          lockStrength: -12,
        },
      },
    ],
  },
  scanner: {
    archetypeFocus: "support",
    tagAffinities: [
      {
        tag: "support",
        bwMultiplier: 0.92,
        statBonuses: {
          sensorStrength: 12,
        },
      },
      {
        tag: "recon",
        bwMultiplier: 0.92,
        statBonuses: {
          range: 10,
        },
      },
    ],
  },
  laser: {
    archetypeFocus: "assault",
    tagAffinities: [
      {
        tag: "assault",
        bwMultiplier: 0.92,
        statBonuses: {
          damage: 6,
        },
      },
      {
        tag: "defender",
        bwMultiplier: 0.95,
        statBonuses: {
          armor: 25,
        },
      },
    ],
  },
  flak: {
    archetypeFocus: "defender",
    tagAffinities: [
      {
        tag: "defender",
        bwMultiplier: 0.9,
        statBonuses: {
          pointDefense: 12,
        },
      },
      {
        tag: "support",
        bwMultiplier: 0.95,
        statBonuses: {
          tracking: 4,
        },
      },
    ],
  },
  siege: {
    archetypeFocus: "artillery",
    tagAffinities: [
      {
        tag: "artillery",
        bwMultiplier: 0.88,
        statBonuses: {
          damage: 15,
          range: 18,
        },
      },
      {
        tag: "bulwark",
        bwMultiplier: 0.94,
        statBonuses: {
          penetration: 10,
        },
      },
    ],
  },
  shield: {
    archetypeFocus: "defender",
    tagAffinities: [
      {
        tag: "defender",
        bwMultiplier: 0.9,
        statBonuses: {
          shieldStrength: 25,
        },
      },
      {
        tag: "support",
        bwMultiplier: 0.95,
        statBonuses: {
          repairRate: 6,
        },
      },
    ],
  },
  recharge: {
    archetypeFocus: "support",
    tagAffinities: [
      {
        tag: "support",
        bwMultiplier: 0.9,
        statBonuses: {
          repairRate: 10,
        },
      },
      {
        tag: "carrier",
        bwMultiplier: 0.94,
        statBonuses: {
          droneRepair: 8,
        },
      },
    ],
  },
  turrets: {
    archetypeFocus: "carrier",
    tagAffinities: [
      {
        tag: "carrier",
        bwMultiplier: 0.92,
        statBonuses: {
          droneCapacity: 2,
        },
      },
      {
        tag: "bulwark",
        bwMultiplier: 0.95,
        statBonuses: {
          areaDenial: 10,
        },
      },
    ],
  },
};

const SECONDARY_OVERRIDES: Record<string, SecondaryOverride> = {
  ram_spikes: {
    archetypeFocus: "assault",
    tagAffinities: [
      {
        tag: "assault",
        bwMultiplier: 0.9,
        statBonuses: {
          penetration: 10,
        },
      },
    ],
  },
  boarding_pods: {
    archetypeFocus: "assault",
    tagAffinities: [
      {
        tag: "infiltrator",
        bwMultiplier: 0.92,
        statBonuses: {
          boardingStrength: 10,
        },
      },
    ],
  },
  hull_peeler: {
    archetypeFocus: "artillery",
    tagAffinities: [
      {
        tag: "artillery",
        bwMultiplier: 0.94,
        statBonuses: {
          armorShred: 10,
        },
      },
    ],
  },
  molten_slag: {
    archetypeFocus: "assault",
    tagAffinities: [
      {
        tag: "assault",
        bwMultiplier: 0.92,
        statBonuses: {
          dotDamage: 5,
        },
      },
    ],
  },
  magazine_disruptor: {
    archetypeFocus: "assault",
    tagAffinities: [
      {
        tag: "infiltrator",
        bwMultiplier: 0.9,
        statBonuses: {
          critChance: 8,
        },
      },
    ],
  },
  tow_harpoons: {
    archetypeFocus: "defender",
    tagAffinities: [
      {
        tag: "support",
        bwMultiplier: 0.95,
        statBonuses: {
          pullStrength: 6,
        },
      },
    ],
  },
  grav_scalers: {
    archetypeFocus: "defender",
    tagAffinities: [
      {
        tag: "defender",
        bwMultiplier: 0.94,
        statBonuses: {
          disruptionStrength: 8,
        },
      },
    ],
  },
  lightwell_array: {
    archetypeFocus: "defender",
    tagAffinities: [
      {
        tag: "recon",
        bwMultiplier: 0.9,
        statBonuses: {
          enemyAccuracy: -5,
        },
      },
    ],
  },
  sensor_ghost: {
    archetypeFocus: "infiltrator",
    tagAffinities: [
      {
        tag: "infiltrator",
        bwMultiplier: 0.88,
        statBonuses: {
          evasion: 5,
        },
      },
    ],
  },
  beacon_lashers: {
    archetypeFocus: "recon",
    tagAffinities: [
      {
        tag: "recon",
        bwMultiplier: 0.92,
        statBonuses: {
          trackingBonus: 6,
        },
      },
    ],
  },
  shrapnel_dispersers: {
    archetypeFocus: "defender",
    tagAffinities: [
      {
        tag: "defender",
        bwMultiplier: 0.92,
        statBonuses: {
          pointDefense: 10,
        },
      },
    ],
  },
  hull_cooling: {
    archetypeFocus: "defender",
    tagAffinities: [
      {
        tag: "assault",
        bwMultiplier: 0.94,
        statBonuses: {
          rofBonus: 5,
        },
      },
    ],
  },
  collision_mines: {
    archetypeFocus: "bulwark",
    tagAffinities: [
      {
        tag: "bulwark",
        bwMultiplier: 0.9,
        statBonuses: {
          mineDamage: 10,
        },
      },
    ],
  },
  armor_slough: {
    archetypeFocus: "defender",
    tagAffinities: [
      {
        tag: "defender",
        bwMultiplier: 0.95,
        statBonuses: {
          damageReduction: 5,
        },
      },
    ],
  },
  kinetic_jets: {
    archetypeFocus: "recon",
    tagAffinities: [
      {
        tag: "recon",
        bwMultiplier: 0.92,
        statBonuses: {
          mobility: 5,
        },
      },
    ],
  },
};

const MODULE_OVERRIDES: Record<string, ModuleOverride> = {
  "Flux Support Matrix": {
    tags: ["support", "energy", "repair"],
    familyId: "flux_support",
    familyName: "Flux Support Matrix",
    archetypeBias: [
      {
        archetype: "support",
        bwMultiplier: 0.85,
        statBonuses: {
          repairRate: 2,
        },
      },
      {
        archetype: "carrier",
        bwMultiplier: 0.9,
        statBonuses: {
          droneRepair: 5,
        },
      },
    ],
  },
  "Energy Redistributor": {
    tags: ["support", "defender", "energy"],
    familyId: "energy_redistributor",
    familyName: "Energy Redistributor",
    archetypeBias: [
      {
        archetype: "defender",
        bwMultiplier: 0.88,
        statBonuses: {
          powerGen: 4,
        },
      },
      {
        archetype: "assault",
        bwMultiplier: 0.92,
        statBonuses: {
          rofBonus: 2,
        },
      },
    ],
  },
  "Surge Protector Array": {
    tags: ["bulwark", "defender", "energy"],
    familyId: "surge_protector",
    familyName: "Surge Protector Array",
    archetypeBias: [
      {
        archetype: "bulwark",
        bwMultiplier: 0.87,
        statBonuses: {
          capBuffer: 12,
        },
      },
      {
        archetype: "support",
        bwMultiplier: 0.93,
        statBonuses: {
          repairRate: 1,
        },
      },
    ],
  },
  "Auxiliary Reactor Node": {
    tags: ["assault", "artillery", "energy"],
    familyId: "aux_reactor",
    familyName: "Auxiliary Reactor Node",
    archetypeBias: [
      {
        archetype: "assault",
        bwMultiplier: 0.9,
        statBonuses: {
          damage: 3,
        },
      },
      {
        archetype: "artillery",
        bwMultiplier: 0.92,
        statBonuses: {
          powerGen: 4,
        },
      },
    ],
  },
  "Flux Capacitors": {
    tags: ["assault", "carrier", "energy"],
    archetypeBias: [
      {
        archetype: "carrier",
        bwMultiplier: 0.92,
        statBonuses: {
          capBuffer: 5,
        },
      },
    ],
  },
  "Overdrive Converter": {
    tags: ["assault", "bulwark", "energy"],
    archetypeBias: [
      {
        archetype: "assault",
        bwMultiplier: 0.88,
        statBonuses: {
          rofBonus: 2,
        },
      },
    ],
  },
  "High-Throughput Conduits": {
    tags: ["support", "assault", "energy"],
    archetypeBias: [
      {
        archetype: "support",
        bwMultiplier: 0.92,
      },
    ],
  },
  "Stability Regulators": {
    tags: ["artillery", "recon", "precision"],
    archetypeBias: [
      {
        archetype: "recon",
        bwMultiplier: 0.9,
        statBonuses: {
          trackingBonus: 2,
        },
      },
    ],
  },
  "Pulse Modulators": {
    tags: ["assault", "artillery", "energy"],
    archetypeBias: [
      {
        archetype: "artillery",
        bwMultiplier: 0.9,
        statBonuses: {
          rofBonus: 1,
        },
      },
    ],
  },
  "Expanded Ammo Bunker": {
    tags: ["assault", "artillery", "carrier"],
    archetypeBias: [
      {
        archetype: "bulwark",
        bwMultiplier: 0.94,
      },
    ],
  },
  "Quick-Feed Loader": {
    tags: ["assault", "carrier", "reload"],
    archetypeBias: [
      {
        archetype: "assault",
        bwMultiplier: 0.9,
        statBonuses: {
          rofBonus: 2,
        },
      },
    ],
  },
  "Multi-Caliber Racks": {
    tags: ["support", "carrier", "assault"],
    archetypeBias: [
      {
        archetype: "carrier",
        bwMultiplier: 0.92,
      },
    ],
  },
  "Sabot Casings": {
    tags: ["assault", "artillery", "precision"],
    archetypeBias: [
      {
        archetype: "artillery",
        bwMultiplier: 0.9,
        statBonuses: {
          penetration: 4,
        },
      },
    ],
  },
  "Stabilizer Fins": {
    tags: ["artillery", "recon", "precision"],
    archetypeBias: [
      {
        archetype: "recon",
        bwMultiplier: 0.9,
        statBonuses: {
          trackingBonus: 2,
        },
      },
    ],
  },
  "Auto-Aim Gyros": {
    tags: ["artillery", "support", "recon"],
    archetypeBias: [
      {
        archetype: "support",
        bwMultiplier: 0.94,
      },
    ],
  },
  "Rotary Feed Adapters": {
    tags: ["assault", "carrier", "reload"],
    archetypeBias: [
      {
        archetype: "carrier",
        bwMultiplier: 0.9,
        statBonuses: {
          reloadBonus: 2,
        },
      },
    ],
  },
  "Impact Fuze Modulators": {
    tags: ["assault", "recon", "precision"],
    archetypeBias: [
      {
        archetype: "assault",
        bwMultiplier: 0.92,
        statBonuses: {
          critChance: 2,
        },
      },
    ],
  },
  "Tracking Enhancer": {
    tags: ["recon", "artillery", "precision"],
    archetypeBias: [
      {
        archetype: "recon",
        bwMultiplier: 0.9,
        statBonuses: {
          trackingBonus: 2,
        },
      },
    ],
  },
  "Long-Range Optics": {
    tags: ["artillery", "recon", "support"],
    archetypeBias: [
      {
        archetype: "artillery",
        bwMultiplier: 0.92,
        statBonuses: {
          lockRange: 5,
        },
      },
    ],
  },
  "Arc Control Servo": {
    tags: ["assault", "bulwark", "mobility"],
    archetypeBias: [
      {
        archetype: "bulwark",
        bwMultiplier: 0.94,
      },
    ],
  },
  "ECM Suite": {
    tags: ["support", "defender", "infiltrator", "ecm"],
    archetypeBias: [
      {
        archetype: "infiltrator",
        bwMultiplier: 0.88,
        statBonuses: {
          ecm: 4,
        },
      },
    ],
  },
  "Signal Amplifiers": {
    tags: ["support", "recon", "signal"],
    archetypeBias: [
      {
        archetype: "support",
        bwMultiplier: 0.92,
        statBonuses: {
          lockStrength: 4,
        },
      },
    ],
  },
  "Spoof Emitters": {
    tags: ["infiltrator", "recon", "stealth"],
    archetypeBias: [
      {
        archetype: "infiltrator",
        bwMultiplier: 0.9,
        statBonuses: {
          ecm: 3,
        },
      },
    ],
  },
  "Micro-Thruster Bank": {
    tags: ["assault", "recon", "mobility"],
    archetypeBias: [
      {
        archetype: "assault",
        bwMultiplier: 0.94,
      },
    ],
  },
  "Rotation Assist Gyros": {
    tags: ["assault", "bulwark", "mobility"],
    archetypeBias: [
      {
        archetype: "bulwark",
        bwMultiplier: 0.94,
      },
    ],
  },
  "Vector Dampers": {
    tags: ["assault", "defender", "mobility"],
    archetypeBias: [
      {
        archetype: "defender",
        bwMultiplier: 0.94,
      },
    ],
  },
  "Drone Command Processor": {
    tags: ["carrier", "support", "drone"],
    archetypeBias: [
      {
        archetype: "carrier",
        bwMultiplier: 0.88,
        statBonuses: {
          droneControl: 1,
        },
      },
    ],
  },
  "Autonomy Firmware": {
    tags: ["carrier", "support", "drone"],
    archetypeBias: [
      {
        archetype: "carrier",
        bwMultiplier: 0.9,
        statBonuses: {
          droneAI: 5,
        },
      },
    ],
  },
  "Maintenance Bay": {
    tags: ["carrier", "support", "drone"],
    archetypeBias: [
      {
        archetype: "carrier",
        bwMultiplier: 0.88,
        statBonuses: {
          droneRepair: 6,
        },
      },
    ],
  },
};

function mergeUnique<T>(base: T[] | undefined, extra: T[] | undefined): T[] | undefined {
  if (!base && !extra) return undefined;
  const out = new Set<T>(base ?? []);
  for (const value of extra ?? []) {
    out.add(value);
  }
  return Array.from(out);
}

export function applyHullOverrides(hull: Hull): Hull {
  const override = HULL_OVERRIDES[hull.id];
  if (!override) return hull;

  return {
    ...hull,
    archetype: override.archetype,
    mismatchTolerance: override.mismatchTolerance ?? hull.mismatchTolerance,
    slotBias: override.slotBias ?? hull.slotBias,
    tagAffinities: override.tagAffinities ?? hull.tagAffinities,
    tagPenalties: override.tagPenalties ?? hull.tagPenalties,
    compatibleTags: mergeUnique(hull.compatibleTags, override.addCompatibleTags),
    incompatibleTags: mergeUnique(hull.incompatibleTags, override.addIncompatibleTags),
  };
}

export function applyPrimaryOverrides(primary: PrimaryArchetype): PrimaryArchetype {
  const override = PRIMARY_OVERRIDES[primary.id];
  if (!override) return primary;
  return {
    ...primary,
    archetypeFocus: override.archetypeFocus ?? primary.archetypeFocus,
    tagAffinities: override.tagAffinities ?? primary.tagAffinities,
  };
}

export function applySecondaryOverrides(secondary: SecondaryDef): SecondaryDef {
  const override = SECONDARY_OVERRIDES[secondary.id];
  if (!override) return secondary;
  return {
    ...secondary,
    archetypeFocus: override.archetypeFocus ?? secondary.archetypeFocus,
    tagAffinities: override.tagAffinities ?? secondary.tagAffinities,
  };
}

export function applyModuleOverrides(module: ModuleDef): ModuleDef {
  const override = MODULE_OVERRIDES[module.id];
  const tags = override?.tags ?? module.tags ?? [module.slot.toLowerCase()];
  return {
    ...module,
    tags,
    archetypeBias: override?.archetypeBias ?? module.archetypeBias,
    tagAffinities: override?.tagAffinities ?? module.tagAffinities,
  };
}

