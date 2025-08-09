import type { Grid, ModuleDef, ModulesById, PlacedModule } from "@/types/fitting";

function rotateOffsets(
  cells: Array<{ dr: number; dc: number }>,
  rotation: 0 | 90 | 180 | 270
): Array<{ dr: number; dc: number }> {
  if (rotation === 0) return cells;
  return cells.map(({ dr, dc }) => {
    switch (rotation) {
      case 90:
        return { dr: dc, dc: -dr };
      case 180:
        return { dr: -dr, dc: -dc };
      case 270:
        return { dr: -dc, dc: dr };
      default:
        return { dr, dc };
    }
  });
}

export function canPlace(
  grid: Grid,
  module: ModuleDef,
  anchor: { r: number; c: number },
  rotation: 0 | 90 | 270 | 180,
  existing: PlacedModule[],
  modulesById: ModulesById
): { ok: boolean; reason?: string } {
  if (!module.shape.rotations.includes(rotation)) {
    return { ok: false, reason: "rotation-not-allowed" };
  }
  const rotated = rotateOffsets(module.shape.cells, rotation);
  // Build occupied index set from existing placements
  const occupied = new Set<number>();
  for (const pm of existing) {
    const m = modulesById[pm.moduleId];
    if (!m) continue;
    const offs = rotateOffsets(m.shape.cells, pm.rotation);
    for (const { dr, dc } of offs) {
      const r = pm.anchor.r + dr;
      const c = pm.anchor.c + dc;
      if (r < 0 || c < 0 || r >= grid.rows || c >= grid.cols) continue;
      occupied.add(r * grid.cols + c);
    }
  }

  for (const { dr, dc } of rotated) {
    const r = anchor.r + dr;
    const c = anchor.c + dc;
    if (r < 0 || c < 0 || r >= grid.rows || c >= grid.cols) {
      return { ok: false, reason: "out-of-bounds" };
    }
    const idx = r * grid.cols + c;
    const cell = grid.cells[idx];
    if (cell.hole) return { ok: false, reason: "hole" };
    // Allow slot mismatch; BW system will apply soft penalties based on mismatch.
    if (occupied.has(idx)) return { ok: false, reason: "overlap" };
  }
  return { ok: true };
}

