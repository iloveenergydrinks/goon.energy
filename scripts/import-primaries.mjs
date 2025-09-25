import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  const jsonPath = path.resolve(process.cwd(), "app/data/primaries_new.json");
  const raw = fs.readFileSync(jsonPath, "utf8");
  /** @type {Array<any>} */
  const specs = JSON.parse(raw);

  const keepIds = specs.map((x) => x.id);
  await prisma.primarySystem.deleteMany({ where: { id: { notIn: keepIds } } });

  for (const p of specs) {
    const minAmmoSlots = p?.baseStats && typeof p.baseStats.ammo_mag === "number" ? 4 : 0;
    const updateData = {
      name: p.name,
      description: p.description ?? null,
      baseStats: p.baseStats ?? {},
      powerDraw: p.powerDraw ?? 30,
      tags: p.tags ?? [],
      archetypeFocus: Array.isArray(p.archetypeFocus) ? p.archetypeFocus : [],
      metadata: p.metadata ?? {},
    };
    const createData = {
      id: p.id,
      name: p.name,
      description: p.description ?? null,
      baseStats: p.baseStats ?? {},
      minPowerSlots: 0,
      minAmmoSlots,
      powerDraw: p.powerDraw ?? 30,
      tags: p.tags ?? [],
      archetypeFocus: Array.isArray(p.archetypeFocus) ? p.archetypeFocus : [],
      metadata: p.metadata ?? {},
    };

    try {
      await prisma.primarySystem.upsert({ where: { id: p.id }, update: updateData, create: createData });
      // eslint-disable-next-line no-console
      console.log(`Upserted primary ${p.id}`);
    } catch (err) {
      const message = (err && err.message) || String(err);
      if (!message.includes("Unknown argument `metadata`")) {
        throw err;
      }
      const updateFallback = {
        ...updateData,
        // @ts-ignore
        metadata: undefined,
        tagAffinities: { metadata: p.metadata ?? {} },
      };
      const createFallback = {
        ...createData,
        // @ts-ignore
        metadata: undefined,
        tagAffinities: { metadata: p.metadata ?? {} },
      };
      await prisma.primarySystem.upsert({ where: { id: p.id }, update: updateFallback, create: createFallback });
      // eslint-disable-next-line no-console
      console.log(`Upserted (fallback) primary ${p.id}`);
    }
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


