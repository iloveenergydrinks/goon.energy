import type { Fit, ModulesById, PlacedModule } from "@/types/fitting";
import { computeDerivedStats } from "@/lib/fit/computeDerivedStats";

export type PlacementAction =
  | { type: "add"; placement: PlacedModule }
  | { type: "remove"; index: number }
  | { type: "move"; index: number; to: PlacedModule };

export function applyPlacement(
  fit: Fit,
  action: PlacementAction,
  modulesById: ModulesById
): Fit {
  const placed = [...fit.placed];
  if (action.type === "add") {
    placed.push(action.placement);
  } else if (action.type === "remove") {
    placed.splice(action.index, 1);
  } else if (action.type === "move") {
    placed[action.index] = action.to;
  }
  const derivedStats = computeDerivedStats(placed, modulesById);
  return { ...fit, placed, derivedStats };
}

