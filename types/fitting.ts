export type SlotType = "Power" | "Ammo" | "Utility";

export type SecondaryCategory = "Offensive" | "Utility" | "Defensive";

export type ArchetypeId =
  | "support"
  | "defender"
  | "assault"
  | "artillery"
  | "recon"
  | "infiltrator"
  | "carrier"
  | "bulwark";

export interface TagModifier {
  tag: string;
  bwMultiplier?: number;
  statBonuses?: Record<string, number | undefined>;
  mismatchAdjustment?: number;
}

export interface ArchetypeBias {
  archetype: ArchetypeId;
  bwMultiplier?: number;
  statBonuses?: Record<string, number | undefined>;
}

export interface ShipSize {
  id: "Frigate" | "Destroyer" | "Cruiser" | "Capital";
  rows: number;
  cols: number;
  cellCount?: number;
  description?: string;
  baseStats?: Record<string, number | undefined>;
  bwLimit?: number;
}

export interface PrimaryArchetype {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  baseStats?: Record<string, number | undefined>;
  stats?: Record<string, number | undefined>;
  // Requirements for hull compatibility
  minPowerSlots: number;
  minAmmoSlots?: number;
  powerDraw: number;
  powerCost?: number;
  tags: string[];
  compatibleTags?: string[];
  archetypeFocus?: ArchetypeId | string;
  tagAffinities?: TagModifier[];
}

export interface SecondaryDef {
  id: string;
  name: string;
  category: SecondaryCategory;
  description?: string;
  baseStats?: Record<string, number | undefined>;
  // Modifies hull requirements
  deltaPowerSlots: number;
  deltaAmmoSlots: number;
  deltaUtilitySlots: number;
  powerDraw: number;
  powerCost?: number;
  slotAdjustments?: { Power: number; Ammo: number; Utility: number };
  tags: string[];
  compatibleTags?: string[];
  archetypeFocus?: ArchetypeId | string;
  tagAffinities?: TagModifier[];
}

export interface GridCell {
  r: number;
  c: number;
  slot?: SlotType;
  hole?: boolean;
}

export interface Hull {
  id: string;
  name: string;
  description?: string;
  sizeId: ShipSize["id"];
  archetype?: ArchetypeId;
  
  // Grid definition with predefined slots
  grid: {
    rows: number;
    cols: number;
    slots: Array<{
      r: number;
      c: number;
      type: SlotType;
    }>;
  };
  
  // Capabilities
  powerCapacity: number;
  bandwidthLimit: number;
  baseStats?: Record<string, number | undefined>;
  mismatchTolerance?: number;
  slotBias?: Partial<Record<SlotType, number>>;
  tagAffinities?: TagModifier[];
  tagPenalties?: TagModifier[];
  
  // Compatibility
  compatibleTags?: string[];
  incompatibleTags?: string[];
  preferredWeapons?: string[];
}

export interface Grid {
  rows: number;
  cols: number;
  cells: GridCell[];
  hullId: string;
}

export interface ModuleShapeCellOffset {
  dr: number;
  dc: number;
}

export interface ModuleShape {
  id: string;
  cells: Array<ModuleShapeCellOffset>;
  rotations: Array<0 | 90 | 180 | 270>;
  sizeClass: "S" | "M" | "L";
}

export interface ModuleDef {
  id: string;
  name?: string;
  slot: SlotType;
  shape: ModuleShape;
  stats: Partial<{
    powerGen: number;
    capBuffer: number;
    rofBonus: number;
    trackingBonus: number;
    ammoCap: number;
    reloadBonus: number;
    ecm: number;
    mobility: number;
    arcBonus: number;
    penetration: number;
    critChance: number;
    lockRange: number;
    lockStrength: number;
    droneControl: number;
    droneAI: number;
    droneRepair: number;
    repairRate: number;
    bwLimitBonus: number;
  }>;
  description?: string;
  baseBW?: number;
  tags?: string[];
  archetypeBias?: ArchetypeBias[];
  tagAffinities?: TagModifier[];
  familyId?: string;
  familyName?: string;
  variantTier?: string;
  minHullSize?: ShipSize["id"];
}

export interface PlacedModule {
  moduleId: string;
  anchor: { r: number; c: number };
  rotation: 0 | 90 | 180 | 270;
}

export interface Fit {
  id?: string;
  name: string;
  hullId: string;
  primaryId: string;
  secondaryIds: string[];
  grid: Grid;
  placed: PlacedModule[];
  derivedStats: Record<string, number>;
  version: string;
}

export type ModulesById = Record<string, ModuleDef>;
export type PrimariesById = Record<string, PrimaryArchetype>;
export type SecondariesById = Record<string, SecondaryDef>;
export type ShipSizesById = Record<string, ShipSize>;
export type HullsById = Record<string, Hull>;

