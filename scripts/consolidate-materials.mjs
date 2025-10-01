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
    
    // Group materials by materialId, tier, and similar purity (within 0.01)
    const groups = new Map();
    
    materials.forEach(mat => {
      // Round purity to 2 decimal places for grouping
      const roundedPurity = Math.round(mat.purity * 100) / 100;
      const key = `${mat.materialId}_T${mat.tier}_P${roundedPurity}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(mat);
    });
    
    console.log(`\n📊 Found ${groups.size} unique material groups:`);
    
    // Show what will be consolidated
    let consolidationNeeded = 0;
    for (const [key, group] of groups) {
      if (group.length > 1) {
        const material = group[0].material;
        const totalQuantity = group.reduce((sum, m) => sum + Number(m.quantity), 0);
        console.log(`  - ${material.name} T${group[0].tier}: ${group.length} stacks → ${totalQuantity} units total`);
        consolidationNeeded++;
      }
    }
    
    if (consolidationNeeded === 0) {
      console.log('✅ No consolidation needed - all materials are already unique!');
      return;
    }
    
    console.log(`\n🔀 Consolidating ${consolidationNeeded} material groups...`);
    
    // Consolidate each group
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
        }
      }
    });
    
    console.log(`\n✅ Success! Consolidated ${consolidationNeeded} groups, removed ${deleted} duplicate stacks`);
    
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
    
    // Group by material name for summary
    const summary = {};
    finalMaterials.forEach(m => {
      const name = m.material.name;
      if (!summary[name]) {
        summary[name] = [];
      }
      summary[name].push({
        tier: m.tier,
        quantity: Number(m.quantity),
        purity: m.purity
      });
    });
    
    for (const [material, stacks] of Object.entries(summary)) {
      console.log(`\n  ${material}:`);
      stacks.forEach(s => {
        console.log(`    T${s.tier} - ${s.quantity} units @ ${(s.purity * 100).toFixed(1)}% purity`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error consolidating materials:', error);
  } finally {
    await prisma.$disconnect();
  }
}

consolidateMaterials();


