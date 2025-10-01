import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function consolidateMaterials() {
  try {
    const playerId = 'demo-player';
    
    console.log('🔄 Fetching all player materials...');
    
    // Get all player materials
    const materials = await prisma.playerMaterial.findMany({
      where: { playerId },
      include: { material: true }
    });
    
    console.log(`Found ${materials.length} material stacks`);
    
    // Group materials by materialId and tier ONLY (ignore purity differences)
    const groups = new Map();
    
    materials.forEach(mat => {
      const key = `${mat.materialId}_T${mat.tier}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(mat);
    });
    
    console.log(`\n📊 Grouping into ${groups.size} unique material/tier combinations:`);
    
    // Show what will be consolidated
    for (const [key, group] of groups) {
      const material = group[0].material;
      const totalQuantity = group.reduce((sum, m) => sum + Number(m.quantity), 0);
      const purities = group.map(m => (m.purity * 100).toFixed(1) + '%').join(', ');
      console.log(`  ${material.name} T${group[0].tier}: ${group.length} stacks (${totalQuantity} units)`);
      if (group.length > 1) {
        console.log(`    Purities: ${purities}`);
      }
    }
    
    console.log(`\n🔀 Consolidating all duplicate material/tier combinations...`);
    
    // Consolidate each group
    let consolidated = 0;
    let deleted = 0;
    
    await prisma.$transaction(async (tx) => {
      for (const [key, group] of groups) {
        if (group.length > 1) {
          // Sum up quantities
          const totalQuantity = group.reduce((sum, m) => sum + m.quantity, 0n);
          
          // Average purity (weighted by quantity)
          const weightedPurity = group.reduce((sum, m) => 
            sum + (m.purity * Number(m.quantity)), 0
          ) / Number(totalQuantity);
          
          // Keep the first one, delete the rest
          const [keep, ...remove] = group;
          
          console.log(`  Merging ${group[0].material.name} T${group[0].tier}: ${group.length} → 1 stack`);
          
          // Update the keeper with total quantity and averaged purity
          await tx.playerMaterial.update({
            where: { id: keep.id },
            data: {
              quantity: totalQuantity,
              purity: Math.round(weightedPurity * 100) / 100
            }
          });
          
          // Delete the duplicates
          if (remove.length > 0) {
            await tx.playerMaterial.deleteMany({
              where: {
                id: { in: remove.map(m => m.id) }
              }
            });
            deleted += remove.length;
          }
          
          consolidated++;
        }
      }
    });
    
    console.log(`\n✅ Success! Consolidated ${consolidated} groups, removed ${deleted} duplicate stacks`);
    
    // Show final inventory summary
    const finalMaterials = await prisma.playerMaterial.findMany({
      where: { playerId },
      include: { material: true },
      orderBy: [
        { material: { name: 'asc' } },
        { tier: 'desc' },
        { quantity: 'desc' }
      ]
    });
    
    console.log(`\n📦 Final inventory (${finalMaterials.length} unique stacks):`);
    
    finalMaterials.forEach(m => {
      const grade = m.purity >= 0.9 ? 'S' :
                   m.purity >= 0.7 ? 'A' :
                   m.purity >= 0.5 ? 'B' :
                   m.purity >= 0.3 ? 'C' :
                   m.purity >= 0.15 ? 'D' : 'F';
      console.log(`  ${m.material.name} T${m.tier} [${grade}]: ${Number(m.quantity)} units @ ${(m.purity * 100).toFixed(1)}% purity`);
    });
    
  } catch (error) {
    console.error('❌ Error consolidating materials:', error);
  } finally {
    await prisma.$disconnect();
  }
}

consolidateMaterials();


