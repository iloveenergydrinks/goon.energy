import { prisma } from "@/lib/prisma";
import hulls from "@/app/data/hulls.json";
import primaries from "@/app/data/primaries.json";
import secondaries from "@/app/data/secondaries.json";
import modules from "@/app/data/modules.json";

async function main() {
  await prisma.module.deleteMany();
  await prisma.secondarySystem.deleteMany();
  await prisma.primarySystem.deleteMany();
  await prisma.hull.deleteMany();

  await prisma.hull.createMany({ data: hulls as any[] });
  await prisma.primarySystem.createMany({ data: primaries as any[] });
  await prisma.secondarySystem.createMany({ data: secondaries as any[] });
  await prisma.module.createMany({ data: modules as any[] });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
