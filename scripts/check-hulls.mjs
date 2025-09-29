import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const hulls = await prisma.hull.findMany({
    select: {
      id: true,
      name: true,
      sizeId: true,
      archetype: true,
      bandwidthLimit: true,
      powerCapacity: true
    },
    orderBy: [
      { archetype: 'asc' },
      { sizeId: 'asc' },
      { name: 'asc' }
    ]
  });
  
  console.log(`Total hulls in database: ${hulls.length}\n`);
  
  // Group by archetype
  const byArchetype = {};
  for (const hull of hulls) {
    if (!byArchetype[hull.archetype]) {
      byArchetype[hull.archetype] = [];
    }
    byArchetype[hull.archetype].push(hull);
  }
  
  // Display summary
  for (const [archetype, ships] of Object.entries(byArchetype)) {
    console.log(`\n${archetype?.toUpperCase() || 'NO ARCHETYPE'} (${ships.length} ships):`);
    for (const ship of ships) {
      console.log(`  - ${ship.name} (${ship.sizeId}) - Power: ${ship.powerCapacity}, BW: ${ship.bandwidthLimit}`);
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
