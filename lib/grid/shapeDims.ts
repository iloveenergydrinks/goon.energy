import type { PrimaryArchetype, ShipSize } from "@/types/fitting";

export function shapeDims(primary: PrimaryArchetype, size: ShipSize): { rows: number; cols: number } {
  const baseRows = size.rows;
  const baseCols = size.cols;
  switch (primary.shape) {
    case "long_narrow":
      return { rows: baseRows, cols: baseCols };
    case "wide": {
      const cols = Math.max(baseCols, baseRows + 2);
      return { rows: baseRows, cols: Math.min(cols, baseCols) };
    }
    case "square": {
      const side = Math.max(baseRows, baseCols - 1);
      const capped = Math.min(side, Math.max(baseRows, baseCols));
      return { rows: capped, cols: capped };
    }
    case "irregular":
    case "central_pockets":
      return { rows: baseRows, cols: baseCols };
    default:
      return { rows: baseRows, cols: baseCols };
  }
}

