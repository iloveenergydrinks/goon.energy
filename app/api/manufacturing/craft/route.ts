import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getQualityGrade } from '@/lib/industrial/quality';
import { estimateManufacturingTimeSeconds } from '@/lib/industrial/time';
import { getCaptainEffects } from '@/lib/industrial/captains';
import { computeManufacturingQualityScore } from '@/lib/industrial/calculations';

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
    
    // Collect material purities for rating model
    const materialPurities: number[] = [];
    
    for (const required of requiredMaterials) {
      const materialStackId = materials[required.materialType];
      const playerMaterial = await prisma.playerMaterial.findUnique({
        where: { id: materialStackId }
      });
      
      if (playerMaterial) {
        materialPurities.push(playerMaterial.purity);
      }
    }
    // Compute rating and multiplier using new model, with captain bonus
    const effects = getCaptainEffects(captainId);
    const captainQualityBonusPct = effects.manufacturingQualityBonus || 0;
    const qualityResult = computeManufacturingQualityScore(
      materialPurities,
      blueprint.tier || 1,
      captainQualityBonusPct
    );
    
    // Convert to timed job: consume inputs now, produce output after estimated time
    // Estimate time based on blueprint tier and material purity
    const avgPurity = materialPurities.length > 0
      ? materialPurities.reduce((a,b)=>a+b,0) / materialPurities.length
      : 0.5;
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
        // Store multiplier (0.7..1.3) derived from rating for final stat application
        outputQuality: qualityResult.multiplier,
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
        score: qualityResult.score,
        grade: qualityResult.grade,
        multiplier: qualityResult.multiplier,
        mismatchPenalty: qualityResult.mismatchPenalty
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
      // Create modules now
      const blueprint = job.blueprint;
      const createdModuleIds: string[] = [];
      for (let i = 0; i < (job.batchSize || 1); i++) {
        // Use exact quality from job (no variance for now; can add small ±1-2% later if desired)
        const moduleQuality = job.outputQuality ?? 1.0;
        const baseStats = blueprint.baseStats as any;
        const finalStats: any = {};
        for (const [stat, value] of Object.entries(baseStats)) {
          if (typeof value === 'number') {
            finalStats[stat] = Math.round(value * moduleQuality);
          } else {
            finalStats[stat] = value;
          }
        }
        const craftedModule = await prisma.playerModule.create({
          data: {
            playerId,
            moduleId: blueprint.moduleId || blueprint.id,
            blueprintId: blueprint.id,
            quality: moduleQuality,
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
