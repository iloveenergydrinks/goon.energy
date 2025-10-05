// Industrial System Type Definitions

// Material Tiers and Quality
export type MaterialTier = 1 | 2 | 3 | 4 | 5;
export type MaterialGrade = "F" | "E" | "D" | "C" | "B" | "A" | "S";
export type MaterialCategory = "metal" | "gas" | "crystal" | "composite" | "exotic";
export type MaterialRarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";

export interface MaterialAttributes {
  strength: number;       // 0-1, affects hull HP, module durability
  conductivity: number;   // 0-1, affects power generation, energy weapon damage  
  density: number;        // 0-1, affects mass, mobility
  reactivity: number;     // 0-1, affects processing speed, capacitor recharge
  stability: number;      // 0-1, affects failure rates, research success
  elasticity: number;     // 0-1, affects damage resistance, stress tolerance
}

export interface Material {
  id: string;
  name: string;
  category: MaterialCategory;
  tier: MaterialTier;
  purity: number; // 0.0 - 1.0
  displayGrade: MaterialGrade;
  attributes: MaterialAttributes;
  rarity: MaterialRarity;
  baseValue: number;
  quantity: number;
  ownerId?: string;
  locationId?: string;
  stackable: boolean;
}

// Blueprint Research System
export type ResearchAggressiveness = "safe" | "normal" | "aggressive" | "reckless";
export type ScalingType = "linear" | "logarithmic" | "exponential_decay";
export type BlueprintType = "hull" | "module" | "primary" | "secondary";

export interface ResearchFocus {
  stat: string; // e.g., "powerGen", "capBuffer", "repairRate"
  weight: number; // 0-1, how much focus on this stat
  scalingType: ScalingType;
}

export interface Blueprint {
  id: string;
  name: string;
  type: BlueprintType;
  baseItemId: string; // References existing hull/module/primary/secondary
  ownerId: string;
  
  // Research progress
  researchLevel: number; // 0 to infinity
  researchPoints: number; // Current points invested
  nextLevelRequirement: number; // Points needed for next level
  
  // Research configuration
  researchAggressiveness: ResearchAggressiveness;
  researchFocus: ResearchFocus[];
  inResearch: boolean;
  researchStartTime?: Date;
  estimatedCompletion?: Date;
  
  // Current improvements
  statImprovements: Record<string, number>; // Percentage improvements
  materialEfficiency: number; // Reduces material requirements (0.5 = 50% less materials needed)
  productionTimeModifier: number; // Multiplier for production time
  
  // Risk factors
  lastResearchSuccess: boolean;
  consecutiveFailures: number;
  criticalFailureChance: number; // Chance of blueprint damage
  
  // Industrial espionage
  isOriginal: boolean;
  isShared: boolean;
  sharedWith: string[]; // Player IDs
  securityLevel: number; // 0-100, affects theft chance
  copyNumber?: number; // For blueprint copies
  maxRuns?: number; // Limited use blueprints
}

// Refining System
export type FacilityType = "basic" | "standard" | "advanced" | "specialized" | "capital";

export interface RefiningFacility {
  id: string;
  name: string;
  type: FacilityType;
  tier: number; // 1-5
  efficiency: number; // 0.5 - 0.95, affects material loss
  maxPurity: number; // Cap on achievable purity (0.6 for basic, 0.99 for specialized)
  specialization?: MaterialCategory[]; // Specific materials with bonus efficiency
  throughput: number; // Units per cycle
  powerRequirement: number;
  maintenanceCost: number; // Per hour
  condition: number; // 0-100, affects efficiency
  location?: string;
  ownerId: string;
}

export interface RefiningCycle {
  id: string;
  inputMaterial: {
    materialId: string;
    quantity: number;
    currentPurity: number;
    currentTier: MaterialTier;
  };
  facilityId: string;
  cycleNumber: number; // 1st, 2nd, 3rd cycle etc.
  
  output: {
    refinedQuantity: number; // Always less than input
    newPurity: number; // Higher than input  
    newTier: MaterialTier; // Based on purity breakpoints
    wasteQuantity: number; // Lost material
    byproducts?: { // Sometimes get useful byproducts
      materialId: string;
      quantity: number;
    }[];
  };
  
  processingTime: number; // In seconds
  energyCost: number;
  status: "queued" | "processing" | "completed" | "failed";
  completedAt?: Date;
}

// Manufacturing System
export interface ManufacturingFacility {
  id: string;
  name: string;
  type: FacilityType;
  
  capabilities: {
    maxHullSize: "Frigate" | "Destroyer" | "Cruiser" | "Capital";
    moduleTypes: string[]; // Which slot types can be manufactured
    qualityBonus: number; // 0-50% bonus to output quality
    speedMultiplier: number; // 0.5x - 2x production speed
    parallelJobs: number; // How many items can be built simultaneously
  };
  
  requirements: {
    powerDraw: number;
    workforce: number;
    maintenanceCost: number; // Per hour
  };
  
  condition: number; // 0-100
  ownerId: string;
  location?: string;
}

export interface MaterialRequirement {
  attribute: keyof MaterialAttributes; // Which attribute matters
  minValue: number; // Minimum acceptable value
  idealValue: number; // Ideal value for max bonus
  quantity: number; // How much needed
  alternatives?: string[]; // Alternative material IDs
}

export interface ManufacturingJob {
  id: string;
  blueprintId: string;
  blueprintLevel: number; // Current research level
  
  // Bill of Materials
  materialRequirements: MaterialRequirement[];
  
  // Actual materials provided
  providedMaterials: {
    materialId: string;
    material: Material;
    quantity: number;
    matchScore: number; // How well it matches requirements (0-1)
  }[];
  
  facilityId: string;
  
  // Output predictions
  outputQuality: number; // 0-100, based on materials and facility
  statBonuses: Record<string, number>; // From high-tier materials
  specialAbilities?: string[]; // Potential special abilities from premium materials
  
  productionTime: number; // In seconds
  energyCost: number;
  successChance: number; // Can fail with poor materials/facility
  
  status: "planning" | "queued" | "inProgress" | "completed" | "failed";
  startedAt?: Date;
  completedAt?: Date;
  outputItemId?: string; // The created item's ID
  failureReason?: string;
}

// Resource Extraction
export type ResourceNodeType = "asteroid" | "gas_cloud" | "planetary" | "salvage" | "ice";

export interface ResourceNode {
  id: string;
  type: ResourceNodeType;
  name: string;
  
  resources: {
    resourceId: string;
    resourceName: string;
    basePurity: number; // Starting purity
    abundance: number; // Total available
    currentAmount: number; // Currently remaining
    extractionRate: number; // Units per minute with basic equipment
    richness: number; // 0.5-2.0, multiplier for extraction
  }[];
  
  location: {
    sector: string;
    system: string;
    coordinates: [number, number, number];
    security: "high" | "low" | "null" | "wormhole";
  };
  
  depletion: {
    current: number; // 0-100%
    regeneration: number; // % per hour, if any
    respawnTime?: number; // Hours until respawn if fully depleted
  };
  
  discoveredBy?: string;
  claimedBy?: string;
  contested: boolean;
}

export interface MiningOperation {
  id: string;
  nodeId: string;
  operatorId: string;
  
  equipment: {
    miningShipId: string;
    miningLasers: number;
    efficiency: number; // Based on equipment quality
    capacity: number; // Cargo hold size
  };
  
  extraction: {
    targetResource: string;
    rate: number; // Units per minute
    totalExtracted: number;
    purityModifier: number; // Equipment affects extracted purity
  };
  
  status: "traveling" | "mining" | "hauling" | "docked";
  startedAt: Date;
  estimatedCompletion?: Date;
  
  risks: {
    pirateActivity: number; // 0-100
    competitorPresence: boolean;
    environmentalHazards: string[];
  };
}

// Supply Chain & Logistics
export interface StorageFacility {
  id: string;
  name: string;
  type: "warehouse" | "silo" | "vault" | "distribution_center";
  
  capacity: {
    total: number; // m³
    used: number;
    reserved: number; // For incoming shipments
  };
  
  security: {
    level: number; // 0-100
    defenses: string[];
    insurance: boolean;
  };
  
  inventory: {
    materialId: string;
    quantity: number;
    tier: MaterialTier;
    averagePurity: number;
  }[];
  
  location: string;
  ownerId: string;
  accessList: string[]; // Who can deposit/withdraw
}

export interface TransportRoute {
  id: string;
  name: string;
  
  endpoints: {
    from: {
      facilityId: string;
      facilityType: string;
      location: string;
    };
    to: {
      facilityId: string;
      facilityType: string;
      location: string;
    };
  };
  
  cargo: {
    ships: {
      id: string;
      capacity: number;
      speed: number;
      defenseRating: number;
    }[];
    currentLoad: {
      materialId: string;
      quantity: number;
    }[];
  };
  
  schedule: {
    frequency: number; // Trips per hour
    automated: boolean;
    nextDeparture: Date;
    estimatedArrival: Date;
  };
  
  costs: {
    fuel: number; // Per trip
    maintenance: number; // Per hour
    crew: number; // Per trip
    insurance: number; // Per trip
  };
  
  risks: {
    piracyChance: number; // 0-100
    routeExposure: number; // How visible to enemies
    weatherHazards: boolean;
    politicalInstability: boolean;
  };
  
  ownerId: string;
  profitability: number; // Calculated profit margin
}

// Industrial Espionage
export type EspionageType = "steal_blueprint" | "sabotage_facility" | "corrupt_research" | "steal_materials" | "recruit_spy";

export interface EspionageAction {
  id: string;
  type: EspionageType;
  initiatorId: string;
  targetId: string; // Player or facility ID
  
  requirements: {
    infiltrationLevel: number; // 0-100, current infiltration progress
    hackingTools: string[]; // Required items/modules
    agentSkill: number; // Spy skill level needed
    cost: number; // ISK/credits cost
    preparationTime: number; // Hours needed to prepare
  };
  
  execution: {
    riskLevel: number; // 0-100, chance of detection
    successChance: number; // 0-100
    duration: number; // How long the action takes
    coverStory?: string; // Reduces suspicion if detected
  };
  
  rewards: {
    blueprintData?: {
      blueprintId: string;
      researchLevel: number; // May get partial data
      completeness: number; // % of full blueprint
      statsFocused: string[]; // Which improvements were stolen
    };
    
    facilityDamage?: {
      damagePercent: number; // Production slowdown
      repairCost: number;
      downtime: number; // Hours
    };
    
    researchCorruption?: {
      pointsLost: number; // Research points removed
      focusScrambled: boolean; // Randomizes research focus
      falseData: boolean; // Introduces errors
    };
    
    stolenMaterials?: {
      materials: Material[];
      totalValue: number;
    };
  };
  
  consequences: {
    reputationLoss: number;
    standingChange: number; // With victim's faction
    bounty?: number; // If caught
    retaliation: boolean; // Target gets notification
    evidenceLeft: number; // 0-100, affects future investigations
  };
  
  status: "planning" | "infiltrating" | "executing" | "completed" | "failed" | "detected";
  startedAt: Date;
  completedAt?: Date;
}

// Market Dynamics
export interface MaterialMarket {
  materialId: string;
  
  pricing: {
    basePrice: number;
    currentPrice: number;
    volatility: number; // Standard deviation
    trend: "rising" | "stable" | "falling";
    volume24h: number;
    lastUpdate: Date;
  };
  
  supply: {
    totalAvailable: number;
    byTier: Record<MaterialTier, number>;
    averagePurity: number;
    majorSuppliers: string[]; // Player IDs
  };
  
  demand: {
    daily: number;
    weekly: number;
    projectedGrowth: number; // Percentage
    majorConsumers: string[]; // Player IDs
  };
  
  orders: {
    buyOrders: {
      price: number;
      quantity: number;
      minTier: MaterialTier;
      minPurity: number;
      playerId: string;
    }[];
    sellOrders: {
      price: number;
      quantity: number;
      tier: MaterialTier;
      purity: number;
      playerId: string;
      location: string;
    }[];
  };
}

// Helper Functions for Material Effects
export interface MaterialEffects {
  // Calculate stat bonuses based on material quality
  calculateStatBonus(baseStat: number, materialTier: MaterialTier, purity: number): number;
  
  // Determine special abilities from materials
  rollSpecialAbilities(materials: Material[]): string[];
  
  // Calculate final item quality
  calculateItemQuality(blueprint: Blueprint, materials: Material[], facility: ManufacturingFacility): number;
  
  // Material matching score
  calculateMaterialMatch(requirement: MaterialRequirement, material: Material): number;
  
  // Refining efficiency calculation
  calculateRefiningOutput(input: Material, facility: RefiningFacility, cycleNumber: number): RefiningCycle['output'];
  
  // Research success chance
  calculateResearchSuccess(blueprint: Blueprint, materials: Material[], aggressiveness: ResearchAggressiveness): number;
}

// Events for real-time updates
export type IndustrialEventType = 
  | "research_completed"
  | "manufacturing_completed"  
  | "refining_completed"
  | "mining_depleted"
  | "transport_arrived"
  | "facility_damaged"
  | "espionage_detected"
  | "market_crash"
  | "resource_discovered";

export interface IndustrialEvent {
  id: string;
  type: IndustrialEventType;
  timestamp: Date;
  playerId: string;
  
  details: {
    facilityId?: string;
    blueprintId?: string;
    materialId?: string;
    nodeId?: string;
    routeId?: string;
    
    message: string;
    severity: "info" | "warning" | "critical";
    actionRequired: boolean;
    
    data?: any; // Event-specific data
  };
}















