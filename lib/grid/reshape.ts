import type { GridCell, SecondaryDef } from "@/types/fitting";
import { selectEdgeUtilityTargets, selectInnerUtilityTargets } from "@/lib/grid/placement";

export function applyReshape(
  cells: GridCell[],
  rows: number,
  cols: number,
  secondaries: SecondaryDef[],
  seed: string
): void {
  const sorted = [...secondaries].sort((a, b) => a.id.localeCompare(b.id));
  let edgeU = 0;
  let innerU = 0;
  for (const s of sorted) {
    if (s.reshape?.edge_utility) edgeU += s.reshape.edge_utility;
    if (s.reshape?.inner_utility) innerU += s.reshape.inner_utility;
  }
  if (edgeU > 0) {
    const targets = selectEdgeUtilityTargets(cells, rows, cols, edgeU, `${seed}|edgeU`);
    for (const idx of targets) cells[idx].slot = "Utility";
  }
  if (innerU > 0) {
    const targets = selectInnerUtilityTargets(cells, rows, cols, innerU, `${seed}|innerU`);
    for (const idx of targets) cells[idx].slot = "Utility";
  }
}

