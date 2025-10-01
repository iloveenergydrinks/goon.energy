import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
