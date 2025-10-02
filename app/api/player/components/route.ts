import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getComponentById } from '@/lib/industrial/componentDrops';

// GET /api/player/components - Get player's components
export async function GET(request: NextRequest) {
  try {
    const playerId = 'demo-player';
    
    // Get player's components
    const components = await prisma.playerComponent.findMany({
      where: { playerId },
      orderBy: [
        { componentId: 'asc' },
        { quality: 'desc' }
      ]
    });
    
    // Enrich with component definitions
    const enrichedComponents = components.map(comp => {
      const definition = getComponentById(comp.componentId);
      return {
        ...comp,
        quantity: comp.quantity.toString(),
        name: definition?.name || comp.componentId,
        emoji: definition?.emoji || '📦',
        rarity: definition?.rarity || 'common',
        description: definition?.description || '',
        use: definition?.use || '',
        minRoom: definition?.minRoom || 1,
        minTier: definition?.minTier || 1
      };
    });
    
    return NextResponse.json({
      components: enrichedComponents
    });
    
  } catch (error) {
    console.error('Error fetching components:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch components',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
