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
    
    // Get all materials from database
    const allMaterials = await prisma.material.findMany();
    
    // Generate node templates dynamically
    const nodeTemplates = allMaterials.map((material) => {
      const tier = Math.min(5, Math.max(1, Math.ceil((material.baseValue || 100) / 200)));
      const nodeTypeMap: Record<string, string> = {
        'metal': 'asteroid',
        'gas': 'gas_cloud',
        'crystal': 'salvage',
        'composite': 'asteroid',
        'exotic': 'gas_cloud'
      };
      const nodeType = nodeTypeMap[material.category] || 'asteroid';
      const totalAmount = BigInt(Math.floor(15000 / tier));
      const baseYield = Math.floor(100 / tier);
      const basePurity = 0.2 + (tier * 0.1);
      
      return {
        name: `${material.name} ${nodeType === 'asteroid' ? 'Asteroid' : nodeType === 'gas_cloud' ? 'Nebula' : 'Cluster'}`,
        type: nodeType,
        tier,
        resourceType: material.id,
        totalAmount,
        baseYield,
        purity: basePurity
      };
    });
    
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



