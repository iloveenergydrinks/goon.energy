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

// Material archetypes - defines what each material is good at
export const MATERIAL_ARCHETYPES: Record<MaterialType, MaterialTierStats> = {
  // === STRUCTURAL METALS ===
  'Titanium': {
    strength: 200,      // Excellent for HP/armor
    conductivity: 40,   // Poor conductor
    density: 120,       // Medium-heavy
    reactivity: 50,     // Slow to process
    stability: 150,     // Very stable
    elasticity: 100     // Moderate flexibility
  },
  'Iron': {
    strength: 150,      // Good structure
    conductivity: 60,   // Poor conductor
    density: 140,       // Heavy
    reactivity: 40,     // Slow
    stability: 120,     // Stable
    elasticity: 80      // Less flexible
  },
  'Aluminum': {
    strength: 80,       // Weak structure
    conductivity: 90,   // Decent conductor
    density: 60,        // Very light
    reactivity: 100,    // Fast to process
    stability: 100,     // Moderate stability
    elasticity: 120     // Very flexible
  },
  
  // === ENERGY MATERIALS ===
  'Plasma': {
    strength: 30,       // Weak structure
    conductivity: 180,  // Excellent conductor
    density: 50,        // Very light
    reactivity: 200,    // Extremely reactive
    stability: 80,      // Unstable
    elasticity: 60      // Not flexible
  },
  'Quantum': {
    strength: 40,       // Weak structure
    conductivity: 250,  // Supreme conductor
    density: 20,        // Nearly massless
    reactivity: 250,    // Instant reaction
    stability: 60,      // Very unstable
    elasticity: 50      // Brittle
  },
  'Dark matter': {
    strength: 100,      // Moderate structure
    conductivity: 200,  // Excellent conductor
    density: 10,        // Exotic (near-zero mass)
    reactivity: 220,    // Highly reactive
    stability: 40,      // Extremely unstable
    elasticity: 180     // Exotic properties
  },
  
  // === ELECTRONICS ===
  'Silicon': {
    strength: 60,       // Weak/brittle
    conductivity: 150,  // Good conductor (semiconductor)
    density: 80,        // Light
    reactivity: 130,    // Fast processing
    stability: 140,     // Very stable
    elasticity: 40      // Brittle
  },
  'Copper': {
    strength: 100,      // Moderate structure
    conductivity: 180,  // Excellent conductor
    density: 130,       // Medium-heavy
    reactivity: 110,    // Moderate reaction
    stability: 130,     // Stable
    elasticity: 90      // Moderate
  },
  'Gold': {
    strength: 70,       // Soft/weak
    conductivity: 220,  // Superior conductor
    density: 150,       // Very heavy
    reactivity: 100,    // Moderate
    stability: 160,     // Extremely stable (doesn't corrode)
    elasticity: 110     // Malleable
  }
};

// Get material stats for a specific tier
export function getMaterialStats(materialType: string, tier: number): MaterialTierStats {
  const archetype = MATERIAL_ARCHETYPES[materialType as MaterialType];
  if (!archetype) {
    // Return default/balanced stats for unknown materials
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
    strength: archetype.strength * multiplier,
    conductivity: archetype.conductivity * multiplier,
    density: archetype.density * multiplier,
    reactivity: archetype.reactivity * multiplier,
    stability: archetype.stability * multiplier,
    elasticity: archetype.elasticity * multiplier
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

