import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateMaterialTier } from '@/lib/industrial/calculations';
import { estimateRefiningTimeSeconds } from '@/lib/industrial/time';
import { getCaptainEffects } from '@/lib/industrial/captains';

export async function POST(request: NextRequest) {
  try {
    const { materialIds, cycles = 1, facilityType = 'basic', captainId = null } = await request.json();
    const playerId = 'demo-player';

    if (!materialIds || materialIds.length === 0) {
      return NextResponse.json({ error: 'No materials selected' }, { status: 400 });
    }

    // Get all selected materials
    const materials = await prisma.playerMaterial.findMany({
      where: {
        id: { in: materialIds },
        playerId
      },
      include: { material: true }
    });

    if (materials.length === 0) {
      return NextResponse.json({ error: 'No materials found' }, { status: 404 });
    }

    // Validate all same type and tier
    const firstMat = materials[0];
    const allSame = materials.every(m => 
      m.materialId === firstMat.materialId && m.tier === firstMat.tier
    );

    if (!allSame) {
      return NextResponse.json({ error: 'All materials must be same type and tier' }, { status: 400 });
    }

    // Calculate weighted average purity and total quantity
    const totalQuantity = materials.reduce((sum, m) => sum + m.quantity, BigInt(0));
    const weightedPurity = materials.reduce((sum, m) => 
      sum + (m.purity * Number(m.quantity)), 0
    ) / Number(totalQuantity);

    // Simulate refining with weighted input
    const effects = getCaptainEffects(captainId);
    const baseLossRate = 0.2;
    const baseImprovementRate = 0.3;
    const adjustedLossRate = Math.max(0.05, baseLossRate * (1 - (effects.refiningYieldBonus || 0)));
    const adjustedImprovementRate = baseImprovementRate + (effects.refiningPurityBonus || 0);

    let currentQuantity = Number(totalQuantity);
    let currentPurity = weightedPurity * 100;
    let totalWaste = BigInt(0);

    for (let cycle = 1; cycle <= cycles; cycle++) {
      const purityGain = (100 - currentPurity) * adjustedImprovementRate;
      const outputPurity = Math.min(100, currentPurity + purityGain);
      const outputQuantity = Math.floor(currentQuantity * (1 - adjustedLossRate));
      const wasteQuantity = currentQuantity - outputQuantity;
      
      totalWaste += BigInt(wasteQuantity);
      currentQuantity = outputQuantity;
      currentPurity = outputPurity;
      
      if (currentQuantity <= 0) break;
    }

    const finalPurity = currentPurity / 100;
    const finalTier = calculateMaterialTier(finalPurity);

    // Calculate ISK cost (same as single refining)
    const baseCost = 10;
    const tierMult = Math.pow(1.5, firstMat.tier - 1);
    const purityMult = weightedPurity * 100 < 90 ? 1.0 : Math.pow(10, (weightedPurity * 100 - 90) / 10);
    const cycleMult = Math.pow(1.5, cycles - 1);
    const iskCost = BigInt(Math.floor(Number(totalQuantity) * baseCost * tierMult * purityMult * cycleMult));

    // Check ISK
    const player = await prisma.player.findFirst({ where: { id: playerId } });
    if (!player || player.isk < iskCost) {
      return NextResponse.json(
        { error: `Insufficient ORE: need ${iskCost.toString()}` },
        { status: 400 }
      );
    }

    const estimatedSeconds = estimateRefiningTimeSeconds(Number(totalQuantity), cycles, captainId);
    const estimatedCompletion = new Date(Date.now() + estimatedSeconds * 1000);

    // Consume all stacks and create job
    await prisma.$transaction(async (tx) => {
      // Deduct ISK
      await tx.player.update({
        where: { id: playerId },
        data: { isk: { decrement: iskCost } }
      });

      // Delete all input stacks
      await tx.playerMaterial.deleteMany({
        where: { id: { in: materialIds } }
      });

      // Create refining job
      await tx.refiningJob.create({
        data: {
          playerId,
          materialId: firstMat.materialId,
          inputQuantity: totalQuantity,
          inputPurity: weightedPurity,
          inputTier: firstMat.tier,
          cycleNumber: cycles,
          facilityType,
          facilityEfficiency: 0.7,
          outputQuantity: BigInt(currentQuantity),
          outputPurity: finalPurity,
          outputTier: finalTier,
          wasteQuantity: totalWaste,
          status: 'pending',
          estimatedCompletion,
          captainId: captainId || undefined
        }
      });
    });

    return NextResponse.json({
      success: true,
      mergedInput: {
        quantity: totalQuantity.toString(),
        purity: weightedPurity,
        stackCount: materials.length
      },
      preview: {
        outputQuantity: currentQuantity.toString(),
        outputPurity: finalPurity,
        wasteQuantity: totalWaste.toString()
      },
      iskCost: iskCost.toString(),
      estimatedSeconds,
      estimatedCompletion: estimatedCompletion.toISOString()
    });
  } catch (error) {
    console.error('Batch refining error:', error);
    return NextResponse.json({ error: 'Failed to process batch refining' }, { status: 500 });
  }
}

