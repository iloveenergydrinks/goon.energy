import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getQualityGrade } from '@/lib/industrial/quality';
import { estimateManufacturingTimeSeconds } from '@/lib/industrial/time';
import { getCaptainEffects } from '@/lib/industrial/captains';
import { getMaterialStats, getAttributeForStat } from '@/lib/industrial/materialStats';

export async function POST(request: NextRequest) {
  try {
    const { blueprintId, materials, components = {}, batchSize = 1, captainId = null } = await request.json();
    
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
    
    // Remove batch discounts: materials scale linearly with batchSize
    const materialMultiplier = batchSize;
    
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
    
    // Check for required components
    const requiredComponents = blueprint.requiredComponents as any[] || [];
    
    for (const required of requiredComponents) {
      const componentStackId = components[required.componentId];
      if (!componentStackId) {
        return NextResponse.json(
          { error: `Missing component: ${required.componentId}` },
          { status: 400 }
        );
      }
      
      const playerComponent = await prisma.playerComponent.findUnique({
        where: { id: componentStackId }
      });
      
      if (!playerComponent) {
        return NextResponse.json(
          { error: `Component not found: ${required.componentId}` },
          { status: 404 }
        );
      }
      
      const requiredQuantity = required.quantity * batchSize; // No discount on components
      const availableQuantity = parseInt(playerComponent.quantity.toString());
      
      if (availableQuantity < requiredQuantity) {
        return NextResponse.json(
          { error: `Insufficient ${required.componentId}: need ${requiredQuantity}, have ${availableQuantity}` },
          { status: 400 }
        );
      }
    }
    
    // NEW: Calculate per-stat contributions using material attributes
    const baseStats = blueprint.baseStats as any;
    const materialContributions: Record<string, { materialType: string; attribute: string; value: number; purity: number }[]> = {};
    
    // Gather material stats for each required material
    for (const required of requiredMaterials) {
      const materialStackId = materials[required.materialType];
      const playerMaterial = await prisma.playerMaterial.findUnique({
        where: { id: materialStackId },
        include: { material: true }
      });
      
      if (!playerMaterial) continue;
      
      // Get material base stats for this tier
      const materialStats = getMaterialStats(required.materialType, playerMaterial.tier);
      
      // For each stat this material affects
      const affectedStats = required.affects || [];
      for (const statName of affectedStats) {
        if (!materialContributions[statName]) {
          materialContributions[statName] = [];
        }
        
        const attribute = getAttributeForStat(statName);
        const attributeValue = materialStats[attribute];
        
        materialContributions[statName].push({
          materialType: required.materialType,
          attribute,
          value: attributeValue,
          purity: playerMaterial.purity
        });
      }
    }
    
    // Captain effects
    const effects = getCaptainEffects(captainId);
    const captainQualityBonus = effects.manufacturingQualityBonus || 0;
    
    // Calculate final stats using: finalStat = baseStat × materialValue × purity × (1 + captainBonus)
    const finalStats: any = {};
    let totalMultiplier = 0;
    let statCount = 0;
    
    for (const [statName, baseValue] of Object.entries(baseStats)) {
      if (typeof baseValue !== 'number') {
        finalStats[statName] = baseValue;
        continue;
      }
      
      const contributors = materialContributions[statName];
      if (!contributors || contributors.length === 0) {
        // No material affects this stat; use base
        finalStats[statName] = baseValue;
      } else {
        // Average contribution from all materials affecting this stat
        const avgValue = contributors.reduce((sum, c) => sum + c.value, 0) / contributors.length;
        const avgPurity = contributors.reduce((sum, c) => sum + c.purity, 0) / contributors.length;
        
        // finalStat = baseStat × (materialValue / 100) × purity × (1 + captain)
        const materialMultiplier = (avgValue / 100) * avgPurity * (1 + captainQualityBonus);
        finalStats[statName] = Math.round(baseValue * materialMultiplier);
        
        totalMultiplier += materialMultiplier;
        statCount++;
      }
    }
    
    // Calculate average quality for job storage (for UI display)
    const avgQuality = statCount > 0 ? totalMultiplier / statCount : 1.0;
    
    // Estimate time
    const avgPurity = Object.values(materialContributions).flat().reduce((sum, c) => sum + c.purity, 0) / Math.max(1, Object.values(materialContributions).flat().length) || 0.5;
    const estimatedSeconds = estimateManufacturingTimeSeconds(blueprint.tier || 1, batchSize, avgPurity, captainId);
    const estimatedCompletion = new Date(Date.now() + estimatedSeconds * 1000);
    
    // Consume materials now
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
    
    // Consume components
    for (const required of requiredComponents) {
      const componentStackId = components[required.componentId];
      const requiredQuantity = required.quantity * batchSize;
      
      await prisma.playerComponent.update({
        where: { id: componentStackId },
        data: {
          quantity: {
            decrement: requiredQuantity
          }
        }
      });
    }
    
    // Mastery system removed for now
    
    // Create a manufacturing job record (no immediate module creation)
    await prisma.manufacturingJob.create({
      data: {
        playerId: player.id,
        blueprintId: blueprint.id,
        materials: requiredMaterials.map((req: any) => ({
          materialType: req.materialType,
          quantity: Math.floor(req.quantity * materialMultiplier)
        })),
        facilityType: 'basic',
        facilityQualityBonus: 1.0,
        outputType: 'module',
        // Store average quality multiplier for reference
        outputQuality: avgQuality,
        // Store final computed stats for job finalization
        statBonuses: finalStats,
        status: 'pending',
        estimatedTime: estimatedSeconds,
        estimatedCompletion,
        captainId: captainId || undefined,
        batchSize
      }
    });

    // Update blueprint usage
    await prisma.playerBlueprint.update({
      where: {
        playerId_blueprintId: {
          playerId: player.id,
          blueprintId: blueprint.id
        }
      },
      data: {
        timesUsed: { increment: batchSize }
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `Queued ${batchSize} ${blueprint.name}${batchSize > 1 ? 's' : ''}`,
      estimatedSeconds,
      estimatedCompletion: estimatedCompletion.toISOString(),
      qualityPreview: {
        avgMultiplier: avgQuality,
        finalStats
      }
    });
    
  } catch (error) {
    console.error('Manufacturing error:', error);
    return NextResponse.json(
      { error: 'Failed to craft module' },
      { status: 500 }
    );
  }
}

// GET to finalize any completed manufacturing jobs and list jobs
export async function GET(request: NextRequest) {
  try {
    const playerId = 'demo-player';
    const now = new Date();

    // Fetch all pending/processing jobs and finalize those whose time has elapsed
    const candidates = await prisma.manufacturingJob.findMany({
      where: {
        playerId,
        status: { in: ['pending', 'processing'] }
      },
      include: { blueprint: true }
    });

    const dueJobs = candidates.filter(job => {
      const started = new Date(job.startedAt).getTime();
      const etaMs = (job.estimatedTime || 0) * 1000;
      return started + etaMs <= now.getTime();
    });

    for (const job of dueJobs) {
      // Create modules now using pre-computed stats from job
      const blueprint = job.blueprint;
      const createdModuleIds: string[] = [];
      const finalStats = job.statBonuses as any || {};
      
      for (let i = 0; i < (job.batchSize || 1); i++) {
        const craftedModule = await prisma.playerModule.create({
          data: {
            playerId,
            moduleId: blueprint.moduleId || blueprint.id,
            blueprintId: blueprint.id,
            quality: job.outputQuality ?? 1.0,
            stats: { ...finalStats, blueprintName: blueprint.name }
          }
        });
        createdModuleIds.push(craftedModule.id);
      }

      await prisma.manufacturingJob.update({
        where: { id: job.id },
        data: { status: 'completed', completedAt: now, outputId: createdModuleIds[0] }
      });
    }

    const jobs = await prisma.manufacturingJob.findMany({
      where: { playerId },
      include: { blueprint: true },
      orderBy: { startedAt: 'desc' }
    });
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Manufacturing GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch manufacturing jobs' }, { status: 500 });
  }
}
