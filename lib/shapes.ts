import type { ModuleDef } from "@/types/fitting";

export function rotateOffsets(
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

export function getCoveredIndices(
  module: ModuleDef,
  anchor: { r: number; c: number },
  rotation: 0 | 90 | 180 | 270,
  gridCols: number
): number[] {
  const rotated = rotateOffsets(module.shape.cells, rotation);
  return rotated.map(({ dr, dc }) => (anchor.r + dr) * gridCols + (anchor.c + dc));
}

