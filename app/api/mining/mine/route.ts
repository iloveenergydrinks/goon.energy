import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateMaterialTier } from '@/lib/industrial/calculations';

// POST /api/mining/mine - Mine a resource node
export async function POST(request: NextRequest) {
  try {
    // Ensure Prisma is connected
    await prisma.$connect();
    
    const { nodeId } = await request.json();
    const playerId = 'demo-player';
    
    if (!nodeId) {
      return NextResponse.json({ error: 'Node ID required' }, { status: 400 });
    }
    
    // Get the node and check if it's mineable
    const node = await prisma.resourceNode.findUnique({
      where: { id: nodeId }
    });
    
    if (!node) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 });
    }
    
    if (node.depleted || !node.active) {
      return NextResponse.json({ error: 'Node is depleted or inactive' }, { status: 400 });
    }
    
    // Calculate mining yield with some randomness
    const baseYield = node.baseYield;
    const variance = 0.2; // ±20% variance
    const actualYield = Math.floor(baseYield * (1 + (Math.random() - 0.5) * variance));
    const minedAmount = BigInt(Math.min(actualYield, Number(node.currentAmount)));
    
    // Calculate material quality with some randomness
    const purityVariance = 0.1; // ±10% purity variance
    const actualPurity = Math.max(0, Math.min(1, 
      node.purity + (Math.random() - 0.5) * purityVariance
    ));
    const tier = calculateMaterialTier(actualPurity);
    
    // Start a transaction with longer timeout (30 seconds)
    const result = await prisma.$transaction(async (tx) => {
      // Update the node
      const updatedNode = await tx.resourceNode.update({
        where: { id: nodeId },
        data: {
          currentAmount: {
            decrement: minedAmount
          },
          depleted: node.currentAmount - minedAmount <= 0
        }
      });
      
      // Get or create the material type
      let material = await tx.material.findUnique({
        where: { id: node.resourceType }
      });
      
      if (!material) {
        // Create material if it doesn't exist
        material = await tx.material.create({
          data: {
            id: node.resourceType,
            name: node.resourceType.charAt(0).toUpperCase() + node.resourceType.slice(1).replace('_', ' '),
            category: node.type === 'gas_cloud' ? 'gas' : 
                     node.tier >= 4 ? 'exotic' : 
                     node.tier >= 3 ? 'crystal' : 'metal',
            baseValue: 100 * node.tier,
            baseAttributes: {
              strength: 0.5 + Math.random() * 0.3,
              conductivity: 0.4 + Math.random() * 0.4,
              density: 0.3 + Math.random() * 0.5,
              reactivity: 0.4 + Math.random() * 0.4,
              stability: 0.5 + Math.random() * 0.3,
              elasticity: 0.3 + Math.random() * 0.4
            }
          }
        });
      }
      
      // Add to player's inventory
      const existingStack = await tx.playerMaterial.findUnique({
        where: {
          playerId_materialId_tier_purity: {
            playerId,
            materialId: material.id,
            tier,
            purity: Math.round(actualPurity * 100) / 100 // Round to 2 decimals
          }
        }
      });
      
      let playerMaterial;
      if (existingStack) {
        // Add to existing stack
        playerMaterial = await tx.playerMaterial.update({
          where: {
            id: existingStack.id
          },
          data: {
            quantity: {
              increment: minedAmount
            }
          },
          include: {
            material: true
          }
        });
      } else {
        // Create new stack
        playerMaterial = await tx.playerMaterial.create({
        data: {
          playerId,
          materialId: material.id,
          quantity: minedAmount,
          tier,
          purity: Math.round(actualPurity * 100) / 100,
          attributes: material.baseAttributes as any
        },
          include: {
            material: true
          }
        });
      }
      
      // Record the mining operation
      const miningOp = await tx.miningOperation.create({
        data: {
          playerId,
          nodeId,
          materialGained: material.id,
          quantityMined: minedAmount,
          purityGained: actualPurity,
          tierGained: tier
        }
      });
      
      // Give player some ORE as bonus
      const oreReward = BigInt(Math.floor(Number(minedAmount) * tier * 10));
      const player = await tx.player.update({
        where: { id: playerId },
        data: {
          isk: {
            increment: oreReward
          }
        }
      });
      
      return {
        minedAmount,
        material,
        playerMaterial,
        updatedNode,
        iskReward: oreReward, // Keep as iskReward for compatibility
        oreReward,
        player
      };
    }, {
      maxWait: 30000, // 30 seconds max wait
      timeout: 30000  // 30 seconds timeout
    });
    
    // Return mining results
    return NextResponse.json({
      success: true,
      mined: {
        material: result.material.name,
        quantity: result.minedAmount.toString(),
        tier,
        purity: Math.round(actualPurity * 100) / 100,
        iskReward: result.oreReward.toString(), // Keep as iskReward for frontend compatibility
        oreReward: result.oreReward.toString()
      },
      node: {
        id: result.updatedNode.id,
        currentAmount: result.updatedNode.currentAmount.toString(),
        depleted: result.updatedNode.depleted
      },
      inventory: {
        totalQuantity: result.playerMaterial.quantity.toString(),
        stackId: result.playerMaterial.id
      },
      player: {
        isk: result.player.isk.toString(), // Keep as isk for compatibility
        ore: result.player.isk.toString() // Display as ORE in UI
      }
    });
  } catch (error) {
    console.error('Error mining node:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ 
      error: 'Failed to mine node',
      details: errorMessage 
    }, { status: 500 });
  }
}
