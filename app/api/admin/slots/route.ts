import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const slots = await prisma.customSlotType.findMany({
      orderBy: [
        { isSystemSlot: 'asc' },
        { name: 'asc' }
      ]
    });
    
    return NextResponse.json({ slots });
  } catch (error) {
    console.error('Error fetching custom slots:', error);
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
  }
}

