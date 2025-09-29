import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/mining/nodes - Get active resource nodes
export async function GET(request: NextRequest) {
  try {
    // Ensure Prisma is connected
    await prisma.$connect();
    
    const nodes = await prisma.resourceNode.findMany({
      where: {
        active: true,
        depleted: false
      },
      orderBy: {
        tier: 'asc'
      }
    });
    
    // Convert BigInt to string for JSON serialization
    const serializedNodes = nodes.map(node => ({
      ...node,
      totalAmount: node.totalAmount.toString(),
      currentAmount: node.currentAmount.toString()
    }));
    
    return NextResponse.json(serializedNodes);
  } catch (error) {
    console.error('Error fetching nodes:', error);
    return NextResponse.json({ error: 'Failed to fetch nodes' }, { status: 500 });
  }
}

// POST /api/mining/nodes - Generate new resource nodes
export async function POST(request: NextRequest) {
  try {
    // Ensure Prisma is connected
    await prisma.$connect();
    
    const playerId = 'demo-player';
    
    // Check if we need to generate nodes
    const existingNodes = await prisma.resourceNode.count({
      where: {
        active: true,
        depleted: false
      }
    });
    
    // Clear duplicates if any exist
    if (existingNodes > 6) {
      // Delete all nodes and regenerate
      await prisma.resourceNode.deleteMany({});
    } else if (existingNodes >= 6) {
      return NextResponse.json({ message: 'Enough nodes already exist' });
    }
    
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
      nodeTemplates.slice(0, 6 - existingNodes).map(async (template, index) => {
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
    
    // Also ensure base materials exist
    const materialTypes = ['titanium', 'iron', 'plasma', 'silicon', 'quantum', 'dark_matter'];
    const categories = ['metal', 'metal', 'gas', 'crystal', 'crystal', 'exotic'];
    
    for (let i = 0; i < materialTypes.length; i++) {
      await prisma.material.upsert({
        where: { id: materialTypes[i] },
        update: {},
        create: {
          id: materialTypes[i],
          name: materialTypes[i].charAt(0).toUpperCase() + materialTypes[i].slice(1).replace('_', ' '),
          category: categories[i],
          baseValue: 100 * (i + 1),
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
    
    return NextResponse.json({ 
      message: `Generated ${newNodes.length} new nodes`,
      nodes: newNodes.map(node => ({
        ...node,
        totalAmount: node.totalAmount.toString(),
        currentAmount: node.currentAmount.toString()
      }))
    });
  } catch (error) {
    console.error('Error generating nodes:', error);
    return NextResponse.json({ error: 'Failed to generate nodes' }, { status: 500 });
  }
}
