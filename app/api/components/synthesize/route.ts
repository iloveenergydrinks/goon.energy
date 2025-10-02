import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { COMPONENT_DEFINITIONS } from '@/lib/industrial/componentDrops';

// Quality upgrade thresholds
const QUALITY_TIERS = [
  { min: 0, max: 59, name: 'Poor', nextTier: 70 },
  { min: 60, max: 79, name: 'Common', nextTier: 85 },
  { min: 80, max: 89, name: 'Good', nextTier: 95 },
  { min: 90, max: 99, name: 'Excellent', nextTier: 100 },
  { min: 100, max: 100, name: 'Perfect', nextTier: 101 }, // 101 = Pristine
  { min: 101, max: 101, name: 'Pristine', nextTier: null }
];

function getNextQuality(currentQuality: number): number | null {
  const tier = QUALITY_TIERS.find(t => currentQuality >= t.min && currentQuality <= t.max);
  return tier?.nextTier || null;
}

export async function POST(request: NextRequest) {
  try {
    const { componentIds } = await request.json();
    const playerId = 'demo-player';

    if (!componentIds || componentIds.length !== 3) {
      return NextResponse.json(
        { error: 'Must provide exactly 3 component IDs to synthesize' },
        { status: 400 }
      );
    }

    // Fetch all components
    const components = await prisma.playerComponent.findMany({
      where: {
        id: { in: componentIds },
        playerId
      }
    });

    if (components.length !== 3) {
      return NextResponse.json(
        { error: 'One or more components not found' },
        { status: 404 }
      );
    }

    // Verify all components are the same type
    const componentType = components[0].componentId;
    if (!components.every(c => c.componentId === componentType)) {
      return NextResponse.json(
        { error: 'All components must be of the same type' },
        { status: 400 }
      );
    }

    // Verify all components have the same quality
    const quality = components[0].quality;
    if (!components.every(c => c.quality === quality)) {
      return NextResponse.json(
        { error: 'All components must have the same quality level' },
        { status: 400 }
      );
    }

    // Check if each component has at least 1 quantity
    for (const component of components) {
      if (BigInt(component.quantity) < 1n) {
        return NextResponse.json(
          { error: `Component ${component.id} has insufficient quantity` },
          { status: 400 }
        );
      }
    }

    // Calculate new quality
    const newQuality = getNextQuality(quality);
    if (newQuality === null) {
      return NextResponse.json(
        { error: 'These components are already at maximum quality' },
        { status: 400 }
      );
    }

    // Get component definition for display
    const definition = COMPONENT_DEFINITIONS.find(def => def.id === componentType);

    // Perform synthesis in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Decrement quantity from each source component
      for (const component of components) {
        const updated = await tx.playerComponent.update({
          where: { id: component.id },
          data: {
            quantity: {
              decrement: 1n
            }
          }
        });

        // Delete if quantity reaches 0
        if (BigInt(updated.quantity) <= 0n) {
          await tx.playerComponent.delete({
            where: { id: component.id }
          });
        }
      }

      // Check if we already have this component at the new quality
      const existing = await tx.playerComponent.findUnique({
        where: {
          playerId_componentId_quality: {
            playerId,
            componentId: componentType,
            quality: newQuality
          }
        }
      });

      let synthesized;
      if (existing) {
        // Add to existing stack
        synthesized = await tx.playerComponent.update({
          where: { id: existing.id },
          data: {
            quantity: {
              increment: 1n
            }
          }
        });
      } else {
        // Create new stack
        synthesized = await tx.playerComponent.create({
          data: {
            playerId,
            componentId: componentType,
            quality: newQuality,
            quantity: 1n
          }
        });
      }

      return synthesized;
    });

    // Prepare response
    const qualityName = newQuality === 101 ? 'Pristine' : 
                       QUALITY_TIERS.find(t => newQuality >= t.min && newQuality <= t.max)?.name || 'Unknown';

    return NextResponse.json({
      success: true,
      result: {
        componentId: componentType,
        name: definition?.name || componentType,
        emoji: definition?.emoji || '📦',
        oldQuality: quality,
        newQuality,
        qualityName,
        message: `Successfully synthesized 3x ${definition?.name || componentType} (${quality}%) into 1x ${qualityName} ${definition?.name || componentType} (${newQuality}%)`
      }
    });

  } catch (error) {
    console.error('Error synthesizing components:', error);
    return NextResponse.json(
      { error: 'Failed to synthesize components' },
      { status: 500 }
    );
  }
}
