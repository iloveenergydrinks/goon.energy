import { create } from "zustand";
import type {
  Fit,
  ModuleDef,
  ModulesById,
  PlacedModule,
  PrimaryArchetype,
  SecondaryDef,
  Hull,
} from "@/types/fitting";
import { loadCatalog } from "@/lib/catalog";
import { generateGridFromHull } from "@/lib/grid/generateGridFromHull";
import { applyPlacement, type PlacementAction } from "@/lib/fit/applyPlacement";
import { computeDerivedStats } from "@/lib/fit/computeDerivedStats";
import { canPlace } from "@/lib/fit/canPlace";

const catalog = loadCatalog();

interface FittingState {
  // catalog
  primaries: PrimaryArchetype[];
  secondaries: SecondaryDef[];
  hulls: Hull[];
  modules: ModuleDef[];
  modulesById: ModulesById;

  // wizard state
  wizardStep: 1 | 2 | 3;
  selectedPrimaryId: string | null;
  selectedSecondaryIds: string[];
  selectedHullId: string | null;
  compatibleHulls: Hull[];

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

  // wizard actions
  selectPrimary: (id: string) => void;
  toggleSecondary: (id: string) => void;
  selectHull: (id: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetWizard: () => void;
  generateFromHull: () => void;

  // placement actions
  commitPlacement: (action: PlacementAction) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;

  // ghost actions
  startDrag: (moduleId: string) => void;
  cancelDrag: () => void;
  rotateGhost: () => void;
  setHoverCell: (cell: { r: number; c: number } | null) => void;
}

// Helper function to get compatible hulls
function getCompatibleHulls(
  primaryId: string | null,
  secondaryIds: string[],
  catalog: ReturnType<typeof loadCatalog>
): Hull[] {
  if (!primaryId) return [];
  
  const primary = catalog.primariesById[primaryId];
  if (!primary) return [];
  
  const secondaries = secondaryIds
    .map(id => catalog.secondariesById[id])
    .filter(Boolean) as SecondaryDef[];
  
  return catalog.hulls.filter(hull => {
    // Check power budget
    const totalPower = primary.powerDraw + 
      secondaries.reduce((sum, s) => sum + s.powerDraw, 0);
    if (totalPower > hull.powerCapacity) return false;
    
    // Check heat
    const totalHeat = primary.heatGeneration + 
      secondaries.reduce((sum, s) => sum + s.heatGeneration, 0);
    if (totalHeat > hull.heatDissipation) return false;
    
    // Check slot requirements
    const powerSlotsInGrid = hull.grid.slots.filter(s => s.type === "Power").length;
    const ammoSlotsInGrid = hull.grid.slots.filter(s => s.type === "Ammo").length;
    const utilitySlotsinGrid = hull.grid.slots.filter(s => s.type === "Utility").length;
    
    const requiredPower = primary.minPowerSlots + 
      secondaries.reduce((sum, s) => sum + s.deltaPowerSlots, 0);
    const requiredAmmo = (primary.minAmmoSlots || 0) + 
      secondaries.reduce((sum, s) => sum + s.deltaAmmoSlots, 0);
    const requiredUtility = secondaries.reduce((sum, s) => sum + s.deltaUtilitySlots, 0);
    
    if (powerSlotsInGrid < requiredPower) return false;
    if (ammoSlotsInGrid < requiredAmmo) return false;
    if (utilitySlotsinGrid < requiredUtility) return false;
    
    // Check tag compatibility
    const weaponTags = [...primary.tags, ...secondaries.flatMap(s => s.tags)];
    if (hull.incompatibleTags?.some(tag => weaponTags.includes(tag))) {
      return false;
    }
    
    // Bonus for compatible tags (but not required)
    // This could be used for sorting/prioritizing hulls
    
    return true;
  });
}

export const useFittingStore = create<FittingState>((set, get) => ({
  primaries: catalog.primaries,
  secondaries: catalog.secondaries,
  hulls: catalog.hulls,
  modules: catalog.modules,
  modulesById: catalog.modulesById,

  wizardStep: 1,
  selectedPrimaryId: null,
  selectedSecondaryIds: [],
  selectedHullId: null,
  compatibleHulls: [],

  grid: null,
  placed: [],
  derivedStats: {},

  undoStack: [],
  redoStack: [],

  draggingModuleId: null,
  ghostRotation: 0,
  hoverCell: null,

  // Wizard actions
  selectPrimary: (id) => {
    const compatibleHulls = getCompatibleHulls(id, get().selectedSecondaryIds, catalog);
    set({ 
      selectedPrimaryId: id,
      compatibleHulls,
      selectedHullId: null, // Reset hull selection when primary changes
    });
  },
  
  toggleSecondary: (id) => {
    const current = get().selectedSecondaryIds;
    const has = current.includes(id);
    let next = has ? current.filter(x => x !== id) : [...current, id];
    if (next.length > 2) next = next.slice(0, 2); // Limit to 2 secondaries
    
    const compatibleHulls = getCompatibleHulls(get().selectedPrimaryId, next, catalog);
    set({ 
      selectedSecondaryIds: next,
      compatibleHulls,
      selectedHullId: null, // Reset hull selection when secondaries change
    });
  },
  
  selectHull: (id) => {
    set({ selectedHullId: id });
  },
  
  nextStep: () => {
    const { wizardStep, selectedPrimaryId, selectedSecondaryIds } = get();
    if (wizardStep === 1 && selectedPrimaryId) {
      set({ wizardStep: 2 });
    } else if (wizardStep === 2) {
      // Update compatible hulls before moving to step 3
      const compatibleHulls = getCompatibleHulls(selectedPrimaryId, selectedSecondaryIds, catalog);
      set({ wizardStep: 3, compatibleHulls });
    }
  },
  
  prevStep: () => {
    const { wizardStep } = get();
    if (wizardStep === 2) {
      set({ wizardStep: 1 });
    } else if (wizardStep === 3) {
      set({ wizardStep: 2 });
    }
  },
  
  resetWizard: () => {
    set({
      wizardStep: 1,
      selectedPrimaryId: null,
      selectedSecondaryIds: [],
      selectedHullId: null,
      compatibleHulls: [],
      grid: null,
      placed: [],
      derivedStats: {},
      undoStack: [],
      redoStack: [],
    });
  },

  generateFromHull: () => {
    const { selectedHullId, selectedPrimaryId, selectedSecondaryIds } = get();
    if (!selectedHullId) return;
    
    const hull = catalog.hullsById[selectedHullId];
    if (!hull) return;
    
    const grid = generateGridFromHull(hull);
    
    // Calculate initial stats from hull and weapons
    const initialStats = computeDerivedStats(
      [],
      catalog.modulesById,
      hull.id, // Pass hull ID instead of size ID
      selectedPrimaryId || undefined,
      selectedSecondaryIds,
      undefined, // No longer using ship sizes
      catalog.primariesById,
      catalog.secondariesById,
      grid
    );
    
    // Add hull base stats
    if (hull.baseStats) {
      for (const [k, v] of Object.entries(hull.baseStats)) {
        if (v !== undefined) {
          initialStats[k] = (initialStats[k] || 0) + v;
        }
      }
    }
    
    set({ 
      grid, 
      placed: [], 
      derivedStats: initialStats, 
      undoStack: [], 
      redoStack: [] 
    });
  },

  // Placement actions (unchanged)
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
      hullId: get().selectedHullId || "",
      primaryId: get().selectedPrimaryId || "",
      secondaryIds: get().selectedSecondaryIds,
      grid,
      placed,
      derivedStats: get().derivedStats,
      version: "r2.0",
    };
    const updated = applyPlacement(nextFit, action, modulesById);
    
    const hull = catalog.hullsById[get().selectedHullId || ""];
    const newStats = computeDerivedStats(
      updated.placed, 
      modulesById,
      hull?.id,
      get().selectedPrimaryId || undefined,
      get().selectedSecondaryIds,
      undefined, // No longer using ship sizes
      catalog.primariesById,
      catalog.secondariesById,
      grid
    );
    
    // Add hull base stats
    if (hull?.baseStats) {
      for (const [k, v] of Object.entries(hull.baseStats)) {
        if (v !== undefined) {
          newStats[k] = (newStats[k] || 0) + v;
        }
      }
    }
    
    set({
      placed: updated.placed,
      derivedStats: newStats,
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
    
    const hull = catalog.hullsById[get().selectedHullId || ""];
    const newStats = computeDerivedStats(
      prev.placed, 
      modulesById,
      hull?.id,
      get().selectedPrimaryId || undefined,
      get().selectedSecondaryIds,
      undefined, // No longer using ship sizes
      catalog.primariesById,
      catalog.secondariesById,
      get().grid ?? undefined
    );
    
    // Add hull base stats
    if (hull?.baseStats) {
      for (const [k, v] of Object.entries(hull.baseStats)) {
        if (v !== undefined) {
          newStats[k] = (newStats[k] || 0) + v;
        }
      }
    }
    
    set({
      placed: prev.placed,
      derivedStats: newStats,
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
    
    const hull = catalog.hullsById[get().selectedHullId || ""];
    const newStats = computeDerivedStats(
      next.placed, 
      modulesById,
      hull?.id,
      get().selectedPrimaryId || undefined,
      get().selectedSecondaryIds,
      undefined, // No longer using ship sizes
      catalog.primariesById,
      catalog.secondariesById,
      get().grid ?? undefined
    );
    
    // Add hull base stats
    if (hull?.baseStats) {
      for (const [k, v] of Object.entries(hull.baseStats)) {
        if (v !== undefined) {
          newStats[k] = (newStats[k] || 0) + v;
        }
      }
    }
    
    set({
      placed: next.placed,
      derivedStats: newStats,
      undoStack: newUndo,
      redoStack: newRedo,
    });
  },

  clearHistory: () => set({ undoStack: [], redoStack: [] }),

  startDrag: (moduleId) => set({ draggingModuleId: moduleId, ghostRotation: 0 }),
  cancelDrag: () => set({ draggingModuleId: null, hoverCell: null }),
  rotateGhost: () => {
    const cur = get().ghostRotation;
    const next = ((cur + 90) % 360) as 0 | 90 | 180 | 270;
    set({ ghostRotation: next });
  },
  setHoverCell: (cell) => set({ hoverCell: cell }),
}));