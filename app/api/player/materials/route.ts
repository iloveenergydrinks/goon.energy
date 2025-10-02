import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/player/materials - Get player materials
export async function GET(request: NextRequest) {
  try {
    // Ensure Prisma is connected
    await prisma.$connect();
    
    const playerId = 'demo-player';
    
    // Get player materials with full details
    const materials = await prisma.playerMaterial.findMany({
      where: { playerId },
      include: {
        material: true
      },
      orderBy: [
        { tier: 'desc' },
        { purity: 'desc' },
        { quantity: 'desc' }
      ]
    });
    
    // Convert BigInt to string for JSON serialization
    const serializedMaterials = materials.map(m => ({
      ...m,
      quantity: m.quantity.toString(),
      material: {
        ...m.material,
        baseValue: m.material.baseValue * m.tier // Scale value by tier
      }
    }));
    
    return NextResponse.json(serializedMaterials);
  } catch (error) {
    console.error('Error fetching player materials:', error);
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 });
  }
}










