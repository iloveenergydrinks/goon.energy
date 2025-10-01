import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Define purity bands for smart stacking
const PURITY_BANDS = {
  LOW: { min: 0, max: 0.30, name: 'Low' },      // 0-30%
  MEDIUM: { min: 0.30, max: 0.60, name: 'Medium' }, // 30-60%
  HIGH: { min: 0.60, max: 0.85, name: 'High' },    // 60-85%
  PREMIUM: { min: 0.85, max: 1.0, name: 'Premium' } // 85-100%
};

function getPurityBand(purity: number) {
  if (purity >= PURITY_BANDS.PREMIUM.min) return 'PREMIUM';
  if (purity >= PURITY_BANDS.HIGH.min) return 'HIGH';
  if (purity >= PURITY_BANDS.MEDIUM.min) return 'MEDIUM';
  return 'LOW';
}

// POST /api/materials/consolidate - Consolidate duplicate material stacks within purity bands
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { preservePremium = true, bandSize = 'default' } = body;
    const playerId = 'demo-player';
    
    // Get all player materials
    const materials = await prisma.playerMaterial.findMany({
      where: { playerId },
      include: { material: true }
    });
    
    // Group materials by materialId, tier, and purity band
    const groups = new Map<string, typeof materials>();
    
    materials.forEach(mat => {
      const band = getPurityBand(mat.purity);
      // If preservePremium is true, don't consolidate premium materials
      if (preservePremium && band === 'PREMIUM') {
        return; // Skip premium materials
      }
      
      const key = `${mat.materialId}_T${mat.tier}_${band}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(mat);
    });
    
    // Consolidate each group
    let consolidated = 0;
    let deleted = 0;
    let preserved = 0;
    
    // Count preserved premium stacks
    if (preservePremium) {
      preserved = materials.filter(m => getPurityBand(m.purity) === 'PREMIUM').length;
    }
    
    await prisma.$transaction(async (tx) => {
      for (const [key, group] of groups) {
        if (group.length > 1) {
          // Sum up quantities
          const totalQuantity = group.reduce((sum, m) => sum + m.quantity, BigInt(0));
          
          // Calculate weighted average purity within the band
          const weightedPurity = group.reduce((sum, m) => 
            sum + (m.purity * Number(m.quantity)), 0
          ) / Number(totalQuantity);
          
          // Delete all stacks in this group
          await tx.playerMaterial.deleteMany({
            where: {
              id: { in: group.map(m => m.id) }
            }
          });
          deleted += group.length;
          
          // Create a single consolidated stack
          await tx.playerMaterial.create({
            data: {
              playerId,
              materialId: group[0].materialId,
              quantity: totalQuantity,
              tier: group[0].tier,
              purity: Math.round(weightedPurity * 100) / 100,
              attributes: group[0].attributes
            }
          });
          
          consolidated++;
        }
      }
    });
    
    // Get final material count for reporting
    const finalMaterials = await prisma.playerMaterial.findMany({
      where: { playerId },
      include: { material: true }
    });
    
    // Create a summary of what was done
    const summary = {
      before: materials.length,
      after: finalMaterials.length,
      consolidated: consolidated,
      deleted: deleted,
      preserved: preserved,
      bands: {} as Record<string, number>
    };
    
    // Count materials by band in final result
    finalMaterials.forEach(mat => {
      const band = getPurityBand(mat.purity);
      const bandName = PURITY_BANDS[band as keyof typeof PURITY_BANDS].name;
      summary.bands[bandName] = (summary.bands[bandName] || 0) + 1;
    });
    
    return NextResponse.json({
      success: true,
      message: preservePremium 
        ? `Consolidated ${consolidated} groups, removed ${deleted} stacks, preserved ${preserved} premium stacks`
        : `Consolidated ${consolidated} groups, removed ${deleted} stacks`,
      consolidatedGroups: consolidated,
      deletedStacks: deleted,
      preservedPremium: preserved,
      summary
    });
    
  } catch (error) {
    console.error('Error consolidating materials:', error);
    return NextResponse.json({ error: 'Failed to consolidate materials' }, { status: 500 });
  }
}