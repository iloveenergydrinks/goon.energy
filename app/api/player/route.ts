import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/player - Get or create player
export async function GET(request: NextRequest) {
  try {
    // Ensure Prisma is connected
    await prisma.$connect();
    
    // For demo, we'll use a hardcoded player ID
    // In production, you'd get this from auth/session
    const playerId = 'demo-player';
    
    let player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        materials: {
          include: {
            material: true
          }
        },
        blueprints: true,
        _count: {
          select: {
            miningOps: true,
            resourceNodes: true
          }
        }
      }
    });
    
    // Create player if doesn't exist
    if (!player) {
      console.log('Creating new player:', playerId);
      player = await prisma.player.create({
        data: {
          id: playerId,
          name: 'Demo Player',
          isk: BigInt(1000000)
        },
        include: {
          materials: {
            include: {
              material: true
            }
          },
          blueprints: true,
          _count: {
            select: {
              miningOps: true,
              resourceNodes: true
            }
          }
        }
      });
      console.log('Player created successfully');
    }
    
    // Convert BigInt to string for JSON serialization
    const serializedPlayer = {
      ...player,
      isk: player.isk.toString(), // Keep as 'isk' for compatibility
      ore: player.isk.toString(), // Display as ORE in UI
      materials: player.materials.map(m => ({
        ...m,
        quantity: m.quantity.toString()
      }))
    };
    
    return NextResponse.json(serializedPlayer);
  } catch (error) {
    console.error('Error fetching player:', error);
    return NextResponse.json({ error: 'Failed to fetch player' }, { status: 500 });
  }
}

// POST /api/player/update-ore - Update player ORE
export async function POST(request: NextRequest) {
  try {
    await prisma.$connect();
    const { amount } = await request.json();
    const playerId = 'demo-player';
    
    const player = await prisma.player.update({
      where: { id: playerId },
      data: {
        isk: {
          increment: BigInt(amount)
        }
      }
    });
    
    return NextResponse.json({
      isk: player.isk.toString(), // Keep as 'isk' for compatibility
      ore: player.isk.toString() // Display as ORE in UI
    });
  } catch (error) {
    console.error('Error updating ISK:', error);
    return NextResponse.json({ error: 'Failed to update ISK' }, { status: 500 });
  }
}
