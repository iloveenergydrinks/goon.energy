import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/mining/regenerate - Regenerate a depleted node
export async function POST(request: NextRequest) {
  try {
    const { nodeId } = await request.json();
    
    if (!nodeId) {
      return NextResponse.json({ error: 'Node ID required' }, { status: 400 });
    }
    
    // Get the node
    const node = await prisma.resourceNode.findUnique({
      where: { id: nodeId }
    });
    
    if (!node) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 });
    }
    
    // Regenerate the node with some variation
    const regenerationBonus = 1 + Math.random() * 0.2; // 100-120% of original
    const newTotal = BigInt(Math.floor(Number(node.totalAmount) * regenerationBonus));
    
    // Update the node
    const updatedNode = await prisma.resourceNode.update({
      where: { id: nodeId },
      data: {
        currentAmount: newTotal,
        totalAmount: newTotal,
        depleted: false,
        // Slightly improve purity on regeneration
        purity: Math.min(1, node.purity + Math.random() * 0.05)
      }
    });
    
    return NextResponse.json({
      success: true,
      node: {
        id: updatedNode.id,
        currentAmount: updatedNode.currentAmount.toString(),
        totalAmount: updatedNode.totalAmount.toString(),
        depleted: updatedNode.depleted,
        purity: updatedNode.purity
      }
    });
  } catch (error) {
    console.error('Error regenerating node:', error);
    return NextResponse.json({ 
      error: 'Failed to regenerate node'
    }, { status: 500 });
  }
}
