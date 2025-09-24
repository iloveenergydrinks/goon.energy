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
import { generateGridFromHull } from "@/lib/grid/generateGridFromHull";
import { applyPlacement, type PlacementAction } from "@/lib/fit/applyPlacement";
import { computeDerivedStats } from "@/lib/fit/computeDerivedStats";
import { canPlace } from "@/lib/fit/canPlace";

interface CatalogSlice {
  primaries: PrimaryArchetype[];
  secondaries: SecondaryDef[];
  hulls: Hull[];
  modules: ModuleDef[];
  modulesById: ModulesById;
  catalogReady: boolean;
}

const initialCatalog: CatalogSlice = {
  primaries: [],
  secondaries: [],
  hulls: [],
  modules: [],
  modulesById: {},
  catalogReady: false,
};

function indexModules(modules: ModuleDef[]): ModulesById {
  return modules.reduce<ModulesById>((acc, mod) => {
    acc[mod.id] = mod;
    return acc;
  }, {});
}

interface FittingState extends CatalogSlice {
  wizardStep: 1 | 2 | 3 | 4;
  selectedPrimaryId: string | null;
  selectedSecondaryIds: string[];
  selectedHullId: string | null;
  compatibleHulls: Hull[];

  grid: Fit["grid"] | null;
  placed: PlacedModule[];
  derivedStats: Record<string, number>;

  undoStack: { placed: PlacedModule[] }[];
  redoStack: { placed: PlacedModule[] }[];

  draggingModuleId: string | null;
  ghostRotation: 0 | 90 | 180 | 270;
  hoverCell: { r: number; c: number } | null;

  hydrateCatalog: (payload: CatalogSlice) => void;
  selectPrimary: (id: string | null) => void;
  toggleSecondary: (id: string) => void;
  selectHull: (id: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetWizard: () => void;
  generateFromHull: () => void;

  commitPlacement: (action: PlacementAction) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;

  startDrag: (moduleId: string) => void;
  cancelDrag: () => void;
  rotateGhost: () => void;
  setHoverCell: (cell: { r: number; c: number } | null) => void;
}

function getCompatibleHulls(
  primaryId: string | null,
  secondaryIds: string[],
  state: FittingState
): Hull[] {
  if (!primaryId) return state.hulls;
  const primary = state.primaries.find((p) => p.id === primaryId);
  if (!primary) return state.hulls;

  const secondaries = secondaryIds
    .map((id) => state.secondaries.find((s) => s.id === id))
    .filter((s): s is SecondaryDef => Boolean(s));

  return state.hulls.filter((hull) => {
    const totalPower = primary.powerDraw + secondaries.reduce((sum, s) => sum + s.powerDraw, 0);
    if (totalPower > hull.powerCapacity) return false;

    const powerSlotsInGrid = hull.grid.slots.filter((s) => s.type === "Power").length;
    const ammoSlotsInGrid = hull.grid.slots.filter((s) => s.type === "Ammo").length;
    const utilitySlotsInGrid = hull.grid.slots.filter((s) => s.type === "Utility").length;

    const requiredPower = primary.minPowerSlots + secondaries.reduce((sum, s) => sum + s.deltaPowerSlots, 0);
    const requiredAmmo = (primary.minAmmoSlots || 0) + secondaries.reduce((sum, s) => sum + s.deltaAmmoSlots, 0);
    const requiredUtility = secondaries.reduce((sum, s) => sum + s.deltaUtilitySlots, 0);

    if (powerSlotsInGrid < requiredPower) return false;
    if (ammoSlotsInGrid < requiredAmmo) return false;
    if (utilitySlotsInGrid < requiredUtility) return false;

    const weaponTags = [...primary.tags, ...secondaries.flatMap((s) => s.tags)];
    if (hull.incompatibleTags?.some((tag) => weaponTags.includes(tag))) {
      return false;
    }
    return true;
  });
}

export const useFittingStore = create<FittingState>((set, get) => ({
  ...initialCatalog,
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

  hydrateCatalog: (payload) => {
    set({
      ...payload,
      modulesById: indexModules(payload.modules),
      compatibleHulls: payload.hulls,
      catalogReady: true,
    });
  },

  selectPrimary: (id) => {
    const state = get();
    const compatibleHulls = getCompatibleHulls(id, state.selectedSecondaryIds, state);
    const currentHullId = state.selectedHullId;
    const nextSelectedHullId =
      currentHullId && compatibleHulls.some((h) => h.id === currentHullId)
        ? currentHullId
        : compatibleHulls[0]?.id ?? null;
    set({
      selectedPrimaryId: id,
      compatibleHulls,
      selectedHullId: nextSelectedHullId,
    });
  },

  toggleSecondary: (id) => {
    const state = get();
    const current = state.selectedSecondaryIds;
    const has = current.includes(id);
    let next = has ? current.filter((x) => x !== id) : [...current, id];
    if (next.length > 2) next = next.slice(0, 2);

    const compatibleHulls = getCompatibleHulls(state.selectedPrimaryId, next, state);
    const currentHullId = state.selectedHullId;
    const nextSelectedHullId =
      currentHullId && compatibleHulls.some((h) => h.id === currentHullId)
        ? currentHullId
        : compatibleHulls[0]?.id ?? null;
    set({
      selectedSecondaryIds: next,
      compatibleHulls,
      selectedHullId: nextSelectedHullId,
    });
  },

  selectHull: (id) => {
    set({ selectedHullId: id });
  },

  nextStep: () => {
    const state = get();
    const { wizardStep, selectedHullId, selectedPrimaryId, selectedSecondaryIds } = state;
    if (wizardStep === 1 && selectedHullId) {
      set({ wizardStep: 2 });
    } else if (wizardStep === 2 && selectedPrimaryId) {
      const compatibleHulls = getCompatibleHulls(selectedPrimaryId, selectedSecondaryIds, state);
      set({ wizardStep: 3, compatibleHulls });
    } else if (wizardStep === 3) {
      set({ wizardStep: 4 });
    }
  },

  prevStep: () => {
    const { wizardStep } = get();
    if (wizardStep === 2) {
      set({ wizardStep: 1 });
    } else if (wizardStep === 3) {
      set({ wizardStep: 2 });
    } else if (wizardStep === 4) {
      set({ wizardStep: 3 });
    }
  },

  resetWizard: () => {
    const { hulls } = get();
    set({
      wizardStep: 1,
      selectedPrimaryId: null,
      selectedSecondaryIds: [],
      selectedHullId: null,
      compatibleHulls: hulls,
      grid: null,
      placed: [],
      derivedStats: {},
      undoStack: [],
      redoStack: [],
    });
  },

  generateFromHull: () => {
    const state = get();
    const { selectedHullId, selectedPrimaryId, selectedSecondaryIds, modulesById } = state;
    if (!selectedHullId) return;

    const hull = state.hulls.find((h) => h.id === selectedHullId);
    if (!hull) return;

    const grid = generateGridFromHull(hull);

    const primariesById = state.primaries.reduce<Record<string, PrimaryArchetype>>((acc, curr) => {
      acc[curr.id] = curr;
      return acc;
    }, {});
    const secondariesById = state.secondaries.reduce<Record<string, SecondaryDef>>((acc, curr) => {
      acc[curr.id] = curr;
      return acc;
    }, {});

    const initialStats = computeDerivedStats(
      [],
      modulesById,
      hull,
      selectedPrimaryId || undefined,
      selectedSecondaryIds,
      primariesById,
      secondariesById,
      grid
    );

    if (hull.baseStats) {
      for (const [k, v] of Object.entries(hull.baseStats)) {
        if (v !== undefined) {
          initialStats[k] = (initialStats[k] || 0) + (v as number);
        }
      }
    }

    set({
      grid,
      placed: [],
      derivedStats: initialStats,
      undoStack: [],
      redoStack: [],
    });
  },

  commitPlacement: (action) => {
    const state = get();
    const { placed, grid, modulesById, undoStack } = state;
    if (!grid) return;

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
      hullId: state.selectedHullId || "",
      primaryId: state.selectedPrimaryId || "",
      secondaryIds: state.selectedSecondaryIds,
      grid,
      placed,
      derivedStats: state.derivedStats,
      version: "r2.0",
    };
    const updated = applyPlacement(nextFit, action, modulesById);

    const hull = state.hulls.find((h) => h.id === state.selectedHullId);
    const primariesById = state.primaries.reduce<Record<string, PrimaryArchetype>>((acc, curr) => {
      acc[curr.id] = curr;
      return acc;
    }, {});
    const secondariesById = state.secondaries.reduce<Record<string, SecondaryDef>>((acc, curr) => {
      acc[curr.id] = curr;
      return acc;
    }, {});

    const newStats = computeDerivedStats(
      updated.placed,
      modulesById,
      hull,
      state.selectedPrimaryId || undefined,
      state.selectedSecondaryIds,
      primariesById,
      secondariesById,
      grid
    );

    if (hull?.baseStats) {
      for (const [k, v] of Object.entries(hull.baseStats)) {
        if (v !== undefined) {
          newStats[k] = (newStats[k] || 0) + (v as number);
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
    const state = get();
    const { undoStack, redoStack, placed, modulesById } = state;
    const prev = undoStack[undoStack.length - 1];
    if (!prev) return;
    const newUndo = undoStack.slice(0, -1);
    const newRedo = [...redoStack, { placed }].slice(-100);

    const hull = state.hulls.find((h) => h.id === state.selectedHullId);
    const primariesById = state.primaries.reduce<Record<string, PrimaryArchetype>>((acc, curr) => {
      acc[curr.id] = curr;
      return acc;
    }, {});
    const secondariesById = state.secondaries.reduce<Record<string, SecondaryDef>>((acc, curr) => {
      acc[curr.id] = curr;
      return acc;
    }, {});

    const newStats = computeDerivedStats(
      prev.placed,
      modulesById,
      hull,
      state.selectedPrimaryId || undefined,
      state.selectedSecondaryIds,
      primariesById,
      secondariesById,
      state.grid ?? undefined
    );

    if (hull?.baseStats) {
      for (const [k, v] of Object.entries(hull.baseStats)) {
        if (v !== undefined) {
          newStats[k] = (newStats[k] || 0) + (v as number);
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
    const state = get();
    const { undoStack, redoStack, placed, modulesById } = state;
    const next = redoStack[redoStack.length - 1];
    if (!next) return;
    const newRedo = redoStack.slice(0, -1);
    const newUndo = [...undoStack, { placed }].slice(-100);

    const hull = state.hulls.find((h) => h.id === state.selectedHullId);
    const primariesById = state.primaries.reduce<Record<string, PrimaryArchetype>>((acc, curr) => {
      acc[curr.id] = curr;
      return acc;
    }, {});
    const secondariesById = state.secondaries.reduce<Record<string, SecondaryDef>>((acc, curr) => {
      acc[curr.id] = curr;
      return acc;
    }, {});

    const newStats = computeDerivedStats(
      next.placed,
      modulesById,
      hull,
      state.selectedPrimaryId || undefined,
      state.selectedSecondaryIds,
      primariesById,
      secondariesById,
      state.grid ?? undefined
    );

    if (hull?.baseStats) {
      for (const [k, v] of Object.entries(hull.baseStats)) {
        if (v !== undefined) {
          newStats[k] = (newStats[k] || 0) + (v as number);
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