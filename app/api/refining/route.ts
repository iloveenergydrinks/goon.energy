import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateMaterialTier } from '@/lib/industrial/calculations';
import { estimateRefiningTimeSeconds } from '@/lib/industrial/time';
import { getCaptainEffects } from '@/lib/industrial/captains';

// New refining formula: repeatable with diminishing returns
function calculateRefiningCycle(
  inputPurity: number,
  improvementRate: number = 0.3, // Base 30% improvement toward 100%
  lossRate: number = 0.2 // Base 20% quantity loss
): { outputPurity: number; retentionRate: number } {
  // Purity improvement: (100 - current) × rate + current
  const purityGain = (100 - inputPurity) * improvementRate;
  const outputPurity = Math.min(100, inputPurity + purityGain);
  
  // Quantity retention
  const retentionRate = 1 - lossRate;
  
  return { outputPurity, retentionRate };
}

// GET /api/refining - Get player's refining jobs
export async function GET(request: NextRequest) {
  try {
    const playerId = 'demo-player';

    // Finalize any completed jobs
    const now = new Date();
    const dueJobs = await prisma.refiningJob.findMany({
      where: {
        playerId,
        status: { in: ['pending', 'processing'] },
        estimatedCompletion: { lte: now }
      }
    });

    if (dueJobs.length > 0) {
      for (const job of dueJobs) {
        // Add the refined output back to inventory
        if (job.outputQuantity && job.outputQuantity > BigInt(0) && job.outputPurity && job.outputTier) {
          await prisma.$transaction(async (tx) => {
            // Try to merge with an existing stack of same tier/purity (~±0.01 window)
            const existingRefined = await tx.playerMaterial.findFirst({
              where: {
                playerId,
                materialId: job.materialId,
                tier: job.outputTier!,
                purity: {
                  gte: job.outputPurity! - 0.01,
                  lte: job.outputPurity! + 0.01
                }
              }
            });

            if (existingRefined) {
              await tx.playerMaterial.update({
                where: { id: existingRefined.id },
                data: { quantity: existingRefined.quantity + job.outputQuantity! }
              });
            } else {
              // Create a new stack with simple attributes mirror from a minimal lookup of any prior stack of this material
              const anyStack = await tx.playerMaterial.findFirst({
                where: { playerId, materialId: job.materialId },
              });
              await tx.playerMaterial.create({
                data: {
                  playerId,
                  materialId: job.materialId,
                  quantity: job.outputQuantity!,
                  tier: job.outputTier!,
                  purity: job.outputPurity!,
                  attributes: anyStack?.attributes ?? {},
                  isRefined: true // Refining always produces refined materials
                }
              });
            }

            await tx.refiningJob.update({
              where: { id: job.id },
              data: { status: 'completed', completedAt: now }
            });
          });
        } else {
          await prisma.refiningJob.update({
            where: { id: job.id },
            data: { status: 'failed', completedAt: now }
          });
        }
      }
    }

    const jobs = await prisma.refiningJob.findMany({
      where: { playerId },
      orderBy: { startedAt: 'desc' }
    });

    // Convert BigInt to string for JSON serialization
    const serialized = jobs.map(job => ({
      ...job,
      inputQuantity: job.inputQuantity.toString(),
      outputQuantity: job.outputQuantity?.toString() || null,
      wasteQuantity: job.wasteQuantity?.toString() || null
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching refining jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch refining jobs' }, { status: 500 });
  }
}

// POST /api/refining - Start a new refining job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      materialId,
      quantity,
      cycles = 1,
      facilityType = 'basic',
      captainId = null
    } = body;

    const playerId = 'demo-player';

    // Get the player's material stack
    const playerMaterial = await prisma.playerMaterial.findFirst({
      where: { playerId, id: materialId },
      include: { material: true }
    });

    if (!playerMaterial) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    if (BigInt(quantity) > playerMaterial.quantity) {
      return NextResponse.json({ error: 'Insufficient material quantity' }, { status: 400 });
    }

    // Facility efficiency (flat for MVP)
    const facilityEfficiencies: Record<string, number> = {
      basic: 0.7,
      standard: 0.75,
      advanced: 0.8,
      specialized: 0.85,
      capital: 0.9
    };
    const efficiency = facilityEfficiencies[facilityType] || 0.7;

    // Apply captain effects to yields/purity
    const effects = getCaptainEffects(captainId);
    const yieldBonus = effects.refiningYieldBonus ?? 0; // Reduces loss rate
    const purityBonus = effects.refiningPurityBonus ?? 0; // Adds to improvement rate

    // Base refining parameters
    const baseLossRate = 0.2; // 20% material loss per cycle
    const baseImprovementRate = 0.3; // 30% improvement toward 100%

    // Simulate cycles to compute final output (but do not grant yet)
    let currentQuantity = BigInt(quantity);
    let currentPurity = playerMaterial.purity * 100; // Convert to 0-100 scale
    let totalWaste = BigInt(0);

    for (let cycle = 1; cycle <= cycles; cycle++) {
      // Calculate this cycle's refining
      const adjustedLossRate = Math.max(0.05, baseLossRate * (1 - yieldBonus)); // Captain reduces loss
      const adjustedImprovementRate = baseImprovementRate + purityBonus; // Captain adds to improvement
      
      const result = calculateRefiningCycle(currentPurity, adjustedImprovementRate, adjustedLossRate);
      
      const outputQuantity = BigInt(Math.floor(Number(currentQuantity) * result.retentionRate));
      const wasteQuantity = currentQuantity - outputQuantity;
      totalWaste += wasteQuantity;

      currentQuantity = outputQuantity;
      currentPurity = result.outputPurity;
      if (currentQuantity <= BigInt(0)) break;
    }

    const finalPurity = currentPurity / 100; // Convert back to 0-1 scale
    const currentTier = calculateMaterialTier(finalPurity);

    // Estimate time for the whole refining job
    const estimatedSeconds = estimateRefiningTimeSeconds(parseInt(BigInt(quantity).toString()), cycles, captainId);
    const estimatedCompletion = new Date(Date.now() + estimatedSeconds * 1000);

    // Consume input now; grant output on completion
    await prisma.$transaction(async (tx) => {
      const newQuantity = playerMaterial.quantity - BigInt(quantity);
      if (newQuantity <= BigInt(0)) {
        await tx.playerMaterial.delete({ where: { id: materialId } });
      } else {
        await tx.playerMaterial.update({ where: { id: materialId }, data: { quantity: newQuantity } });
      }

      await tx.refiningJob.create({
        data: {
          playerId,
          materialId: playerMaterial.materialId,
          inputQuantity: BigInt(quantity),
          inputPurity: playerMaterial.purity,
          inputTier: playerMaterial.tier,
          cycleNumber: cycles,
          facilityType,
          facilityEfficiency: efficiency,
          outputQuantity: currentQuantity,
          outputPurity: finalPurity,
          outputTier: currentTier,
          wasteQuantity: totalWaste,
          status: 'pending',
          estimatedCompletion,
          captainId: captainId || undefined
        }
      });
    });

    return NextResponse.json({
      success: true,
      estimatedSeconds,
      estimatedCompletion: estimatedCompletion.toISOString(),
      preview: {
        outputQuantity: currentQuantity.toString(),
        outputPurity: finalPurity,
        outputTier: currentTier,
        wasteQuantity: totalWaste.toString(),
        purityImprovement: finalPurity - playerMaterial.purity
      }
    });
  } catch (error) {
    console.error('Error creating refining job:', error);
    return NextResponse.json({ error: 'Failed to create refining job' }, { status: 500 });
  }
}


