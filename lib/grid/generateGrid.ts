import type { Grid, GridCell, PrimaryArchetype, SecondaryDef, ShipSize } from "@/types/fitting";
import { createRng } from "@/lib/rng";
import { shapeDims } from "@/lib/grid/shapeDims";
import { carveCentralPockets, carveIrregular } from "@/lib/grid/carving";
import { applySecondaries, ratioToCounts } from "@/lib/grid/ratios";
import { placeType } from "@/lib/grid/placement";
import { applyReshape } from "@/lib/grid/reshape";

function initCells(rows: number, cols: number): GridCell[] {
  const cells: GridCell[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      cells.push({ r, c });
    }
  }
  return cells;
}

export function generateGrid(
  primary: PrimaryArchetype,
  secondaries: SecondaryDef[],
  size: ShipSize,
  seed: string
): Grid {
  const rng = createRng(seed);
  const { rows, cols } = shapeDims(primary, size);
  const cells = initCells(rows, cols);
  // Carving per shape
  if (primary.shape === "irregular") {
    carveIrregular(cells, rows, cols, rng);
  }
  if (primary.shape === "central_pockets") {
    carveCentralPockets(cells, rows, cols, rng);
  }

  // Ratios
  const ratio = applySecondaries(primary.baseRatio, secondaries);
  const N = cells.filter((c) => !c.hole).length;
  const [nP, nA, nU] = ratioToCounts(ratio.P, ratio.A, ratio.U, N);

  // Placement order P -> A -> U
  placeType(cells, rows, cols, "Power", nP, `${seed}|P`);
  // Ammo bias combined from secondaries
  let ammoBias = 0;
  for (const s of [...secondaries].sort((a, b) => a.id.localeCompare(b.id))) {
    if (typeof s.reshape?.ammo_bias === "number") ammoBias += s.reshape.ammo_bias;
  }
  if (ammoBias > 3) ammoBias = 3;
  if (ammoBias < -3) ammoBias = -3;
  placeType(cells, rows, cols, "Ammo", nA, `${seed}|A`, ammoBias);
  placeType(cells, rows, cols, "Utility", nU, `${seed}|U`);

  // Reshape post-placement
  applyReshape(cells, rows, cols, secondaries, seed);

  return {
    rows,
    cols,
    cells,
    meta: {
      ratio: { P: ratio.P, A: ratio.A, U: ratio.U },
      reshape: {},
      seed,
    },
  };
}

