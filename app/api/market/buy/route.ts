import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateMarketPrice } from '@/lib/industrial/marketPricing';

export async function POST(request: Request) {
  try {
    const { materialType, tier, quality, quantity } = await request.json();
    
    if (!materialType || !tier || !quality || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
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
    
    // Calculate price
    const { buyPrice } = calculateMarketPrice(materialType, tier, quality, quantity);
    const totalCost = buyPrice * quantity;
    
    // Check if player has enough ORE
    const playerOre = parseInt(player.isk.toString());
    if (playerOre < totalCost) {
      return NextResponse.json(
        { error: `Insufficient ORE. Need ${totalCost}, have ${playerOre}` },
        { status: 400 }
      );
    }
    
    // Get the material ID
    const material = await prisma.material.findFirst({
      where: { name: materialType }
    });
    
    if (!material) {
      return NextResponse.json(
        { error: 'Material type not found' },
        { status: 404 }
      );
    }
    
    // Check if player already has this material/tier/quality combo
    const existingStack = await prisma.playerMaterial.findFirst({
      where: {
        playerId: player.id,
        materialId: material.id,
        tier: tier,
        purity: {
          gte: quality - 0.01,
          lte: quality + 0.01
        }
      }
    });
    
    if (existingStack) {
      // Add to existing stack
      await prisma.playerMaterial.update({
        where: { id: existingStack.id },
        data: {
          quantity: {
            increment: quantity
          }
        }
      });
    } else {
      // Create new stack
      await prisma.playerMaterial.create({
        data: {
          playerId: player.id,
          materialId: material.id,
          tier: tier,
          purity: quality,
          quantity: BigInt(quantity)
        }
      });
    }
    
    // Deduct ORE from player
    await prisma.player.update({
      where: { id: player.id },
      data: {
        isk: {
          decrement: totalCost
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `Purchased ${quantity} ${materialType} T${tier} at ${Math.round(quality * 100)}% quality for ${totalCost} ORE`,
      totalCost,
      pricePerUnit: buyPrice
    });
    
  } catch (error) {
    console.error('Market buy error:', error);
    return NextResponse.json(
      { error: 'Failed to complete purchase' },
      { status: 500 }
    );
  }
}
