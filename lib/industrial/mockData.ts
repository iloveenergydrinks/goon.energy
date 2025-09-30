// Mock Data for Industrial System Testing

import type { 
  Material, 
  Blueprint, 
  RefiningFacility, 
  ManufacturingFacility,
  MaterialMarket,
  ResourceNode
} from '@/types/industrial';

export function getMockIndustrialData() {
  const materials: Material[] = [
    {
      id: 'mat_titanium_001',
      name: 'Titanium Ore',
      category: 'metal',
      tier: 2,
      purity: 0.45,
      displayGrade: 'D',
      attributes: {
        strength: 0.75,
        conductivity: 0.35,
        density: 0.65,
        reactivity: 0.40,
        stability: 0.80,
        elasticity: 0.55
      },
      rarity: 'Common',
      baseValue: 1000,
      quantity: 5000,
      stackable: true
    },
    {
      id: 'mat_plasma_001',
      name: 'Plasma Gas',
      category: 'gas',
      tier: 3,
      purity: 0.62,
      displayGrade: 'B',
      attributes: {
        strength: 0.15,
        conductivity: 0.85,
        density: 0.10,
        reactivity: 0.95,
        stability: 0.45,
        elasticity: 0.20
      },
      rarity: 'Uncommon',
      baseValue: 2500,
      quantity: 2000,
      stackable: true
    },
    {
      id: 'mat_quantum_001',
      name: 'Quantum Crystals',
      category: 'crystal',
      tier: 4,
      purity: 0.78,
      displayGrade: 'A',
      attributes: {
        strength: 0.60,
        conductivity: 0.92,
        density: 0.85,
        reactivity: 0.88,
        stability: 0.70,
        elasticity: 0.30
      },
      rarity: 'Rare',
      baseValue: 8000,
      quantity: 500,
      stackable: true
    },
    {
      id: 'mat_carbon_001',
      name: 'Carbon Fiber Composite',
      category: 'composite',
      tier: 3,
      purity: 0.58,
      displayGrade: 'B',
      attributes: {
        strength: 0.85,
        conductivity: 0.25,
        density: 0.35,
        reactivity: 0.30,
        stability: 0.90,
        elasticity: 0.75
      },
      rarity: 'Uncommon',
      baseValue: 3000,
      quantity: 3500,
      stackable: true
    },
    {
      id: 'mat_dark_001',
      name: 'Dark Matter',
      category: 'exotic',
      tier: 5,
      purity: 0.92,
      displayGrade: 'S',
      attributes: {
        strength: 0.95,
        conductivity: 0.98,
        density: 0.99,
        reactivity: 0.85,
        stability: 0.60,
        elasticity: 0.50
      },
      rarity: 'Legendary',
      baseValue: 50000,
      quantity: 50,
      stackable: true
    },
    {
      id: 'mat_silicon_001',
      name: 'Silicon Wafers',
      category: 'crystal',
      tier: 2,
      purity: 0.48,
      displayGrade: 'C',
      attributes: {
        strength: 0.45,
        conductivity: 0.70,
        density: 0.50,
        reactivity: 0.55,
        stability: 0.85,
        elasticity: 0.20
      },
      rarity: 'Common',
      baseValue: 1500,
      quantity: 8000,
      stackable: true
    }
  ];
  
  const blueprints: Blueprint[] = [
    {
      id: 'bp_flux_cap_001',
      name: 'Flux Capacitors Mk. III',
      type: 'module',
      baseItemId: 'Flux Capacitors',
      ownerId: 'player_001',
      researchLevel: 8,
      researchPoints: 3250,
      nextLevelRequirement: 6400,
      researchAggressiveness: 'normal',
      researchFocus: [
        { stat: 'capBuffer', weight: 0.6, scalingType: 'linear' },
        { stat: 'powerGen', weight: 0.4, scalingType: 'linear' }
      ],
      inResearch: false,
      statImprovements: {
        capBuffer: 32,
        powerGen: 18,
        efficiency: 15
      },
      materialEfficiency: 0.85,
      productionTimeModifier: 0.9,
      lastResearchSuccess: true,
      consecutiveFailures: 0,
      criticalFailureChance: 0.05,
      isOriginal: true,
      isShared: false,
      sharedWith: [],
      securityLevel: 100
    },
    {
      id: 'bp_railgun_001',
      name: 'Heavy Railgun Prototype',
      type: 'primary',
      baseItemId: 'railgun_heavy',
      ownerId: 'player_001',
      researchLevel: 12,
      researchPoints: 8500,
      nextLevelRequirement: 25600,
      researchAggressiveness: 'aggressive',
      researchFocus: [
        { stat: 'damage', weight: 0.7, scalingType: 'linear' },
        { stat: 'rateOfFire', weight: 0.3, scalingType: 'logarithmic' }
      ],
      inResearch: true,
      researchStartTime: new Date('2025-09-25T10:00:00'),
      estimatedCompletion: new Date('2025-09-26T18:00:00'),
      statImprovements: {
        damage: 45,
        rateOfFire: 12,
        range: 22,
        tracking: 8
      },
      materialEfficiency: 0.75,
      productionTimeModifier: 0.85,
      lastResearchSuccess: false,
      consecutiveFailures: 2,
      criticalFailureChance: 0.15,
      isOriginal: true,
      isShared: true,
      sharedWith: ['corp_member_002', 'corp_member_003'],
      securityLevel: 75
    },
    {
      id: 'bp_hull_frigate_001',
      name: 'Interceptor Hull Design',
      type: 'hull',
      baseItemId: 'hull_interceptor',
      ownerId: 'player_001',
      researchLevel: 5,
      researchPoints: 1200,
      nextLevelRequirement: 1600,
      researchAggressiveness: 'safe',
      researchFocus: [
        { stat: 'hp', weight: 0.3, scalingType: 'linear' },
        { stat: 'powerCapacity', weight: 0.4, scalingType: 'linear' },
        { stat: 'speed', weight: 0.3, scalingType: 'logarithmic' }
      ],
      inResearch: false,
      statImprovements: {
        hp: 15,
        powerCapacity: 20,
        speed: 8,
        bandwidthLimit: 10
      },
      materialEfficiency: 0.90,
      productionTimeModifier: 0.95,
      lastResearchSuccess: true,
      consecutiveFailures: 0,
      criticalFailureChance: 0.01,
      isOriginal: false,
      isShared: false,
      sharedWith: [],
      securityLevel: 100,
      copyNumber: 3,
      maxRuns: 50
    },
    {
      id: 'bp_shield_001',
      name: 'Adaptive Shield Matrix',
      type: 'secondary',
      baseItemId: 'shield_adaptive',
      ownerId: 'player_001',
      researchLevel: 3,
      researchPoints: 450,
      nextLevelRequirement: 800,
      researchAggressiveness: 'normal',
      researchFocus: [
        { stat: 'defense', weight: 0.8, scalingType: 'linear' },
        { stat: 'powerDraw', weight: 0.2, scalingType: 'exponential_decay' }
      ],
      inResearch: false,
      statImprovements: {
        defense: 18,
        resistance: 12,
        powerDraw: -5
      },
      materialEfficiency: 0.92,
      productionTimeModifier: 0.88,
      lastResearchSuccess: true,
      consecutiveFailures: 0,
      criticalFailureChance: 0.05,
      isOriginal: true,
      isShared: false,
      sharedWith: [],
      securityLevel: 100
    }
  ];
  
  const refiningFacilities: RefiningFacility[] = [
    {
      id: 'ref_basic_001',
      name: 'Basic Ore Processor',
      type: 'basic',
      tier: 1,
      efficiency: 0.65,
      maxPurity: 0.60,
      specialization: ['metal'],
      throughput: 1000,
      powerRequirement: 100,
      maintenanceCost: 500,
      condition: 95,
      ownerId: 'player_001'
    },
    {
      id: 'ref_adv_001',
      name: 'Advanced Material Refinery',
      type: 'advanced',
      tier: 3,
      efficiency: 0.85,
      maxPurity: 0.90,
      specialization: ['metal', 'crystal'],
      throughput: 2500,
      powerRequirement: 500,
      maintenanceCost: 2500,
      condition: 88,
      ownerId: 'player_001'
    },
    {
      id: 'ref_spec_001',
      name: 'Specialized Gas Processor',
      type: 'specialized',
      tier: 4,
      efficiency: 0.92,
      maxPurity: 0.98,
      specialization: ['gas'],
      throughput: 1500,
      powerRequirement: 750,
      maintenanceCost: 5000,
      condition: 72,
      ownerId: 'player_001'
    }
  ];
  
  const manufacturingFacilities: ManufacturingFacility[] = [
    {
      id: 'manu_basic_001',
      name: 'Basic Assembly Line',
      type: 'basic',
      capabilities: {
        maxHullSize: 'Frigate',
        moduleTypes: ['Power', 'Ammo'],
        qualityBonus: 5,
        speedMultiplier: 1.0,
        parallelJobs: 1
      },
      requirements: {
        powerDraw: 200,
        workforce: 10,
        maintenanceCost: 1000
      },
      condition: 90,
      ownerId: 'player_001'
    },
    {
      id: 'manu_adv_001',
      name: 'Advanced Production Facility',
      type: 'advanced',
      capabilities: {
        maxHullSize: 'Cruiser',
        moduleTypes: ['Power', 'Ammo', 'Utility'],
        qualityBonus: 20,
        speedMultiplier: 1.5,
        parallelJobs: 3
      },
      requirements: {
        powerDraw: 1000,
        workforce: 50,
        maintenanceCost: 10000
      },
      condition: 85,
      ownerId: 'player_001'
    }
  ];
  
  const marketData: MaterialMarket[] = [
    {
      materialId: 'mat_titanium_001',
      pricing: {
        basePrice: 1000,
        currentPrice: 1150,
        volatility: 0.15,
        trend: 'rising',
        volume24h: 125000,
        lastUpdate: new Date()
      },
      supply: {
        totalAvailable: 500000,
        byTier: { 1: 200000, 2: 150000, 3: 100000, 4: 40000, 5: 10000 },
        averagePurity: 0.45,
        majorSuppliers: ['corp_001', 'corp_002']
      },
      demand: {
        daily: 25000,
        weekly: 175000,
        projectedGrowth: 5,
        majorConsumers: ['alliance_001', 'corp_003']
      },
      orders: {
        buyOrders: [],
        sellOrders: []
      }
    }
  ];
  
  const resourceNodes: ResourceNode[] = [
    {
      id: 'node_asteroid_001',
      type: 'asteroid',
      name: 'Rich Titanium Asteroid',
      resources: [
        {
          resourceId: 'titanium',
          resourceName: 'Titanium',
          basePurity: 0.35,
          abundance: 100000,
          currentAmount: 85000,
          extractionRate: 100,
          richness: 1.5
        }
      ],
      location: {
        sector: 'Alpha Quadrant',
        system: 'Sol-3',
        coordinates: [125, 450, -200],
        security: 'high'
      },
      depletion: {
        current: 85,
        regeneration: 0,
      },
      discoveredBy: 'player_001',
      claimedBy: 'player_001',
      contested: false
    }
  ];
  
  const playerStats = {
    isk: 2500000,
    totalMaterials: materials.reduce((sum, m) => sum + m.quantity, 0),
    totalBlueprints: blueprints.length,
    activeJobs: {
      refining: 2,
      manufacturing: 3,
      research: blueprints.filter(b => b.inResearch).length,
      transport: 1
    }
  };
  
  return {
    materials,
    blueprints,
    refiningFacilities,
    manufacturingFacilities,
    marketData,
    resourceNodes,
    playerStats
  };
}






