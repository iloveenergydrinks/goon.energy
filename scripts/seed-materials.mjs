import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MATERIALS = [
  // Structural Metals
  {
    name: 'Titanium',
    category: 'metal',
    baseValue: 150,
    baseAttributes: {
      strength: 200,
      conductivity: 40,
      density: 120,
      reactivity: 50,
      stability: 150,
      elasticity: 100
    }
  },
  {
    name: 'Iron',
    category: 'metal',
    baseValue: 80,
    baseAttributes: {
      strength: 150,
      conductivity: 60,
      density: 140,
      reactivity: 40,
      stability: 120,
      elasticity: 80
    }
  },
  {
    name: 'Aluminum',
    category: 'metal',
    baseValue: 120,
    baseAttributes: {
      strength: 80,
      conductivity: 90,
      density: 60,
      reactivity: 100,
      stability: 100,
      elasticity: 120
    }
  },
  
  // Energy Materials
  {
    name: 'Plasma',
    category: 'gas',
    baseValue: 200,
    baseAttributes: {
      strength: 30,
      conductivity: 180,
      density: 50,
      reactivity: 200,
      stability: 80,
      elasticity: 60
    }
  },
  {
    name: 'Quantum',
    category: 'crystal',
    baseValue: 500,
    baseAttributes: {
      strength: 40,
      conductivity: 250,
      density: 20,
      reactivity: 250,
      stability: 60,
      elasticity: 50
    }
  },
  {
    name: 'Dark matter',
    category: 'exotic',
    baseValue: 800,
    baseAttributes: {
      strength: 100,
      conductivity: 200,
      density: 10,
      reactivity: 220,
      stability: 40,
      elasticity: 180
    }
  },
  
  // Electronics
  {
    name: 'Silicon',
    category: 'crystal',
    baseValue: 100,
    baseAttributes: {
      strength: 60,
      conductivity: 150,
      density: 80,
      reactivity: 130,
      stability: 140,
      elasticity: 40
    }
  },
  {
    name: 'Copper',
    category: 'metal',
    baseValue: 90,
    baseAttributes: {
      strength: 100,
      conductivity: 180,
      density: 130,
      reactivity: 110,
      stability: 130,
      elasticity: 90
    }
  },
  {
    name: 'Gold',
    category: 'metal',
    baseValue: 300,
    baseAttributes: {
      strength: 70,
      conductivity: 220,
      density: 150,
      reactivity: 100,
      stability: 160,
      elasticity: 110
    }
  }
];

async function seedMaterials() {
  console.log('🔧 Seeding materials to database...');
  
  for (const mat of MATERIALS) {
    try {
      // Find existing
      const existing = await prisma.material.findFirst({
        where: { name: mat.name }
      });
      
      if (existing) {
        // Update
        await prisma.material.update({
          where: { id: existing.id },
          data: {
            category: mat.category,
            baseValue: mat.baseValue,
            baseAttributes: mat.baseAttributes
          }
        });
        console.log(`✅ Updated: ${mat.name}`);
      } else {
        // Create
        await prisma.material.create({
          data: mat
        });
        console.log(`✅ Created: ${mat.name}`);
      }
    } catch (error) {
      console.error(`❌ Failed to seed ${mat.name}:`, error.message);
    }
  }
  
  console.log('✅ Material seeding complete!');
}

seedMaterials()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

