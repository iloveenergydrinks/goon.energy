import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedBlueprints() {
  console.log('🏭 Seeding blueprints...');
  
  // Get some existing modules to create blueprints for
  const modules = await prisma.module.findMany({
    where: {
      slot: {
        in: ['Power', 'Ammo', 'Utility']
      }
    },
    take: 10
  });
  
  console.log(`Found ${modules.length} modules to create blueprints for`);
  
  const blueprints = [
    // Basic Shield Generator
    {
      name: 'Shield Generator Mk1',
      description: 'Basic shield generator for small ships',
      type: 'module',
      moduleId: modules.find(m => m.familyName?.includes('Shield'))?.id || modules[0].id,
      requiredMaterials: [
        { materialType: 'Titanium', quantity: 50 },
        { materialType: 'Plasma', quantity: 20 }
      ],
      baseStats: {
        shieldHP: 100,
        rechargeRate: 5
      },
      tier: 1,
      masteryRequired: 0
    },
    // Advanced Shield Generator
    {
      name: 'Shield Generator Mk2',
      description: 'Advanced shield generator with improved capacity',
      type: 'module',
      moduleId: modules.find(m => m.familyName?.includes('Shield'))?.id || modules[0].id,
      requiredMaterials: [
        { materialType: 'Titanium', quantity: 100 },
        { materialType: 'Plasma', quantity: 50 },
        { materialType: 'Quantum', quantity: 10 }
      ],
      baseStats: {
        shieldHP: 200,
        rechargeRate: 8
      },
      tier: 2,
      masteryRequired: 5
    },
    // Basic Weapon
    {
      name: 'Pulse Laser Mk1',
      description: 'Entry-level energy weapon',
      type: 'module',
      moduleId: modules.find(m => m.slot === 'Ammo')?.id || modules[1].id,
      requiredMaterials: [
        { materialType: 'Iron', quantity: 40 },
        { materialType: 'Silicon', quantity: 30 }
      ],
      baseStats: {
        damage: 50,
        fireRate: 2,
        range: 5000
      },
      tier: 1,
      masteryRequired: 0
    },
    // Advanced Weapon
    {
      name: 'Plasma Cannon Mk1',
      description: 'High-damage plasma weapon',
      type: 'module',
      moduleId: modules.find(m => m.slot === 'Ammo')?.id || modules[1].id,
      requiredMaterials: [
        { materialType: 'Titanium', quantity: 80 },
        { materialType: 'Plasma', quantity: 60 },
        { materialType: 'Dark matter', quantity: 20 }
      ],
      baseStats: {
        damage: 150,
        fireRate: 1,
        range: 7000
      },
      tier: 2,
      masteryRequired: 10
    },
    // Utility Module
    {
      name: 'Cargo Expander Mk1',
      description: 'Increases cargo capacity',
      type: 'module',
      moduleId: modules.find(m => m.slot === 'Utility')?.id || modules[2].id,
      requiredMaterials: [
        { materialType: 'Iron', quantity: 60 },
        { materialType: 'Titanium', quantity: 20 }
      ],
      baseStats: {
        cargoBonus: 25
      },
      tier: 1,
      masteryRequired: 0
    },
    // Engine Module
    {
      name: 'Afterburner Mk1',
      description: 'Temporary speed boost module',
      type: 'module',
      moduleId: modules.find(m => m.slot === 'Utility')?.id || modules[2].id,
      requiredMaterials: [
        { materialType: 'Plasma', quantity: 40 },
        { materialType: 'Silicon', quantity: 40 }
      ],
      baseStats: {
        speedBonus: 50,
        duration: 10
      },
      tier: 1,
      masteryRequired: 0
    },
    // Elite Module
    {
      name: 'Quantum Shield Matrix',
      description: 'Elite shield system with regenerative properties',
      type: 'module',
      moduleId: modules[0]?.id,
      requiredMaterials: [
        { materialType: 'Quantum', quantity: 50 },
        { materialType: 'Dark matter', quantity: 30 },
        { materialType: 'Titanium', quantity: 200 }
      ],
      baseStats: {
        shieldHP: 500,
        rechargeRate: 15,
        resistances: { kinetic: 20, thermal: 20, em: 20 }
      },
      tier: 3,
      masteryRequired: 20
    }
  ];
  
  // Clear existing blueprints
  await prisma.blueprint.deleteMany();
  console.log('Cleared existing blueprints');
  
  // Create new blueprints
  for (const blueprint of blueprints) {
    try {
      await prisma.blueprint.create({
        data: blueprint
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
            unlocked: blueprint.tier <= 2 // Only tier 1 and 2 are unlocked by default
          }
        });
      } catch (error) {
        // Ignore if already exists
      }
    }
    console.log(`✅ Gave ${allBlueprints.length} blueprints to demo player`);
  }
  
  console.log('✅ Blueprint seeding complete!');
}

seedBlueprints()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
