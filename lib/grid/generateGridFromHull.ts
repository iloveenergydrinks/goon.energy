import type { Grid, GridCell, Hull } from "@/types/fitting";

export function generateGridFromHull(hull: Hull): Grid {
  const { rows, cols, slots } = hull.grid;
  
  // Initialize all cells as empty
  const cells: GridCell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({ r, c });
    }
  }
  
  // Apply predefined slot types
  for (const slot of slots) {
    const idx = slot.r * cols + slot.c;
    if (idx >= 0 && idx < cells.length) {
      cells[idx].slot = slot.type;
    }
  }
  
  return {
    rows,
    cols,
    cells,
    hullId: hull.id,
  };
}
