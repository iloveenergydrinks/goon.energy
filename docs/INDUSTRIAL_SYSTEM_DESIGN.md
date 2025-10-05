# Industrial & Upgrading System Design for goon.energy

## Overview
An industrial system that transforms your ship fitting platform into a complete economy-driven game where material quality, research, and manufacturing directly impact ship performance.

## Core Concepts

### 1. Material Tiers & Attributes

#### Material Tiers (T1-T5)
```typescript
interface MaterialTier {
  tier: 1 | 2 | 3 | 4 | 5;
  purity: number; // 0.0 - 1.0
  displayGrade: "F" | "E" | "D" | "C" | "B" | "A" | "S"; // Visual representation
  attributes: MaterialAttributes;
  rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
  baseValue: number; // Market value multiplier
}

interface MaterialAttributes {
  // Core attributes affecting different aspects
  strength: number;       // Affects hull HP, module durability
  conductivity: number;    // Affects power generation, energy weapon damage
  density: number;        // Affects mass, mobility
  reactivity: number;     // Affects processing speed, capacitor recharge
  stability: number;      // Affects failure rates, research success
  elasticity: number;     // Affects damage resistance, stress tolerance
}
```

**Tier Breakdown:**
- **Tier 1 (F-E)**: Basic materials, 0-30% purity, widely available
- **Tier 2 (D-C)**: Improved, 30-50% purity, common in better regions
- **Tier 3 (B)**: High quality, 50-70% purity, requires good refining
- **Tier 4 (A)**: Premium, 70-90% purity, rare and valuable
- **Tier 5 (S)**: Legendary, 90-100% purity, extremely rare

### 2. Blueprint Research System

```typescript
interface Blueprint {
  id: string;
  type: "hull" | "module" | "primary" | "secondary";
  baseItemId: string; // References existing item
  
  // Research progress
  researchLevel: number; // 0 to infinity
  researchPoints: number; // Current points invested
  nextLevelRequirement: number; // Points needed for next level
  
  // Research configuration
  researchAggressiveness: "safe" | "normal" | "aggressive" | "reckless";
  researchFocus: ResearchFocus[];
  
  // Current improvements
  statImprovements: Record<string, number>; // Percentage improvements
  materialEfficiency: number; // Reduces material requirements
  productionTime: number; // Base production time modifier
  
  // Risk factors
  lastResearchSuccess: boolean;
  consecutiveFailures: number;
  
  // Industrial espionage
  isShared: boolean;
  sharedWith: string[]; // Player IDs
  securityLevel: number; // 0-100, affects theft chance
}

interface ResearchFocus {
  stat: string; // e.g., "powerGen", "capBuffer", "repairRate"
  weight: number; // 0-1, how much focus on this stat
  scalingType: "linear" | "logarithmic" | "exponential_decay";
}
```

**Key Research Mechanics:**
- **Indefinite Improvement**: No cap on research levels
- **Diminishing Returns**: Logarithmic scaling for stats like speed
- **Research Aggressiveness**:
  - Safe: 95% success, 0.5x speed
  - Normal: 85% success, 1x speed  
  - Aggressive: 70% success, 1.5x speed
  - Reckless: 50% success, 2x speed
- **Stasis Requirement**: Blueprint locked during research
- **Failure Consequences**: Lost materials, time, possible blueprint damage

### 3. Refining Process

```typescript
interface RefiningCycle {
  inputMaterial: {
    id: string;
    quantity: number;
    currentPurity: number;
    currentTier: number;
  };
  
  facility: RefiningFacility;
  cycleNumber: number; // 1st, 2nd, 3rd cycle etc.
  
  output: {
    refinedQuantity: number; // Always less than input
    newPurity: number; // Higher than input
    newTier: number; // Based on purity breakpoints
    wasteQuantity: number; // Lost material
  };
  
  processingTime: number; // In seconds/minutes
  energyCost: number;
}

interface RefiningFacility {
  id: string;
  type: "basic" | "advanced" | "specialized";
  efficiency: number; // 0.5 - 0.95, affects material loss
  maxPurity: number; // Cap on achievable purity
  specialization?: string[]; // Specific materials with bonus
  throughput: number; // Units per cycle
}
```

**Refining Math Example:**
```typescript
// Starting with 10,000 units of raw material (Tier 1, 20% purity)
Cycle 1: 10,000 → 7,000 units @ 40% purity (Tier 2) + 3,000 waste
Cycle 2: 7,000 → 4,900 units @ 60% purity (Tier 3) + 2,100 waste  
Cycle 3: 4,900 → 3,430 units @ 80% purity (Tier 4) + 1,470 waste
Cycle 4: 3,430 → 2,401 units @ 95% purity (Tier 5) + 1,029 waste
```

### 4. Manufacturing System

```typescript
interface ManufacturingJob {
  blueprintId: string;
  blueprintLevel: number; // Current research level
  
  materials: {
    itemId: string;
    requiredQuantity: number;
    providedMaterial: {
      id: string;
      tier: number;
      purity: number;
      quantity: number;
    };
  }[];
  
  facility: ManufacturingFacility;
  
  // Output predictions
  outputQuality: number; // 0-100, based on materials and facility
  statBonuses: Record<string, number>; // From high-tier materials
  productionTime: number;
  successChance: number; // Can fail with poor materials/facility
}

interface ManufacturingFacility {
  id: string;
  tier: "basic" | "standard" | "advanced" | "capital";
  
  capabilities: {
    maxHullSize: "Frigate" | "Destroyer" | "Cruiser" | "Capital";
    moduleTypes: SlotType[];
    qualityBonus: number; // 0-50% bonus to output quality
    speedMultiplier: number; // 0.5x - 2x production speed
  };
  
  requirements: {
    powerDraw: number;
    workforce: number;
    maintenance: number; // Per hour cost
  };
}
```

### 5. How Materials Affect Final Products

```typescript
interface MaterialEffect {
  // For Hulls
  hullHP: (materialTier: number) => number; // +5% per tier
  powerCapacity: (conductivity: number) => number; // Based on conductor quality
  mass: (density: number) => number; // Affects mobility
  
  // For Modules
  statMultiplier: (stat: string, materialQuality: number) => number;
  durability: (strength: number) => number; // Module HP
  efficiency: (conductivity: number, reactivity: number) => number;
  
  // Special effects at high tiers
  specialAbilities: {
    tier: number;
    ability: string; // e.g., "Self-repair", "Overcharge capacity"
    chance: number; // Chance to get this ability
  }[];
}
```

**Example: Building a Module with Different Materials**

```typescript
// Base Module: Flux Capacitors (capBuffer: 25)

// With Tier 1 Materials (avg 25% purity):
- capBuffer: 25 * 1.0 = 25
- durability: 100 HP
- efficiency: 85%
- No special abilities

// With Tier 3 Materials (avg 60% purity):
- capBuffer: 25 * 1.3 = 32.5
- durability: 150 HP  
- efficiency: 100%
- 10% chance for "Quick Charge" ability

// With Tier 5 Materials (avg 95% purity):
- capBuffer: 25 * 1.6 = 40
- durability: 250 HP
- efficiency: 115%
- 40% chance for "Overcharge" ability
- 20% chance for "Self-Repair" ability
```

### 6. Resource Types & Mining

```typescript
interface ResourceNode {
  id: string;
  type: "asteroid" | "gas_cloud" | "planetary" | "salvage";
  
  resources: {
    resourceId: string;
    basePurity: number; // Starting purity
    abundance: number; // How much available
    extractionRate: number; // Units per minute
  }[];
  
  location: {
    sector: string;
    coordinates: [number, number, number];
    security: "high" | "low" | "null";
  };
  
  depletion: {
    current: number; // 0-100%
    regeneration: number; // % per hour, if any
  };
}

interface Resource {
  id: string;
  name: string; // e.g., "Titanium", "Plasma Gas", "Quantum Crystals"
  category: "metal" | "gas" | "crystal" | "composite";
  
  baseAttributes: MaterialAttributes;
  
  // Where it excels
  primaryUse: string[]; // ["hulls", "power_modules", "weapons"]
  
  // Market dynamics
  basePrice: number;
  volatility: number; // Price fluctuation range
}
```

### 7. Supply Chain & Logistics

```typescript
interface SupplyChain {
  id: string;
  owner: string;
  
  nodes: {
    extraction: ExtractionNode[];
    refining: RefiningNode[];
    manufacturing: ManufacturingNode[];
    storage: StorageNode[];
  };
  
  routes: TransportRoute[];
  
  security: {
    defenseFleets: string[]; // Fleet IDs
    scanners: number; // Detection capability
    insurance: number; // Coverage amount
  };
  
  efficiency: number; // Overall chain efficiency
  vulnerabilities: string[]; // Weak points
}

interface TransportRoute {
  from: string; // Node ID
  to: string; // Node ID
  
  cargo: {
    ships: number;
    capacity: number;
    speed: number;
    protection: number; // Defense rating
  };
  
  schedule: {
    frequency: number; // Trips per hour
    automated: boolean;
    fuelCost: number;
  };
  
  risks: {
    piracyChance: number;
    routeExposure: number; // How visible to enemies
  };
}
```

### 8. Industrial Espionage

```typescript
interface EspionageAction {
  type: "steal_blueprint" | "sabotage_facility" | "corrupt_research";
  target: string; // Player or facility ID
  
  requirements: {
    infiltrationLevel: number; // 0-100
    hackingTools: string[]; // Required items
    riskLevel: number; // Chance of detection
  };
  
  rewards: {
    blueprintData?: {
      blueprintId: string;
      researchLevel: number; // May get partial data
      completeness: number; // % of full blueprint
    };
    
    facilityDamage?: number; // Production slowdown
    researchCorruption?: number; // Sets back research
  };
  
  consequences: {
    reputationLoss: number;
    bounty: number; // If caught
    retaliation: boolean; // Target gets notification
  };
}
```

## Implementation Phases

### Phase 1: Material System (MVP)
1. Add material tiers to database
2. Create refining mechanics
3. Update module/hull creation to use materials
4. Simple UI for material management

### Phase 2: Blueprint Research
1. Convert existing items to blueprints
2. Add research progression system
3. Implement research UI with risk/reward choices
4. Add blueprint sharing mechanics

### Phase 3: Manufacturing Facilities
1. Create facility types and progression
2. Add production queues
3. Implement quality bonuses from facilities
4. Add facility management UI

### Phase 4: Supply Chains
1. Resource extraction mechanics
2. Transport and logistics
3. Supply chain visualization
4. Security and protection systems

### Phase 5: Advanced Features
1. Industrial espionage
2. Market dynamics
3. Corporation/alliance industry
4. Territory control for resources

## Database Schema Additions

```prisma
model Material {
  id            String   @id
  name          String
  category      String   // metal, gas, crystal, composite
  basePurity    Float    // 0.0 - 1.0
  tier          Int      // 1-5
  attributes    Json     // MaterialAttributes
  currentStock  Int      @default(0)
  ownerId       String?
  locationId    String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Blueprint {
  id                  String   @id
  type               String   // hull, module, primary, secondary
  baseItemId         String
  ownerId           String
  researchLevel      Int      @default(0)
  researchPoints     Float    @default(0)
  statImprovements   Json
  materialEfficiency Float    @default(1.0)
  isOriginal        Boolean  @default(true)
  isShared          Boolean  @default(false)
  sharedWith        String[] @default([])
  inResearch        Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model RefiningJob {
  id              String   @id @default(cuid())
  materialId      String
  inputQuantity   Float
  inputPurity     Float
  cycleNumber     Int
  facilityId      String
  outputQuantity  Float
  outputPurity    Float
  wasteQuantity   Float
  completedAt     DateTime?
  ownerId         String
  createdAt       DateTime @default(now())
}

model ManufacturingJob {
  id              String   @id @default(cuid())
  blueprintId     String
  materials       Json     // Array of material inputs
  facilityId      String
  outputQuality   Float
  statBonuses     Json
  status          String   // queued, inProgress, completed, failed
  completedAt     DateTime?
  productId       String?  // Created item ID
  ownerId         String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Facility {
  id              String   @id @default(cuid())
  name            String
  type            String   // refining, manufacturing, research
  tier            String   // basic, standard, advanced, capital
  capabilities    Json
  location        Json
  ownerId         String
  efficiency      Float    @default(1.0)
  condition       Float    @default(100.0) // Damage/maintenance
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model ResourceNode {
  id              String   @id @default(cuid())
  type            String   // asteroid, gas_cloud, planetary
  resources       Json     // Available resources and purities
  location        Json
  depletion       Float    @default(100.0)
  regeneration    Float    @default(0.0)
  discoveredBy    String?
  claimedBy       String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## UI/UX Concepts

### Material Quality Visualizer
- Color-coded tiers (Gray → Green → Blue → Purple → Orange → Red)
- Purity bars with percentage
- Attribute spider charts
- Quick comparison tooltips

### Blueprint Research Interface
- Research tree visualization
- Risk/reward sliders
- Progress tracking with ETA
- Stat improvement preview
- Research queue management

### Manufacturing Dashboard
- Production queue timeline
- Material requirement checker
- Quality prediction display
- Facility status monitors
- Cost/benefit analysis tools

### Supply Chain Map
- Node and route visualization
- Real-time cargo tracking
- Security heat map
- Efficiency metrics
- Bottleneck identification

## Balancing Considerations

1. **Material Scarcity**: Higher tiers exponentially rarer
2. **Refining Loss**: 30% loss per cycle maintains value
3. **Research Time**: Exponential increase per level
4. **Facility Costs**: Significant investment for advanced tiers
5. **Transport Risk**: Higher value = higher piracy chance
6. **Blueprint Theft**: Risk/reward for sharing
7. **Market Dynamics**: Supply/demand affects all prices
8. **Power Creep**: Logarithmic scaling prevents runaway stats

## Success Metrics

- **Player Engagement**: Time spent in industrial activities
- **Economic Activity**: Trading volume and variety
- **Progression Satisfaction**: Blueprint research completion rates
- **Risk Taking**: Aggressive research attempts
- **Collaboration**: Blueprint sharing frequency
- **Competition**: Industrial espionage attempts
- **Market Health**: Price stability and liquidity
- **Content Longevity**: Continued research after "max" levels















