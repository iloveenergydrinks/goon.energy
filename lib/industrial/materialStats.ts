// Material naming: Ore vs Refined
export function getMaterialDisplayName(materialName: string, isRefined: boolean): string {
  if (isRefined) {
    return materialName; // "Titanium"
  }
  return `${materialName} Ore`; // "Titanium Ore"
}

// Material base attribute values by tier
// These define how strong each material type is at each tier level

export interface MaterialTierStats {
  strength: number;      // Structural integrity, HP, armor
  conductivity: number;  // Energy transfer, power systems, energy weapons
  density: number;       // Mass, compactness (lower = lighter)
  reactivity: number;    // Activation speed, recharge rate, processing
  stability: number;     // Reliability, reduces malfunction chance
  elasticity: number;    // Flexibility, damage absorption, resistances
}

export type MaterialType = 
  | 'Titanium' | 'Iron' | 'Aluminum'  // Structural metals
  | 'Plasma' | 'Quantum' | 'Dark matter'  // Energy/exotic
  | 'Silicon' | 'Copper' | 'Gold';  // Electronics

// Base stat progression by tier (T1 = 1.0×, T5 = 3.0×)
const TIER_MULTIPLIERS = {
  1: 1.0,
  2: 1.5,
  3: 2.0,
  4: 2.5,
  5: 3.0
};

// Material archetypes - EMPTY, DB is source of truth
// UI components should fetch and cache material stats on mount
export const MATERIAL_ARCHETYPES: Partial<Record<MaterialType, MaterialTierStats>> = {};

// Runtime cache for UI components (populated via fetchMaterialStatsCache)
let materialStatsCache: Record<string, MaterialTierStats> = {};

export function getMaterialStatsFromCache(materialType: string): MaterialTierStats | null {
  return materialStatsCache[materialType] || null;
}

export function setMaterialStatsCache(materialType: string, stats: MaterialTierStats) {
  materialStatsCache[materialType] = stats;
}

// Fetch material stats from API and populate cache (for client-side use)
export async function fetchMaterialStatsCache() {
  try {
    const response = await fetch('/api/materials/stats');
    if (response.ok) {
      const stats = await response.json();
      materialStatsCache = stats;
      return materialStatsCache;
    }
  } catch (error) {
    console.error('Failed to fetch material stats cache:', error);
  }
  return materialStatsCache;
}

// Sync version for UI previews - uses runtime cache
// Cache is populated on component mount via fetchMaterialStatsCache
export function getMaterialStats(materialType: string, tier: number): MaterialTierStats {
  // Try runtime cache first (populated from DB)
  const cached = materialStatsCache[materialType];
  const baseStats = cached || MATERIAL_ARCHETYPES[materialType as MaterialType];
  
  if (!baseStats) {
    // Fallback to defaults if not in cache yet
    return {
      strength: 100,
      conductivity: 100,
      density: 100,
      reactivity: 100,
      stability: 100,
      elasticity: 100
    };
  }
  
  const multiplier = TIER_MULTIPLIERS[tier as keyof typeof TIER_MULTIPLIERS] || 1.0;
  
  return {
    strength: baseStats.strength * multiplier,
    conductivity: baseStats.conductivity * multiplier,
    density: baseStats.density * multiplier,
    reactivity: baseStats.reactivity * multiplier,
    stability: baseStats.stability * multiplier,
    elasticity: baseStats.elasticity * multiplier
  };
}

// PRIMARY: Database-first material stats
// Always queries DB, uses archetype as fallback cache only
export async function getMaterialStatsAsync(materialType: string, tier: number): Promise<MaterialTierStats> {
  // Query database first (source of truth)
  const { prisma } = await import('@/lib/prisma');
  const material = await prisma.material.findFirst({
    where: { name: materialType }
  });
  
  const multiplier = TIER_MULTIPLIERS[tier as keyof typeof TIER_MULTIPLIERS] || 1.0;
  
  if (material && material.baseAttributes) {
    // Use DB attributes (primary source)
    const baseAttrs = material.baseAttributes as any;
    return {
      strength: (baseAttrs.strength || 100) * multiplier,
      conductivity: (baseAttrs.conductivity || 100) * multiplier,
      density: (baseAttrs.density || 100) * multiplier,
      reactivity: (baseAttrs.reactivity || 100) * multiplier,
      stability: (baseAttrs.stability || 100) * multiplier,
      elasticity: (baseAttrs.elasticity || 100) * multiplier
    };
  }
  
  // Fallback to archetype cache if DB lookup fails
  const archetype = MATERIAL_ARCHETYPES[materialType as MaterialType];
  if (archetype) {
    return {
      strength: archetype.strength * multiplier,
      conductivity: archetype.conductivity * multiplier,
      density: archetype.density * multiplier,
      reactivity: archetype.reactivity * multiplier,
      stability: archetype.stability * multiplier,
      elasticity: archetype.elasticity * multiplier
    };
  }
  
  // Ultimate fallback
  return {
    strength: 100 * multiplier,
    conductivity: 100 * multiplier,
    density: 100 * multiplier,
    reactivity: 100 * multiplier,
    stability: 100 * multiplier,
    elasticity: 100 * multiplier
  };
}

// Map module stats to material attributes
export const STAT_TO_ATTRIBUTE: Record<string, keyof MaterialTierStats> = {
  // Structural stats
  'shieldHP': 'strength',
  'armor': 'strength',
  'hullHP': 'strength',
  'structuralHP': 'strength',
  
  // Energy stats
  'powerGen': 'conductivity',
  'powerDraw': 'conductivity',
  'capacitor': 'conductivity',
  'energyDamage': 'conductivity',
  
  // Speed/activation stats
  'rechargeRate': 'reactivity',
  'activationTime': 'reactivity',
  'cycleTime': 'reactivity',
  'warpSpeed': 'reactivity',
  
  // Mass/mobility stats
  'mass': 'density',
  'inertia': 'density',
  'cargoCapacity': 'density',
  
  // Reliability stats
  'overloadCapability': 'stability',
  'reliability': 'stability',
  'jamResistance': 'stability',
  
  // Defense/absorption stats
  'damageResistance': 'elasticity',
  'shieldRecharge': 'elasticity',
  'damageAbsorption': 'elasticity',
  
  // Electronics/targeting
  'tracking': 'conductivity',
  'scanResolution': 'conductivity',
  'range': 'reactivity',
  'optimalRange': 'reactivity',
  
  // Damage stats
  'damage': 'conductivity', // Energy weapons
  'kineticDamage': 'strength', // Projectile weapons
  'explosiveDamage': 'reactivity', // Missiles
  'fireRate': 'reactivity'
};

// Get which attribute affects a given stat
export function getAttributeForStat(statName: string): keyof MaterialTierStats {
  return STAT_TO_ATTRIBUTE[statName] || 'strength'; // Default to strength
}

// Describe what each material is good for (UI helper)
export function getMaterialDescription(materialType: string): { primary: string; secondary: string; weakness: string } {
  const descriptions: Record<MaterialType, { primary: string; secondary: string; weakness: string }> = {
    'Titanium': {
      primary: 'HP, Armor, Structural Integrity',
      secondary: 'Stability, Reliability',
      weakness: 'Heavy, Slow, Poor Conductor'
    },
    'Iron': {
      primary: 'Armor, Structure',
      secondary: 'Stability',
      weakness: 'Very Heavy, Slow'
    },
    'Aluminum': {
      primary: 'Lightweight, Fast',
      secondary: 'Flexibility, Conductivity',
      weakness: 'Weak Structure, Low HP'
    },
    'Plasma': {
      primary: 'Energy Systems, Recharge',
      secondary: 'Lightweight, Fast Activation',
      weakness: 'Fragile, Unstable'
    },
    'Quantum': {
      primary: 'Supreme Energy, Near-Zero Mass',
      secondary: 'Instant Activation',
      weakness: 'Extremely Unstable, Fragile'
    },
    'Dark matter': {
      primary: 'Exotic Properties, High Energy',
      secondary: 'Near-Zero Mass, Flexibility',
      weakness: 'Extremely Unstable'
    },
    'Silicon': {
      primary: 'Electronics, Sensors, Tracking',
      secondary: 'Processing Speed, Stability',
      weakness: 'Brittle, Weak Structure'
    },
    'Copper': {
      primary: 'Conductivity, Electronics',
      secondary: 'Reliable, Moderate Structure',
      weakness: 'Heavy'
    },
    'Gold': {
      primary: 'Superior Conductivity, Stability',
      secondary: 'Never Corrodes',
      weakness: 'Very Heavy, Soft/Weak, Expensive'
    }
  };
  
  return descriptions[materialType as MaterialType] || {
    primary: 'Unknown',
    secondary: 'Unknown',
    weakness: 'Unknown'
  };
}

