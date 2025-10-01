import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateRefiningOutput } from '@/lib/industrial/calculations';

// GET /api/refining - Get player's refining jobs
export async function GET(request: NextRequest) {
  try {
    const playerId = 'demo-player';
    
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
      facilityType = 'basic'
    } = body;
    
    const playerId = 'demo-player';
    
    // Get the player's material
    const playerMaterial = await prisma.playerMaterial.findFirst({
      where: {
        playerId,
        id: materialId
      },
      include: {
        material: true
      }
    });
    
    if (!playerMaterial) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }
    
    if (BigInt(quantity) > playerMaterial.quantity) {
      return NextResponse.json({ error: 'Insufficient material quantity' }, { status: 400 });
    }
    
    // Calculate refining output for each cycle
    let currentQuantity = BigInt(quantity);
    let currentPurity = playerMaterial.purity;
    let currentTier = playerMaterial.tier;
    let totalWaste = BigInt(0);
    const jobs = [];
    
    // Get facility efficiency based on type
    const facilityEfficiencies: Record<string, number> = {
      basic: 0.7,
      standard: 0.75,
      advanced: 0.8,
      specialized: 0.85,
      capital: 0.9
    };
    
    const efficiency = facilityEfficiencies[facilityType] || 0.7;
    
    for (let cycle = 1; cycle <= cycles; cycle++) {
      // Calculate output for this cycle
      const output = calculateRefiningOutput(
        parseInt(currentQuantity.toString()),
        currentPurity,
        currentTier,
        efficiency,
        cycle
      );
      
      const outputQuantity = BigInt(Math.floor(output.outputQuantity));
      const wasteQuantity = currentQuantity - outputQuantity;
      totalWaste += wasteQuantity;
      
      // Create refining job for this cycle
      const job = await prisma.refiningJob.create({
        data: {
          playerId,
          materialId: playerMaterial.materialId,
          inputQuantity: currentQuantity,
          inputPurity: currentPurity,
          inputTier: currentTier,
          cycleNumber: cycle,
          facilityType,
          facilityEfficiency: efficiency,
          outputQuantity,
          outputPurity: output.outputPurity,
          outputTier: output.outputTier,
          wasteQuantity,
          status: 'processing'
        }
      });
      
      jobs.push(job);
      
      // Update for next cycle
      currentQuantity = outputQuantity;
      currentPurity = output.outputPurity;
      currentTier = output.outputTier;
      
      // Stop if we run out of material
      if (currentQuantity <= 0) break;
    }
    
    // Update player's material inventory
    await prisma.$transaction(async (tx) => {
      // Reduce the original material quantity
      const newQuantity = playerMaterial.quantity - BigInt(quantity);
      
      if (newQuantity <= 0) {
        // Delete the material stack if empty
        await tx.playerMaterial.delete({
          where: { id: materialId }
        });
      } else {
        // Update the quantity
        await tx.playerMaterial.update({
          where: { id: materialId },
          data: { quantity: newQuantity }
        });
      }
      
      // Add the refined material (from the last cycle)
      if (currentQuantity > 0 && jobs.length > 0) {
        const lastJob = jobs[jobs.length - 1];
        
        // Check if player already has this material at this tier/purity
        const existingRefined = await tx.playerMaterial.findFirst({
          where: {
            playerId,
            materialId: playerMaterial.materialId,
            tier: lastJob.outputTier!,
            purity: {
              gte: lastJob.outputPurity! - 0.01,
              lte: lastJob.outputPurity! + 0.01
            }
          }
        });
        
        if (existingRefined) {
          // Add to existing stack
          await tx.playerMaterial.update({
            where: { id: existingRefined.id },
            data: {
              quantity: existingRefined.quantity + currentQuantity
            }
          });
        } else {
          // Create new stack
          await tx.playerMaterial.create({
            data: {
              playerId,
              materialId: playerMaterial.materialId,
              quantity: currentQuantity,
              tier: lastJob.outputTier!,
              purity: lastJob.outputPurity!,
              attributes: playerMaterial.attributes // Keep the same attributes for now
            }
          });
        }
      }
      
      // Mark all jobs as completed
      await tx.refiningJob.updateMany({
        where: {
          id: {
            in: jobs.map(j => j.id)
          }
        },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      });
    });
    
    // Return the refining results
    const serialized = jobs.map(job => ({
      ...job,
      inputQuantity: job.inputQuantity.toString(),
      outputQuantity: job.outputQuantity?.toString() || null,
      wasteQuantity: job.wasteQuantity?.toString() || null
    }));
    
    return NextResponse.json({
      success: true,
      jobs: serialized,
      totalWaste: totalWaste.toString(),
      finalQuantity: currentQuantity.toString(),
      finalPurity: currentPurity,
      finalTier: currentTier
    });
    
  } catch (error) {
    console.error('Error creating refining job:', error);
    return NextResponse.json({ error: 'Failed to create refining job' }, { status: 500 });
  }
}


