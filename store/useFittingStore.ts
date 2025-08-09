import { create } from "zustand";
import type {
  Fit,
  ModuleDef,
  ModulesById,
  PlacedModule,
  PrimaryArchetype,
  SecondaryDef,
  ShipSize,
} from "@/types/fitting";
import { loadCatalog } from "@/lib/catalog";
import { generateGrid } from "@/lib/grid/generateGrid";
import { applyPlacement, type PlacementAction } from "@/lib/fit/applyPlacement";
import { computeDerivedStats } from "@/lib/fit/computeDerivedStats";
import { encodePermalink, decodePermalink } from "@/lib/permalink";
import { canPlace } from "@/lib/fit/canPlace";

const catalog = loadCatalog();

interface FittingState {
  // catalog
  primaries: PrimaryArchetype[];
  secondaries: SecondaryDef[];
  sizes: ShipSize[];
  modules: ModuleDef[];
  modulesById: ModulesById;

  // selection
  sizeId: ShipSize["id"];
  primaryId: string;
  secondaryIds: string[];
  seed: string;

  // grid & placements
  grid: Fit["grid"] | null;
  placed: PlacedModule[];
  derivedStats: Record<string, number>;

  // history
  undoStack: { placed: PlacedModule[] }[];
  redoStack: { placed: PlacedModule[] }[];

  // drag/ghost
  draggingModuleId: string | null;
  ghostRotation: 0 | 90 | 180 | 270;
  hoverCell: { r: number; c: number } | null;

  // actions
  setSize: (id: ShipSize["id"]) => void;
  setPrimary: (id: string) => void;
  toggleSecondary: (id: string) => void;
  setSeed: (seed: string) => void;
  rollSeed: () => void;
  generate: () => void;
  commitPlacement: (action: PlacementAction) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  toPermalink: () => string;
  loadFromPermalink: (code: string) => boolean;

  // ghost actions
  startDrag: (moduleId: string) => void;
  cancelDrag: () => void;
  rotateGhost: () => void;
  setHoverCell: (cell: { r: number; c: number } | null) => void;
}

function pickDefaults() {
  const sizeId = catalog.sizes[0].id;
  const primaryId = catalog.primaries[0].id;
  return { sizeId, primaryId };
}

function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

export const useFittingStore = create<FittingState>((set, get) => ({
  primaries: catalog.primaries,
  secondaries: catalog.secondaries,
  sizes: catalog.sizes,
  modules: catalog.modules,
  modulesById: catalog.modulesById,

  ...pickDefaults(),
  secondaryIds: [],
  seed: randomSeed(),

  grid: null,
  placed: [],
  derivedStats: {},

  undoStack: [],
  redoStack: [],

  draggingModuleId: null,
  ghostRotation: 0,
  hoverCell: null,

  setSize: (id) => set({ sizeId: id }),
  setPrimary: (id) => set({ primaryId: id }),
  toggleSecondary: (id) => {
    const cur = get().secondaryIds;
    const has = cur.includes(id);
    let next = has ? cur.filter((x) => x !== id) : [...cur, id];
    if (next.length > 2) next = next.slice(0, 2); // MVP limit 0-2
    set({ secondaryIds: next });
  },
  setSeed: (seed) => set({ seed }),
  rollSeed: () => set({ seed: randomSeed() }),
  generate: () => {
    const { sizeId, primaryId, secondaryIds, seed } = get();
    const size = catalog.shipSizesById[sizeId];
    const primary = catalog.primariesById[primaryId];
    const secondaries = secondaryIds
      .map((id) => catalog.secondariesById[id])
      .filter(Boolean) as SecondaryDef[];
    const grid = generateGrid(primary, secondaries, size, seed);
    // Calculate initial stats from ship configuration
    const initialStats = computeDerivedStats(
      [],
      catalog.modulesById,
      sizeId,
      primaryId,
      secondaryIds,
      catalog.shipSizesById,
      catalog.primariesById,
      catalog.secondariesById,
      grid
    );
    set({ grid, placed: [], derivedStats: initialStats, undoStack: [], redoStack: [] });
  },
  commitPlacement: (action) => {
    const { placed, grid, modulesById, undoStack } = get();
    if (!grid) return;
    
    // Validate placement before applying
    if (action.type === "add") {
      const module = modulesById[action.placement.moduleId];
      if (!module) return;
      const result = canPlace(
        grid,
        module,
        action.placement.anchor,
        action.placement.rotation,
        placed,
        modulesById
      );
      if (!result.ok) {
        console.warn(`Cannot place module: ${result.reason}`);
        return;
      }
    }
    
    const nextFit: Fit = {
      id: undefined,
      name: "",
      seed: get().seed,
      sizeId: get().sizeId,
      primaryId: get().primaryId,
      secondaryIds: get().secondaryIds,
      grid,
      placed,
      derivedStats: get().derivedStats,
      version: "r1.0",
    };
    const updated = applyPlacement(nextFit, action, modulesById);
    set({
      placed: updated.placed,
              derivedStats: computeDerivedStats(
          updated.placed, 
          modulesById,
          get().sizeId,
          get().primaryId,
          get().secondaryIds,
          catalog.shipSizesById,
          catalog.primariesById,
          catalog.secondariesById,
          grid
        ),
      undoStack: [...undoStack, { placed }].slice(-100),
      redoStack: [],
      draggingModuleId: null,
      hoverCell: null,
    });
  },
  undo: () => {
    const { undoStack, redoStack, placed, modulesById } = get();
    const prev = undoStack[undoStack.length - 1];
    if (!prev) return;
    const newUndo = undoStack.slice(0, -1);
    const newRedo = [...redoStack, { placed }].slice(-100);
    set({
      placed: prev.placed,
              derivedStats: computeDerivedStats(
          prev.placed, 
          modulesById,
          get().sizeId,
          get().primaryId,
          get().secondaryIds,
          catalog.shipSizesById,
          catalog.primariesById,
          catalog.secondariesById,
          get().grid ?? undefined
        ),
      undoStack: newUndo,
      redoStack: newRedo,
    });
  },
  redo: () => {
    const { undoStack, redoStack, placed, modulesById } = get();
    const next = redoStack[redoStack.length - 1];
    if (!next) return;
    const newRedo = redoStack.slice(0, -1);
    const newUndo = [...undoStack, { placed }].slice(-100);
    set({
      placed: next.placed,
              derivedStats: computeDerivedStats(
          next.placed, 
          modulesById,
          get().sizeId,
          get().primaryId,
          get().secondaryIds,
          catalog.shipSizesById,
          catalog.primariesById,
          catalog.secondariesById,
          get().grid ?? undefined
        ),
      undoStack: newUndo,
      redoStack: newRedo,
    });
  },
  clearHistory: () => set({ undoStack: [], redoStack: [] }),
  toPermalink: () => {
    const { grid } = get();
    if (!grid) return "";
    const fit: Fit = {
      id: undefined,
      name: "",
      seed: get().seed,
      sizeId: get().sizeId,
      primaryId: get().primaryId,
      secondaryIds: get().secondaryIds,
      grid,
      placed: get().placed,
      derivedStats: get().derivedStats,
      version: "r1.0",
    };
    return encodePermalink(fit);
  },
  loadFromPermalink: (code: string) => {
    const size = catalog.shipSizesById[get().sizeId];
    const primary = catalog.primariesById[get().primaryId];
    const secondaries = get().secondaryIds.map((id) => catalog.secondariesById[id]).filter(Boolean) as SecondaryDef[];
    const decoded = decodePermalink(code, { primary, secondaries, size, modulesById: catalog.modulesById });
    if (!decoded) return false;
    const derived = computeDerivedStats(
      decoded.placed, 
      catalog.modulesById,
      decoded.sizeId,
      decoded.primaryId,
      decoded.secondaryIds,
      catalog.shipSizesById,
      catalog.primariesById,
      catalog.secondariesById,
      decoded.grid
    );
    set({
      seed: decoded.seed,
      sizeId: decoded.sizeId,
      primaryId: decoded.primaryId,
      secondaryIds: decoded.secondaryIds,
      grid: decoded.grid,
      placed: decoded.placed,
      derivedStats: derived,
      undoStack: [],
      redoStack: [],
    });
    return true;
  },
  startDrag: (moduleId) => set({ draggingModuleId: moduleId, ghostRotation: 0 }),
  cancelDrag: () => set({ draggingModuleId: null, hoverCell: null }),
  rotateGhost: () => {
    const cur = get().ghostRotation;
    const next = ((cur + 90) % 360) as 0 | 90 | 180 | 270;
    set({ ghostRotation: next });
  },
  setHoverCell: (cell) => set({ hoverCell: cell }),
}));

