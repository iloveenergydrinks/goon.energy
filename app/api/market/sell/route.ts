import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateMarketPrice } from '@/lib/industrial/marketPricing';

export async function POST(request: Request) {
  try {
    const { materialStackId, quantity } = await request.json();
    
    if (!materialStackId || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get the material stack
    const playerMaterial = await prisma.playerMaterial.findUnique({
      where: { id: materialStackId },
      include: {
        material: true
      }
    });
    
    if (!playerMaterial) {
      return NextResponse.json(
        { error: 'Material stack not found' },
        { status: 404 }
      );
    }
    
    // Check if player has enough quantity
    const availableQuantity = parseInt(playerMaterial.quantity.toString());
    if (availableQuantity < quantity) {
      return NextResponse.json(
        { error: `Insufficient quantity. Have ${availableQuantity}, trying to sell ${quantity}` },
        { status: 400 }
      );
    }
    
    // Calculate price
    const { sellPrice } = calculateMarketPrice(
      playerMaterial.material.name,
      playerMaterial.tier,
      playerMaterial.purity,
      quantity
    );
    const totalRevenue = sellPrice * quantity;
    
    // Update or delete the material stack
    if (availableQuantity === quantity) {
      // Selling entire stack
      await prisma.playerMaterial.delete({
        where: { id: materialStackId }
      });
    } else {
      // Selling partial stack
      await prisma.playerMaterial.update({
        where: { id: materialStackId },
        data: {
          quantity: {
            decrement: quantity
          }
        }
      });
    }
    
    // Add ORE to player
    await prisma.player.update({
      where: { id: playerMaterial.playerId },
      data: {
        isk: {
          increment: totalRevenue
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `Sold ${quantity} ${playerMaterial.material.name} T${playerMaterial.tier} at ${Math.round(playerMaterial.purity * 100)}% quality for ${totalRevenue} ORE`,
      totalRevenue,
      pricePerUnit: sellPrice
    });
    
  } catch (error) {
    console.error('Market sell error:', error);
    return NextResponse.json(
      { error: 'Failed to complete sale' },
      { status: 500 }
    );
  }
}
