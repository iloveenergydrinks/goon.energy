export type SlotType = "Power" | "Ammo" | "Utility";

export type SecondaryCategory = "Offensive" | "Utility" | "Defensive";

export interface ShipSize {
  id: "Frigate" | "Destroyer" | "Cruiser" | "Capital";
  rows: number;
  cols: number;
  cellCount?: number;
  description?: string;
  baseStats?: Record<string, number | undefined>;
}

export interface PrimaryArchetype {
  id: string;
  shape: "long_narrow" | "wide" | "square" | "irregular" | "central_pockets";
  baseRatio: { P: number; A: number; U: number };
  description?: string;
  icon?: string;
  baseStats?: Record<string, number | undefined>;
}

export interface SecondaryDef {
  id: string;
  category: SecondaryCategory;
  delta: { dP: number; dA: number; dU: number };
  reshape?: {
    ammo_bias?: number;
    edge_utility?: number;
    inner_utility?: number;
  };
  description?: string;
  baseStats?: Record<string, number | undefined>;
}

export interface GridCell {
  r: number;
  c: number;
  slot?: SlotType;
  hole?: boolean;
}

export interface Grid {
  rows: number;
  cols: number;
  cells: GridCell[];
  meta: {
    ratio: { P: number; A: number; U: number };
    reshape: Record<string, number>;
    seed: string;
  };
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
  slot: SlotType;
  shape: ModuleShape;
  stats: Partial<{
    heatSink: number;
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
  }>;
  description?: string;
}

export interface PlacedModule {
  moduleId: string;
  anchor: { r: number; c: number };
  rotation: 0 | 90 | 180 | 270;
}

export interface Fit {
  id?: string;
  name: string;
  seed: string;
  sizeId: ShipSize["id"];
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

