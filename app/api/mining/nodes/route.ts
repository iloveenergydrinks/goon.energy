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
    
    // Get all materials from database and generate nodes dynamically
    const allMaterials = await prisma.material.findMany();
    
    // Generate node templates from materials
    const nodeTemplates = allMaterials.map((material) => {
      // Assign tier based on material baseValue (higher value = higher tier)
      const tier = Math.min(5, Math.max(1, Math.ceil((material.baseValue || 100) / 200)));
      
      // Determine node type based on material category
      const nodeTypeMap: Record<string, string> = {
        'metal': 'asteroid',
        'gas': 'gas_cloud',
        'crystal': 'salvage',
        'composite': 'asteroid',
        'exotic': 'gas_cloud'
      };
      const nodeType = nodeTypeMap[material.category] || 'asteroid';
      
      // Scale amounts and yields by tier (higher tier = rarer)
      const totalAmount = BigInt(Math.floor(15000 / tier));
      const baseYield = Math.floor(100 / tier);
      const basePurity = 0.2 + (tier * 0.1);
      
      return {
        name: `${material.name} ${nodeType === 'asteroid' ? 'Asteroid' : nodeType === 'gas_cloud' ? 'Nebula' : 'Cluster'}`,
        type: nodeType,
        tier,
        resourceType: material.id, // Use material ID as resourceType
        totalAmount,
        baseYield,
        purity: basePurity
      };
    });
    
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
    
    // Materials are now managed through /admin/materials
    // No auto-creation needed
    
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
