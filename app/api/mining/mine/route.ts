import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateQualityForMining } from '@/lib/industrial/quality';
import { calculateComponentDrops, formatComponentDrops } from '@/lib/industrial/componentDrops';

// Cache material data to avoid repeated lookups
const materialCache = new Map();

// POST /api/mining/mine - Mine a resource node (OPTIMIZED)
export async function POST(request: NextRequest) {
  try {
    const { nodeId, multiplier = 1 } = await request.json();
    const playerId = 'demo-player';
    
    if (!nodeId) {
      return NextResponse.json({ error: 'Node ID required' }, { status: 400 });
    }
    
    // Get the node
    const node = await prisma.resourceNode.findUnique({
      where: { id: nodeId },
      select: {
        id: true,
        tier: true,
        resourceType: true,
        currentAmount: true,
        baseYield: true,
        depleted: true,
        active: true
      }
    });
    
    if (!node || node.depleted || !node.active) {
      return NextResponse.json({ error: 'Node unavailable' }, { status: 400 });
    }
    
    // Calculate yield
    const baseYield = node.baseYield * multiplier;
    const actualYield = Math.floor(baseYield * (0.8 + Math.random() * 0.4)); // ±20% variance
    const minedAmount = BigInt(Math.min(actualYield, Number(node.currentAmount)));
    
    // Calculate tier with discrete outcomes
    const tierRoll = Math.random();
    let tier: number;
    
    if (node.tier === 5) {
      // T5 nodes: 30% T4, 70% T5
      if (tierRoll < 0.3) {
        tier = 4;
      } else {
        tier = 5;
      }
    } else if (node.tier === 4) {
      // T4 nodes: 20% T3, 60% T4, 20% T5
      if (tierRoll < 0.2) {
        tier = 3;
      } else if (tierRoll < 0.8) {
        tier = 4;
      } else {
        tier = 5;
      }
    } else if (node.tier === 3) {
      // T3 nodes: 20% T2, 60% T3, 20% T4
      if (tierRoll < 0.2) {
        tier = 2;
      } else if (tierRoll < 0.8) {
        tier = 3;
      } else {
        tier = 4;
      }
    } else if (node.tier === 2) {
      // T2 nodes: 20% T1, 60% T2, 20% T3
      if (tierRoll < 0.2) {
        tier = 1;
      } else if (tierRoll < 0.8) {
        tier = 2;
      } else {
        tier = 3;
      }
    } else {
      // T1 nodes: 60% T1, 30% T2, 10% T3
      if (tierRoll < 0.6) {
        tier = 1;
      } else if (tierRoll < 0.9) {
        tier = 2;
      } else {
        tier = 3;
      }
    }
    
    // Generate quality-based purity using the new system
    const actualPurity = generateQualityForMining(node.tier, tier);
    
    const roundedPurity = Math.round(actualPurity * 100) / 100;
    const oreReward = BigInt(Math.floor(Number(minedAmount) * tier * 10));
    
    // Get or create material (use cache)
    let material = materialCache.get(node.resourceType);
    if (!material) {
      material = await prisma.material.findUnique({
        where: { id: node.resourceType }
      });
      
      if (!material) {
        // Create material if doesn't exist
        const category = node.tier >= 4 ? 'exotic' : node.tier >= 3 ? 'crystal' : 'metal';
        material = await prisma.material.create({
          data: {
            id: node.resourceType,
            name: node.resourceType.charAt(0).toUpperCase() + node.resourceType.slice(1).replace('_', ' '),
            category,
            baseValue: 100 * node.tier,
            baseAttributes: {}
          }
        });
      }
      materialCache.set(node.resourceType, material);
    }
    
    // Calculate component drops
    const componentDrops = calculateComponentDrops(node.tier, tier);
    const formattedDrops = formatComponentDrops(componentDrops);
    
    // Prepare component upserts
    const componentUpserts = componentDrops.map(componentId => 
      prisma.playerComponent.upsert({
        where: {
          playerId_componentId_quality: {
            playerId,
            componentId,
            quality: 100 // Default quality for now
          }
        },
        update: {
          quantity: { increment: 1n }
        },
        create: {
          playerId,
          componentId,
          quantity: 1n,
          quality: 100
        }
      })
    );
    
    // Execute all database operations in parallel
    const [updatedNode, playerMaterial, player, ...components] = await Promise.all([
      // Update node
      prisma.resourceNode.update({
        where: { id: nodeId },
        data: {
          currentAmount: { decrement: minedAmount },
          depleted: node.currentAmount - minedAmount <= 0
        }
      }),
      
      // Upsert player material (create or update in one operation) - as RAW ORE
      prisma.playerMaterial.upsert({
        where: {
          playerId_materialId_tier_purity: {
            playerId,
            materialId: material.id,
            tier,
            purity: roundedPurity
          }
        },
        update: {
          quantity: { increment: minedAmount }
        },
        create: {
          playerId,
          materialId: material.id,
          quantity: minedAmount,
          tier,
          purity: roundedPurity,
          attributes: {},
          isRefined: false // Mining drops RAW ORE
        }
      }),
      
      // Update player ORE
      prisma.player.update({
        where: { id: playerId },
        data: { isk: { increment: oreReward } }
      }),
      
      // Add component drops
      ...componentUpserts
    ]);
    
    // Skip mining operation recording for speed (can add back if needed)
    
    // Return results immediately
    return NextResponse.json({
      success: true,
      mined: {
        material: material.name,
        quantity: minedAmount.toString(),
        tier,
        purity: roundedPurity,
        iskReward: oreReward.toString()
      },
      componentDrops: formattedDrops, // Add component drops to response
      node: {
        id: updatedNode.id,
        currentAmount: updatedNode.currentAmount.toString(),
        depleted: updatedNode.depleted
      },
      player: {
        isk: player.isk.toString()
      }
    });
    
  } catch (error) {
    console.error('Mining error:', error);
    return NextResponse.json({ 
      error: 'Mining failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
