import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const materials = await prisma.material.findMany({
      select: {
        name: true,
        baseAttributes: true
      }
    });
    
    const stats: Record<string, any> = {};
    materials.forEach(mat => {
      const attrs = mat.baseAttributes as any;
      if (attrs && mat.name) {
        stats[mat.name] = {
          strength: attrs.strength || 100,
          conductivity: attrs.conductivity || 100,
          density: attrs.density || 100,
          reactivity: attrs.reactivity || 100,
          stability: attrs.stability || 100,
          elasticity: attrs.elasticity || 100
        };
      }
    });
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching material stats:', error);
    return NextResponse.json({}, { status: 500 });
  }
}

