import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/mining/nodes/clear - Clear all nodes
export async function DELETE(request: NextRequest) {
  try {
    // Ensure Prisma is connected
    await prisma.$connect();
    
    // Delete all nodes
    await prisma.resourceNode.deleteMany({});
    
    // Generate fresh set of nodes
    const playerId = 'demo-player';
    
    // Define node templates
    const nodeTemplates = [
      {
        name: 'Rich Titanium Asteroid',
        type: 'asteroid',
        tier: 1,
        resourceType: 'titanium',
        totalAmount: BigInt(10000),
        baseYield: 50,
        purity: 0.25
      },
      {
        name: 'Dense Iron Deposit',
        type: 'asteroid',
        tier: 1,
        resourceType: 'iron',
        totalAmount: BigInt(15000),
        baseYield: 75,
        purity: 0.30
      },
      {
        name: 'Plasma Gas Nebula',
        type: 'gas_cloud',
        tier: 2,
        resourceType: 'plasma',
        totalAmount: BigInt(8000),
        baseYield: 40,
        purity: 0.45
      },
      {
        name: 'Silicon Crystal Formation',
        type: 'asteroid',
        tier: 2,
        resourceType: 'silicon',
        totalAmount: BigInt(6000),
        baseYield: 30,
        purity: 0.50
      },
      {
        name: 'Quantum Crystal Cluster',
        type: 'salvage',
        tier: 3,
        resourceType: 'quantum',
        totalAmount: BigInt(3000),
        baseYield: 20,
        purity: 0.65
      },
      {
        name: 'Dark Matter Anomaly',
        type: 'gas_cloud',
        tier: 4,
        resourceType: 'dark_matter',
        totalAmount: BigInt(1000),
        baseYield: 10,
        purity: 0.80
      }
    ];
    
    // Generate nodes with random positions
    const newNodes = await Promise.all(
      nodeTemplates.map(async (template, index) => {
        return await prisma.resourceNode.create({
          data: {
            ...template,
            currentAmount: template.totalAmount,
            sector: 'Alpha Sector',
            coordinates: [
              Math.floor(Math.random() * 1000),
              Math.floor(Math.random() * 1000),
              Math.floor(Math.random() * 1000)
            ],
            discoveredBy: playerId,
            discoveredAt: new Date()
          }
        });
      })
    );
    
    return NextResponse.json({ 
      message: 'Nodes cleared and regenerated',
      count: newNodes.length
    });
  } catch (error) {
    console.error('Error clearing nodes:', error);
    return NextResponse.json({ error: 'Failed to clear nodes' }, { status: 500 });
  }
}



