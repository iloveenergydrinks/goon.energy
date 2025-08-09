import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import type { Fit, ModulesById } from "@/types/fitting";
import type { PrimaryArchetype, SecondaryDef, ShipSize } from "@/types/fitting";
import { generateGrid } from "@/lib/grid/generateGrid";

interface PermalinkPayloadV1 {
  v: string; // version
  seed: string;
  sizeId: ShipSize["id"];
  primaryId: string;
  secondaryIds: string[];
  placed: Fit["placed"];
}

export function encodePermalink(fit: Fit): string {
  const payload: PermalinkPayloadV1 = {
    v: fit.version,
    seed: fit.seed,
    sizeId: fit.sizeId,
    primaryId: fit.primaryId,
    secondaryIds: fit.secondaryIds,
    placed: fit.placed,
  };
  const json = JSON.stringify(payload);
  return compressToEncodedURIComponent(json);
}

export function decodePermalink(
  code: string,
  catalog: {
    primary: PrimaryArchetype | undefined;
    secondaries: SecondaryDef[];
    size: ShipSize | undefined;
    modulesById: ModulesById;
  }
): Fit | null {
  try {
    const json = decompressFromEncodedURIComponent(code);
    if (!json) return null;
    const parsed = JSON.parse(json) as PermalinkPayloadV1;
    const { primary, secondaries, size, modulesById } = catalog;
    if (!primary || !size) return null;
    const grid = generateGrid(primary, secondaries, size, parsed.seed);

    // Validate placements against new grid; drop invalid
    const validPlaced = parsed.placed.filter((p) => {
      // We'll re-check in the UI using canPlace with occupancy; here only grid-level quick check
      for (const cell of modulesById[p.moduleId].shape.cells) {
        const r = p.anchor.r + cell.dr;
        const c = p.anchor.c + cell.dc;
        if (r < 0 || c < 0 || r >= grid.rows || c >= grid.cols) return false;
        const idx = r * grid.cols + c;
        const g = grid.cells[idx];
        if (g.hole) return false;
      }
      return true;
    });

    return {
      id: undefined,
      name: "Imported Fit",
      seed: parsed.seed,
      sizeId: parsed.sizeId,
      primaryId: parsed.primaryId,
      secondaryIds: parsed.secondaryIds,
      grid,
      placed: validPlaced,
      derivedStats: {},
      version: parsed.v,
    };
  } catch (e) {
    return null;
  }
}

