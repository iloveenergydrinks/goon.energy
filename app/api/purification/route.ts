import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { attemptPurification } from '@/lib/industrial/quality';

export async function POST(request: Request) {
  try {
    const { materialStackId, quantity, riskMode = 'standard' } = await request.json();
    
    if (!materialStackId || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get the material stack
    const playerMaterial = await prisma.playerMaterial.findUnique({
      where: { id: materialStackId },
      include: { material: true }
    });
    
    if (!playerMaterial) {
      return NextResponse.json(
        { error: 'Material stack not found' },
        { status: 404 }
      );
    }
    
    // Check if player has enough material
    const availableQuantity = parseInt(playerMaterial.quantity.toString());
    if (availableQuantity < quantity) {
      return NextResponse.json(
        { error: 'Insufficient material quantity' },
        { status: 400 }
      );
    }
    
    // Import RISK_MODES to get material cost
    const { RISK_MODES } = await import('@/lib/industrial/quality');
    const riskConfig = RISK_MODES[riskMode as keyof typeof RISK_MODES] || RISK_MODES.standard;
    
    // Calculate purification result
    const currentPurity = playerMaterial.purity;
    const purificationResult = attemptPurification(currentPurity, riskMode);
    
    // Calculate material cost based on risk mode
    const materialCost = Math.floor(quantity * (riskConfig.materialCost / 100));
    const outputQuantity = quantity - materialCost;
    const remainingQuantity = availableQuantity - quantity + outputQuantity;
    
    // Calculate new tier if quality improved significantly
    const newTier = purificationResult.newPurity >= 0.95 && playerMaterial.tier < 5 
      ? Math.min(5, playerMaterial.tier + 1) 
      : playerMaterial.tier;
    
    // Check if there's already a stack with the new purity
    const existingStack = await prisma.playerMaterial.findFirst({
      where: {
        playerId: playerMaterial.playerId,
        materialId: playerMaterial.materialId,
        tier: newTier,
        purity: purificationResult.newPurity,
        id: { not: materialStackId }
      }
    });
    
    if (remainingQuantity > 0) {
      if (existingStack) {
        // Merge with existing stack
        await prisma.$transaction([
          prisma.playerMaterial.update({
            where: { id: existingStack.id },
            data: {
              quantity: parseInt(existingStack.quantity.toString()) + remainingQuantity
            }
          }),
          prisma.playerMaterial.delete({
            where: { id: materialStackId }
          })
        ]);
      } else {
        // Update the current stack
        await prisma.playerMaterial.update({
          where: { id: materialStackId },
          data: {
            quantity: remainingQuantity,
            purity: purificationResult.newPurity,
            tier: newTier
          }
        });
      }
    } else {
      // Delete the stack if no material remains
      await prisma.playerMaterial.delete({
        where: { id: materialStackId }
      });
    }
    
    // Log the purification job (optional, for history tracking)
    // You could create a PurificationJob model similar to RefiningJob
    
    return NextResponse.json({
      success: true,
      result: purificationResult,
      materialCost,
      outputQuantity,
      remainingQuantity,
      message: purificationResult.message
    });
    
  } catch (error) {
    console.error('Purification error:', error);
    return NextResponse.json(
      { error: 'Failed to process purification' },
      { status: 500 }
    );
  }
}
