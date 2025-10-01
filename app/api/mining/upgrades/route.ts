import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/mining/upgrades - Get player upgrades
export async function GET() {
  try {
    const playerId = 'demo-player';
    
    // Ensure player exists first
    let player = await prisma.player.findUnique({
      where: { id: playerId }
    });
    
    if (!player) {
      // Create demo player if doesn't exist
      player = await prisma.player.create({
        data: {
          id: playerId,
          name: 'Demo Player',
          isk: BigInt(1000000)
        }
      });
    }
    
    // Get or create player upgrades
    let upgrades = await prisma.playerUpgrades.findUnique({
      where: { playerId }
    });
    
    if (!upgrades) {
      upgrades = await prisma.playerUpgrades.create({
        data: {
          playerId,
          clickPower: 1,
          autoMiners: 0
        }
      });
    }
    
    return NextResponse.json(upgrades);
  } catch (error) {
    console.error('Error fetching upgrades:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch upgrades'
    }, { status: 500 });
  }
}

// POST /api/mining/upgrades - Buy an upgrade
export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json();
    const playerId = 'demo-player';
    
    console.log('Buying upgrade:', type, 'for player:', playerId);
    
    if (!type || !['clickPower', 'autoMiner'].includes(type)) {
      return NextResponse.json({ error: 'Invalid upgrade type' }, { status: 400 });
    }
    
    // Get current player and upgrades
    const [player, upgrades] = await Promise.all([
      prisma.player.findUnique({ where: { id: playerId } }),
      prisma.playerUpgrades.findUnique({ where: { playerId } })
    ]);
    
    console.log('Player ORE:', player?.isk?.toString());
    console.log('Current upgrades:', upgrades);
    
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    
    // Create upgrades if they don't exist
    const currentUpgrades = upgrades || {
      clickPower: 1,
      autoMiners: 0
    };
    
    // Calculate cost
    let cost: bigint;
    if (type === 'clickPower') {
      cost = BigInt(Math.floor(100 * Math.pow(2, currentUpgrades.clickPower)));
    } else {
      cost = BigInt(Math.floor(500 * Math.pow(3, currentUpgrades.autoMiners)));
    }
    
    console.log('Upgrade cost:', cost.toString());
    console.log('Can afford?', player.isk >= cost);
    
    // Check if player can afford
    if (player.isk < cost) {
      return NextResponse.json({ 
        error: 'Insufficient ORE',
        required: cost.toString(),
        current: player.isk.toString()
      }, { status: 400 });
    }
    
    // Update in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct cost
      const updatedPlayer = await tx.player.update({
        where: { id: playerId },
        data: {
          isk: player.isk - cost
        }
      });
      
      // Update or create upgrades
      let updatedUpgrades;
      if (upgrades) {
        updatedUpgrades = await tx.playerUpgrades.update({
          where: { playerId },
          data: {
            clickPower: type === 'clickPower' ? upgrades.clickPower + 1 : upgrades.clickPower,
            autoMiners: type === 'autoMiner' ? upgrades.autoMiners + 1 : upgrades.autoMiners
          }
        });
      } else {
        updatedUpgrades = await tx.playerUpgrades.create({
          data: {
            playerId,
            clickPower: type === 'clickPower' ? 2 : 1,
            autoMiners: type === 'autoMiner' ? 1 : 0
          }
        });
      }
      
      return {
        player: updatedPlayer,
        upgrades: updatedUpgrades
      };
    });
    
    return NextResponse.json({
      success: true,
      upgrades: result.upgrades,
      player: {
        isk: result.player.isk.toString()
      }
    });
  } catch (error) {
    console.error('Error buying upgrade:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Failed to buy upgrade',
      details: errorMessage
    }, { status: 500 });
  }
}
