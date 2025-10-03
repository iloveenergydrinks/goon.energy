import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const { moduleId } = await request.json();
    
    if (!moduleId) {
      return NextResponse.json({ error: 'Missing moduleId' }, { status: 400 });
    }
    
    await prisma.playerModule.delete({
      where: { id: moduleId }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting module:', error);
    return NextResponse.json({ error: 'Failed to delete module' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const player = await prisma.player.findFirst({
      where: { id: 'demo-player' }
    });
    
    if (!player) {
      return NextResponse.json({ modules: [] });
    }
    
    const playerModules = await prisma.playerModule.findMany({
      where: { playerId: player.id },
      include: {
        module: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json({ modules: playerModules });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ modules: [] });
  }
}
