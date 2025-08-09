import type { 
  ModuleDef, 
  ModulesById, 
  PlacedModule,
  PrimariesById,
  SecondariesById,
  ShipSizesById
} from "@/types/fitting";

function fmt(num: number, integer: boolean): number {
  return integer ? Math.round(num) : Math.round(num * 10) / 10;
}

export function computeDerivedStats(
  placed: PlacedModule[],
  modulesById: ModulesById,
  sizeId?: string,
  primaryId?: string,
  secondaryIds?: string[],
  shipSizesById?: ShipSizesById,
  primariesById?: PrimariesById,
  secondariesById?: SecondariesById,
  grid?: { rows: number; cols: number; cells: Array<{ r: number; c: number; slot?: string; hole?: boolean }> },
  bwConfig?: { k_bw?: number }
): Record<string, number> {
  const totals: Record<string, number> = Object.create(null);
  
  // Start with ship size base stats
  if (sizeId && shipSizesById) {
    const shipSize = shipSizesById[sizeId];
    if (shipSize?.baseStats) {
      for (const [k, v] of Object.entries(shipSize.baseStats)) {
        if (v !== undefined) {
          totals[k] = (totals[k] || 0) + v;
        }
      }
    }
  }
  
  // Add primary weapon base stats
  if (primaryId && primariesById) {
    const primary = primariesById[primaryId];
    if (primary?.baseStats) {
      for (const [k, v] of Object.entries(primary.baseStats)) {
        if (v !== undefined) {
          totals[k] = (totals[k] || 0) + v;
        }
      }
    }
  }
  
  // Add secondary weapon base stats
  if (secondaryIds && secondariesById) {
    for (const secId of secondaryIds) {
      const secondary = secondariesById[secId];
      if (secondary?.baseStats) {
        for (const [k, v] of Object.entries(secondary.baseStats)) {
          if (v !== undefined) {
            totals[k] = (totals[k] || 0) + v;
          }
        }
      }
    }
  }
  
  // --- Bandwidth (BW) computation ---
  // Defaults
  const baseBwBySize: Record<string, number> = { S: 7, M: 12, L: 21 };
  const k_bw = bwConfig?.k_bw ?? 0.01;
  // Determine BW limit from size
  let bwLimit = 0;
  if (sizeId && shipSizesById) {
    const shipSize = shipSizesById[sizeId];
    bwLimit = shipSize?.bwLimit ?? ((): number => {
      switch (sizeId) {
        case "Frigate":
          return 60;
        case "Destroyer":
          return 85;
        case "Cruiser":
          return 110;
        case "Capital":
          return 150;
        default:
          return 85;
      }
    })();
  }

  let bwTotal = 0;
  let mismatchAccumulator = 0;
  let mismatchCount = 0;

  if (grid && placed.length > 0) {
    for (const pm of placed) {
      const mod = modulesById[pm.moduleId];
      if (!mod) continue;
      const rotated = (mod.shape?.cells ?? []).map(({ dr, dc }) => {
        switch (pm.rotation) {
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
      const covered = rotated
        .map(({ dr, dc }) => ({ r: pm.anchor.r + dr, c: pm.anchor.c + dc }))
        .filter(({ r, c }) => r >= 0 && c >= 0 && r < grid.rows && c < grid.cols)
        .map(({ r, c }) => grid.cells[r * grid.cols + c]);
      const totalCells = covered.length;
      if (totalCells === 0) continue;
      const mismatched = covered.filter((cell) => cell.slot && mod.slot !== cell.slot).length;
      const m = totalCells > 0 ? mismatched / totalCells : 0;
      mismatchAccumulator += m;
      mismatchCount += 1;
      const baseBW = (mod.baseBW ?? baseBwBySize[mod.shape.sizeClass] ?? 10);
      bwTotal += baseBW * (1 + m);
    }
  }
  const bwOver = Math.max(0, bwTotal - bwLimit);
  const responsivenessMult = 1 / (1 + k_bw * bwOver);
  const avgMismatch = mismatchCount > 0 ? mismatchAccumulator / mismatchCount : 0;

  totals["BW_total"] = Math.round(bwTotal);
  totals["BW_limit"] = bwLimit;
  totals["BW_over"] = Math.round(bwOver);
  totals["BW_mismatchAvg"] = Math.round(avgMismatch * 100);
  totals["responsivenessMult"] = Math.round(responsivenessMult * 100) / 100;

  // Add module stats
  for (const p of placed) {
    const mod: ModuleDef | undefined = modulesById[p.moduleId];
    if (!mod) continue;
    const stats = mod.stats || {};
    for (const [k, v] of Object.entries(stats)) {
      // Some module stats are percentage bonuses
      if (k.endsWith("Bonus") || k === "ecm" || k === "critChance") {
        // These are additive percentage bonuses
        totals[k] = (totals[k] || 0) + (v as number);
      } else {
        // These are flat additions
        totals[k] = (totals[k] || 0) + (v as number);
      }
    }
  }
  
  // Calculate final stats with bonuses applied
  const finalStats: Record<string, number> = {};
  
  // Apply percentage bonuses to base stats
  for (const [k, v] of Object.entries(totals)) {
    if (k === "rofBonus" && totals.rateOfFire) {
      // Apply rate of fire bonus
      finalStats.rateOfFire = totals.rateOfFire * (1 + v / 100);
    } else if (k === "trackingBonus" && totals.tracking) {
      // Apply tracking bonus
      finalStats.tracking = totals.tracking * (1 + v / 100);
    } else if (k === "reloadBonus" && totals.rateOfFire) {
      // Reload bonus also affects rate of fire
      finalStats.rateOfFire = (finalStats.rateOfFire || totals.rateOfFire) * (1 + v / 100);
    } else if (k === "arcBonus" && totals.traverseSpeed) {
      // Arc bonus improves traverse speed
      finalStats.traverseSpeed = totals.traverseSpeed * (1 + v / 100);
    } else if (!k.endsWith("Bonus")) {
      // Regular stats
      finalStats[k] = v;
    }
  }
  
  // Ensure we have all base stats even if they weren't modified
  const defaultStats = [
    "hull", "armor", "speed", "evasion", "damage", "range", 
    "rateOfFire", "tracking", "traverseSpeed", "lockTime",
    "heatGeneration", "heatCapacity", "powerDraw", "powerCapacity",
    "ammoCapacity", "sensorStrength"
  ];
  
  for (const stat of defaultStats) {
    if (!(stat in finalStats) && totals[stat]) {
      finalStats[stat] = totals[stat];
    }
  }
  
  // Format the output
  const integerKeys = new Set([
    "hull", "armor", "damage", "range", "ammoCap", "powerGen", 
    "capBuffer", "heatCapacity", "powerCapacity", "ammoCapacity",
    "droneControl", "droneCapacity"
  ]);
  
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(finalStats)) {
    if (v !== 0 && v !== undefined) {
      out[k] = fmt(v, integerKeys.has(k));
    }
  }
  
  return out;
}