import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getQualityGrade } from '@/lib/industrial/quality';

export async function POST(request: Request) {
  try {
    const { blueprintId, materials, batchSize = 1 } = await request.json();
    
    if (!blueprintId || !materials) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get the blueprint
    const blueprint = await prisma.blueprint.findUnique({
      where: { id: blueprintId },
      include: { module: true }
    });
    
    if (!blueprint) {
      return NextResponse.json(
        { error: 'Blueprint not found' },
        { status: 404 }
      );
    }
    
    // Get player
    const player = await prisma.player.findFirst({
      where: { id: 'demo-player' }
    });
    
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }
    
    // Check if player has unlocked this blueprint
    const playerBlueprint = await prisma.playerBlueprint.findUnique({
      where: {
        playerId_blueprintId: {
          playerId: player.id,
          blueprintId: blueprint.id
        }
      }
    });
    
    if (!playerBlueprint?.unlocked) {
      return NextResponse.json(
        { error: 'Blueprint not unlocked' },
        { status: 403 }
      );
    }
    
    // Mastery check removed for now
    
    // Parse required materials
    const requiredMaterials = blueprint.requiredMaterials as any[];
    
    // Calculate batch discount
    let materialMultiplier = batchSize;
    if (batchSize >= 25) {
      materialMultiplier = batchSize * 0.7; // 30% discount
    } else if (batchSize >= 10) {
      materialMultiplier = batchSize * 0.8; // 20% discount
    } else if (batchSize >= 5) {
      materialMultiplier = batchSize * 0.9; // 10% discount
    }
    
    // Verify player has required materials
    for (const required of requiredMaterials) {
      const materialStackId = materials[required.materialType];
      if (!materialStackId) {
        return NextResponse.json(
          { error: `Missing material: ${required.materialType}` },
          { status: 400 }
        );
      }
      
      const playerMaterial = await prisma.playerMaterial.findUnique({
        where: { id: materialStackId }
      });
      
      if (!playerMaterial) {
        return NextResponse.json(
          { error: `Material not found: ${required.materialType}` },
          { status: 404 }
        );
      }
      
      const requiredQuantity = Math.floor(required.quantity * materialMultiplier);
      const availableQuantity = parseInt(playerMaterial.quantity.toString());
      
      if (availableQuantity < requiredQuantity) {
        return NextResponse.json(
          { error: `Insufficient ${required.materialType}: need ${requiredQuantity}, have ${availableQuantity}` },
          { status: 400 }
        );
      }
    }
    
    // Calculate quality from materials
    let totalQuality = 0;
    let qualityCount = 0;
    const materialQualities: number[] = [];
    
    for (const required of requiredMaterials) {
      const materialStackId = materials[required.materialType];
      const playerMaterial = await prisma.playerMaterial.findUnique({
        where: { id: materialStackId }
      });
      
      if (playerMaterial) {
        const qualityGrade = getQualityGrade(playerMaterial.purity);
        const effectiveness = qualityGrade.effectiveness;
        totalQuality += effectiveness;
        qualityCount++;
        materialQualities.push(effectiveness);
      }
    }
    
    // Calculate average quality
    const averageQuality = totalQuality / qualityCount;
    
    // Apply quality mismatch penalty
    const maxQuality = Math.max(...materialQualities);
    const minQuality = Math.min(...materialQualities);
    const qualityDifference = maxQuality - minQuality;
    
    let finalQuality = averageQuality;
    if (qualityDifference > 0.2) { // More than 20% difference
      const penalty = Math.min(0.5, qualityDifference * 0.5); // Up to 50% penalty
      finalQuality = averageQuality * (1 - penalty);
    }
    
    // Mastery bonus removed for now
    // finalQuality stays as is
    
    // Create the crafted modules
    const craftedModules = [];
    
    for (let i = 0; i < batchSize; i++) {
      // Add some variance for batch crafting (+/- 5%)
      const variance = batchSize > 1 ? (Math.random() * 0.1 - 0.05) : 0;
      const moduleQuality = Math.max(0.7, Math.min(1.3, finalQuality + variance));
      
      // Calculate final stats
      const baseStats = blueprint.baseStats as any;
      const finalStats: any = {};
      
      for (const [stat, value] of Object.entries(baseStats)) {
        if (typeof value === 'number') {
          finalStats[stat] = Math.round(value * moduleQuality);
        } else {
          finalStats[stat] = value;
        }
      }
      
      // Create the module with blueprint name for better display
      const craftedModule = await prisma.playerModule.create({
        data: {
          playerId: player.id,
          moduleId: blueprint.moduleId || blueprint.id,
          blueprintId: blueprint.id,
          quality: moduleQuality,
          stats: {
            ...finalStats,
            blueprintName: blueprint.name // Store the blueprint name for display
          }
        }
      });
      
      craftedModules.push(craftedModule);
    }
    
    // Consume materials
    for (const required of requiredMaterials) {
      const materialStackId = materials[required.materialType];
      const requiredQuantity = Math.floor(required.quantity * materialMultiplier);
      
      await prisma.playerMaterial.update({
        where: { id: materialStackId },
        data: {
          quantity: {
            decrement: requiredQuantity
          }
        }
      });
    }
    
    // Mastery system removed for now
    
    // Update blueprint usage
    await prisma.playerBlueprint.update({
      where: {
        playerId_blueprintId: {
          playerId: player.id,
          blueprintId: blueprint.id
        }
      },
      data: {
        timesUsed: {
          increment: batchSize
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      modules: craftedModules,
      quality: finalQuality,
      message: `Crafted ${batchSize} ${blueprint.name}${batchSize > 1 ? 's' : ''} at ${Math.round(finalQuality * 100)}% quality`
    });
    
  } catch (error) {
    console.error('Manufacturing error:', error);
    return NextResponse.json(
      { error: 'Failed to craft module' },
      { status: 500 }
    );
  }
}
