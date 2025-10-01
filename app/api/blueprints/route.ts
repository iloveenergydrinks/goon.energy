import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const player = await prisma.player.findFirst({
      where: { id: 'demo-player' }
    });
    
    if (!player) {
      return NextResponse.json({ blueprints: [] });
    }
    
    const playerBlueprints = await prisma.playerBlueprint.findMany({
      where: { playerId: player.id },
      include: {
        blueprint: {
          include: {
            module: true
          }
        }
      }
    });
    
    const blueprints = playerBlueprints.map(pb => ({
      ...pb.blueprint,
      timesUsed: pb.timesUsed,
      unlocked: pb.unlocked
    }));
    
    return NextResponse.json({ 
      blueprints,
      mastery: player.manufacturingMastery 
    });
  } catch (error) {
    console.error('Error fetching blueprints:', error);
    return NextResponse.json({ blueprints: [], mastery: 0 });
  }
}
