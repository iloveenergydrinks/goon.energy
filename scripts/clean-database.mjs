import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
  try {
    console.log('🧹 Cleaning database...');
    
    // Delete player materials
    await prisma.playerMaterial.deleteMany({
      where: { playerId: 'demo-player' }
    });
    console.log('✅ Cleared player materials');
    
    // Reset player ORE
    await prisma.player.update({
      where: { id: 'demo-player' },
      data: { isk: BigInt(1000000) }
    });
    console.log('✅ Reset player ORE to 1M');
    
    // Reset resource nodes
    await prisma.resourceNode.deleteMany({
      where: { 
        player: {
          id: 'demo-player'
        }
      }
    });
    console.log('✅ Cleared resource nodes');
    
    console.log('✨ Database cleaned successfully!');
  } catch (error) {
    console.error('Error cleaning database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
