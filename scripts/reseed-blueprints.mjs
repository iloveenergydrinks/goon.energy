import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function reseedBlueprints() {
  console.log('🏭 Re-seeding blueprints with better names...');
  
  // Clear existing data in dependency order
  await prisma.manufacturingJob.deleteMany();
  await prisma.playerBlueprint.deleteMany();
  await prisma.blueprint.deleteMany();
  console.log('Cleared existing blueprints');
  
  // Create well-defined blueprints
  const blueprints = [
    // Basic Shield Generator
    {
      name: 'Shield Generator Mk1',
      description: 'Basic shield generator for small ships',
      type: 'module',
      moduleId: 'shield-gen-mk1', // We'll use a placeholder ID
      requiredMaterials: [
        { materialType: 'Titanium', quantity: 50, affects: ['shieldHP'] },
        { materialType: 'Plasma', quantity: 20, affects: ['rechargeRate', 'powerDraw'] }
      ],
      requiredComponents: [], // No components needed for basic tier
      baseStats: {
        shieldHP: 100,
        rechargeRate: 5,
        powerDraw: 10
      },
      tier: 1
    },
    // Advanced Shield Generator
    {
      name: 'Shield Generator Mk2',
      description: 'Advanced shield generator with improved capacity',
      type: 'module',
      moduleId: 'shield-gen-mk2',
      requiredMaterials: [
        { materialType: 'Titanium', quantity: 100, affects: ['shieldHP'] },
        { materialType: 'Plasma', quantity: 50, affects: ['rechargeRate'] },
        { materialType: 'Quantum', quantity: 10, affects: ['powerDraw'] }
      ],
      requiredComponents: [
        { componentId: 'power_core', quantity: 1 },
        { componentId: 'cooling_gel', quantity: 2 }
      ],
      baseStats: {
        shieldHP: 200,
        rechargeRate: 8,
        powerDraw: 15
      },
      tier: 2
    },
    // Basic Weapon
    {
      name: 'Pulse Laser Mk1',
      description: 'Entry-level energy weapon',
      type: 'module',
      moduleId: 'pulse-laser-mk1',
      requiredMaterials: [
        { materialType: 'Iron', quantity: 40, affects: ['damage'] },
        { materialType: 'Silicon', quantity: 30, affects: ['range', 'fireRate'] }
      ],
      requiredComponents: [],
      baseStats: {
        damage: 50,
        fireRate: 2,
        range: 5000,
        energyCost: 5
      },
      tier: 1
    },
    // Advanced Weapon
    {
      name: 'Plasma Cannon Mk1',
      description: 'High-damage plasma weapon',
      type: 'module',
      moduleId: 'plasma-cannon-mk1',
      requiredMaterials: [
        { materialType: 'Titanium', quantity: 80 },
        { materialType: 'Plasma', quantity: 60 },
        { materialType: 'Dark matter', quantity: 20 }
      ],
      requiredComponents: [
        { componentId: 'power_core', quantity: 2 },
        { componentId: 'cooling_gel', quantity: 3 },
        { componentId: 'plasma_injector', quantity: 1 }
      ],
      baseStats: {
        damage: 150,
        fireRate: 1,
        range: 7000,
        energyCost: 15
      },
      tier: 2
    },
    // Utility Module
    {
      name: 'Cargo Expander Mk1',
      description: 'Increases cargo capacity',
      type: 'module',
      moduleId: 'cargo-expander-mk1',
      requiredMaterials: [
        { materialType: 'Iron', quantity: 60 },
        { materialType: 'Titanium', quantity: 20 }
      ],
      requiredComponents: [],
      baseStats: {
        cargoBonus: 25,
        massIncrease: 5
      },
      tier: 1
    },
    // Engine Module
    {
      name: 'Afterburner Mk1',
      description: 'Temporary speed boost module',
      type: 'module',
      moduleId: 'afterburner-mk1',
      requiredMaterials: [
        { materialType: 'Plasma', quantity: 40 },
        { materialType: 'Silicon', quantity: 40 }
      ],
      requiredComponents: [
        { componentId: 'circuit_fragment', quantity: 2 }
      ],
      baseStats: {
        speedBonus: 50,
        duration: 10,
        cooldown: 30,
        fuelConsumption: 20
      },
      tier: 1
    },
    // Elite Module
    {
      name: 'Quantum Shield Matrix',
      description: 'Elite shield system with regenerative properties',
      type: 'module',
      moduleId: 'quantum-shield',
      requiredMaterials: [
        { materialType: 'Quantum', quantity: 50 },
        { materialType: 'Dark matter', quantity: 30 },
        { materialType: 'Titanium', quantity: 200 }
      ],
      requiredComponents: [
        { componentId: 'quantum_processor', quantity: 1 },
        { componentId: 'zero_point_capacitor', quantity: 1 },
        { componentId: 'power_core', quantity: 3 },
        { componentId: 'flux_dust', quantity: 5 }
      ],
      baseStats: {
        shieldHP: 500,
        rechargeRate: 15,
        resistanceKinetic: 20,
        resistanceThermal: 20,
        resistanceEM: 20,
        powerDraw: 25
      },
      tier: 3
    },
    // Armor Module
    {
      name: 'Reactive Armor Plating',
      description: 'Advanced armor that adapts to damage types',
      type: 'module',
      moduleId: 'reactive-armor',
      requiredMaterials: [
        { materialType: 'Titanium', quantity: 150 },
        { materialType: 'Iron', quantity: 100 }
      ],
      requiredComponents: [
        { componentId: 'structural_lattice', quantity: 2 },
        { componentId: 'alloy_binder', quantity: 3 }
      ],
      baseStats: {
        armorHP: 300,
        adaptiveResistance: 15,
        repairRate: 2
      },
      tier: 2
    },
    // Scanner Module
    {
      name: 'Deep Space Scanner',
      description: 'Long-range scanning array',
      type: 'module',
      moduleId: 'scanner',
      requiredMaterials: [
        { materialType: 'Silicon', quantity: 60 },
        { materialType: 'Quantum', quantity: 5 }
      ],
      requiredComponents: [
        { componentId: 'circuit_fragment', quantity: 3 },
        { componentId: 'neural_processor', quantity: 1 }
      ],
      baseStats: {
        scanRange: 10000,
        scanResolution: 50,
        signatureRadius: 25
      },
      tier: 1
    },
    // Mining Module
    {
      name: 'Mining Laser Mk1',
      description: 'Basic asteroid mining equipment',
      type: 'module',
      moduleId: 'mining-laser',
      requiredMaterials: [
        { materialType: 'Iron', quantity: 50 },
        { materialType: 'Silicon', quantity: 20 }
      ],
      requiredComponents: [],
      baseStats: {
        miningYield: 100,
        cycleTime: 60,
        optimalRange: 1000
      },
      tier: 1
    }
  ];
  
  // Get first module to use as placeholder (or create a dummy one)
  const firstModule = await prisma.module.findFirst();
  const moduleId = firstModule?.id || 'placeholder-module';
  
  // Create new blueprints with proper module reference
  for (const blueprint of blueprints) {
    try {
      await prisma.blueprint.create({
        data: {
          ...blueprint,
          moduleId: moduleId // Use real module ID for now
        }
      });
      console.log(`✅ Created blueprint: ${blueprint.name}`);
    } catch (error) {
      console.error(`❌ Failed to create blueprint: ${blueprint.name}`, error.message);
    }
  }
  
  // Give all blueprints to the demo player
  const player = await prisma.player.findFirst({
    where: { id: 'demo-player' }
  });
  
  if (player) {
    const allBlueprints = await prisma.blueprint.findMany();
    
    for (const blueprint of allBlueprints) {
      try {
        await prisma.playerBlueprint.create({
          data: {
            playerId: player.id,
            blueprintId: blueprint.id,
            unlocked: blueprint.tier <= 2, // Only tier 1 and 2 are unlocked by default
            timesUsed: 0
          }
        });
      } catch (error) {
        // Ignore if already exists
      }
    }
    console.log(`✅ Gave ${allBlueprints.length} blueprints to demo player`);
  }
  
  console.log('✅ Blueprint re-seeding complete!');
}

reseedBlueprints()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
