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
    
    console.log(`Found ${materials.length} material stacks\n`);
    
    // Group materials by materialId and tier ONLY (ignore purity differences)
    const groups = new Map();
    
    materials.forEach(mat => {
      const key = `${mat.materialId}_T${mat.tier}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(mat);
    });
    
    console.log(`📊 Grouping into ${groups.size} unique material/tier combinations:\n`);
    
    // Show what will be consolidated
    const toConsolidate = [];
    for (const [key, group] of groups) {
      const material = group[0].material;
      const totalQuantity = group.reduce((sum, m) => sum + Number(m.quantity), 0);
      
      if (group.length > 1) {
        console.log(`  ${material.name} T${group[0].tier}: ${group.length} stacks → ${totalQuantity} units`);
        toConsolidate.push({ key, group, material, totalQuantity });
      }
    }
    
    if (toConsolidate.length === 0) {
      console.log('✅ No consolidation needed!');
      return;
    }
    
    console.log(`\n🔀 Consolidating ${toConsolidate.length} material groups...\n`);
    
    // Consolidate each group
    let deleted = 0;
    
    await prisma.$transaction(async (tx) => {
      for (const { key, group, material, totalQuantity } of toConsolidate) {
        // Calculate weighted average purity
        const weightedPurity = group.reduce((sum, m) => 
          sum + (m.purity * Number(m.quantity)), 0
        ) / totalQuantity;
        
        const finalPurity = Math.round(weightedPurity * 100) / 100;
        
        console.log(`  Processing ${material.name} T${group[0].tier}...`);
        
        // Delete ALL stacks in this group
        await tx.playerMaterial.deleteMany({
          where: {
            id: { in: group.map(m => m.id) }
          }
        });
        deleted += group.length;
        
        // Create a single new consolidated stack
        await tx.playerMaterial.create({
          data: {
            playerId,
            materialId: group[0].materialId,
            quantity: BigInt(totalQuantity),
            tier: group[0].tier,
            purity: finalPurity,
            attributes: group[0].attributes // Use attributes from first stack
          }
        });
        
        console.log(`    ✓ Merged ${group.length} stacks → 1 stack with ${totalQuantity} units @ ${(finalPurity * 100).toFixed(1)}% purity`);
      }
    });
    
    console.log(`\n✅ Success! Removed ${deleted} stacks and created ${toConsolidate.length} consolidated stacks`);
    
    // Show final inventory summary
    const finalMaterials = await prisma.playerMaterial.findMany({
      where: { playerId },
      include: { material: true },
      orderBy: [
        { tier: 'desc' },
        { material: { name: 'asc' } },
        { quantity: 'desc' }
      ]
    });
    
    console.log(`\n📦 Final inventory (${finalMaterials.length} unique stacks):\n`);
    
    finalMaterials.forEach(m => {
      const grade = m.purity >= 0.9 ? 'S' :
                   m.purity >= 0.7 ? 'A' :
                   m.purity >= 0.5 ? 'B' :
                   m.purity >= 0.3 ? 'C' :
                   m.purity >= 0.15 ? 'D' : 'F';
      console.log(`  ${m.material.name.padEnd(12)} T${m.tier} [Grade ${grade}]: ${String(Number(m.quantity)).padStart(5)} units @ ${(m.purity * 100).toFixed(1)}% purity`);
    });
    
  } catch (error) {
    console.error('❌ Error consolidating materials:', error);
  } finally {
    await prisma.$disconnect();
  }
}

consolidateMaterials();


