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
  secondariesById?: SecondariesById
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