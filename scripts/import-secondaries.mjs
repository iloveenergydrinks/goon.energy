import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  const jsonPath = path.resolve(process.cwd(), "app/data/secondaries_new.json");
  const raw = fs.readFileSync(jsonPath, "utf8");
  /** @type {Array<any>} */
  const specs = JSON.parse(raw);

  const keepIds = specs.map((x) => x.id);
  await prisma.secondarySystem.deleteMany({ where: { id: { notIn: keepIds } } });

  for (const s of specs) {
    const updateData = {
      name: s.name,
      description: s.description ?? null,
      category: s.category,
      baseStats: s.baseStats ?? {},
      deltaPowerSlots: 0,
      deltaAmmoSlots: 0,
      deltaUtilitySlots: 0,
      powerDraw: s.powerDraw ?? 10,
      tags: s.tags ?? [],
      archetypeFocus: Array.isArray(s.archetypeFocus) ? s.archetypeFocus : [],
      tagAffinities: s.tagAffinities ?? null,
    };
    const createData = {
      id: s.id,
      name: s.name,
      description: s.description ?? null,
      category: s.category,
      baseStats: s.baseStats ?? {},
      deltaPowerSlots: 0,
      deltaAmmoSlots: 0,
      deltaUtilitySlots: 0,
      powerDraw: s.powerDraw ?? 10,
      tags: s.tags ?? [],
      archetypeFocus: Array.isArray(s.archetypeFocus) ? s.archetypeFocus : [],
      tagAffinities: s.tagAffinities ?? null,
    };
    await prisma.secondarySystem.upsert({ where: { id: s.id }, update: updateData, create: createData });
    // eslint-disable-next-line no-console
    console.log(`Upserted secondary ${s.id}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


