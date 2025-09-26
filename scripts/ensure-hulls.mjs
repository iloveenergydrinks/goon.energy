import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ARCH_WEIGHTS = {
  assault: { P: 0.6, A: 0.25, U: 0.15 },
  artillery: { P: 0.4, A: 0.45, U: 0.15 },
  defender: { P: 0.35, A: 0.15, U: 0.5 },
  bulwark: { P: 0.3, A: 0.15, U: 0.55 },
  support: { P: 0.3, A: 0.15, U: 0.55 },
  recon: { P: 0.25, A: 0.2, U: 0.55 },
  infiltrator: { P: 0.25, A: 0.35, U: 0.4 },
  carrier: { P: 0.35, A: 0.2, U: 0.45 },
};

const SIZE_DIMS = {
  Frigate: { rows: 3, cols: 3 },
  Destroyer: { rows: 4, cols: 4 },
  Cruiser: { rows: 4, cols: 5 },
  Capital: { rows: 5, cols: 5 },
};

function largestRemainderCounts(T, weights, archetype) {
  const w = weights;
  const exactP = T * w.P;
  const exactA = T * w.A;
  let CP = Math.floor(exactP);
  let CA = Math.floor(exactA);
  let CU = T - CP - CA;
  const remainders = [
    { key: "P", frac: exactP - Math.floor(exactP) },
    { key: "A", frac: exactA - Math.floor(exactA) },
    { key: "U", frac: T * w.U - Math.floor(T * w.U) },
  ].sort((a, b) => b.frac - a.frac);
  const assigned = CP + CA + CU;
  let remaining = T - assigned;
  let idx = 0;
  while (remaining > 0 && idx < remainders.length) {
    const k = remainders[idx].key;
    if (k === "P") CP += 1; else if (k === "A") CA += 1; else CU += 1;
    remaining -= 1;
    idx += 1;
  }
  if (T >= 5) {
    if (CP === 0) { CP += 1; if (CA >= CU) CA -= 1; else CU -= 1; }
    if (CA === 0) { CA += 1; if (CP >= CU) CP -= 1; else CU -= 1; }
    if (CU === 0) { CU += 1; if (CP >= CA) CP -= 1; else CA -= 1; }
  }
  if (archetype === "artillery") {
    if (CA < 4 && T >= 12) {
      const need = 4 - CA;
      for (let i = 0; i < need; i++) { if (CU > 1) { CA += 1; CU -= 1; } }
    }
  }
  return { CP, CA, CU };
}

function coordList(rows, cols) {
  const out = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) out.push({ r, c });
  }
  return out;
}

function centerScore(r, c, rows, cols) {
  const cr = (rows - 1) / 2;
  const cc = (cols - 1) / 2;
  const dr = Math.abs(r - cr);
  const dc = Math.abs(c - cc);
  return -Math.sqrt(dr * dr + dc * dc);
}
function perimeterScore(r, c, rows, cols) {
  const dTop = r;
  const dLeft = c;
  const dBottom = rows - 1 - r;
  const dRight = cols - 1 - c;
  const d = Math.min(dTop, dLeft, dBottom, dRight);
  return -d;
}
function crossScore(r, c, rows, cols) {
  const cr = (rows - 1) / 2;
  const cc = (cols - 1) / 2;
  return -Math.min(Math.abs(r - cr), Math.abs(c - cc));
}
function frontScore(r) { return -r; }
function backScore(r, rows) { return -(rows - 1 - r); }
function columnBandScore(c, cols) {
  const t1 = cols / 3;
  const t2 = (2 * cols) / 3;
  const d = Math.min(Math.abs(c - t1), Math.abs(c - t2));
  return -d;
}

function buildSlotsForArchetype(archetype, rows, cols, CP, CA, CU) {
  const all = coordList(rows, cols);
  function scoreP(rc) {
    switch (archetype) {
      case "assault": return centerScore(rc.r, rc.c, rows, cols) + crossScore(rc.r, rc.c, rows, cols) * 0.25;
      case "artillery": return centerScore(rc.r, rc.c, rows, cols) + (-(Math.abs(rc.r - (rows - 1) / 2))) * 0.15;
      case "defender": return centerScore(rc.r, rc.c, rows, cols) + crossScore(rc.r, rc.c, rows, cols) * 0.2;
      case "bulwark": return crossScore(rc.r, rc.c, rows, cols) + centerScore(rc.r, rc.c, rows, cols) * 0.2;
      case "support": return centerScore(rc.r, rc.c, rows, cols);
      case "recon": return columnBandScore(rc.c, cols) * 0.8 + centerScore(rc.r, rc.c, rows, cols) * 0.2;
      case "infiltrator": return centerScore(rc.r, rc.c, rows, cols) * 0.2 + perimeterScore(rc.r, rc.c, rows, cols) * 0.3;
      case "carrier": return columnBandScore(rc.c, cols) + centerScore(rc.r, rc.c, rows, cols) * 0.3;
      default: return centerScore(rc.r, rc.c, rows, cols);
    }
  }
  function scoreA(rc) {
    switch (archetype) {
      case "assault": return frontScore(rc.r) + perimeterScore(rc.r, rc.c, rows, cols) * 0.2;
      case "artillery": return perimeterScore(rc.r, rc.c, rows, cols) + backScore(rc.r, rows) * 0.3;
      case "defender": return perimeterScore(rc.r, rc.c, rows, cols) * 0.3 + frontScore(rc.r) * 0.1;
      case "bulwark": return perimeterScore(rc.r, rc.c, rows, cols) * 0.3 + backScore(rc.r, rows) * 0.2;
      case "support": return perimeterScore(rc.r, rc.c, rows, cols) * 0.2;
      case "recon": return perimeterScore(rc.r, rc.c, rows, cols) * 0.25 + frontScore(rc.r) * 0.1;
      case "infiltrator": return perimeterScore(rc.r, rc.c, rows, cols) * 0.35;
      case "carrier": return frontScore(rc.r) * 0.2 + perimeterScore(rc.r, rc.c, rows, cols) * 0.2;
      default: return perimeterScore(rc.r, rc.c, rows, cols) * 0.2;
    }
  }
  function scoreU(rc) {
    switch (archetype) {
      case "assault": return perimeterScore(rc.r, rc.c, rows, cols);
      case "artillery": return backScore(rc.r, rows) + perimeterScore(rc.r, rc.c, rows, cols) * 0.2;
      case "defender": return perimeterScore(rc.r, rc.c, rows, cols) * 1.2;
      case "bulwark": return perimeterScore(rc.r, rc.c, rows, cols) * 1.3;
      case "support": return perimeterScore(rc.r, rc.c, rows, cols) * 0.8 + centerScore(rc.r, rc.c, rows, cols) * 0.2;
      case "recon": return columnBandScore(rc.c, cols) * 0.6 + perimeterScore(rc.r, rc.c, rows, cols) * 0.4;
      case "infiltrator": return perimeterScore(rc.r, rc.c, rows, cols) * 0.9;
      case "carrier": return perimeterScore(rc.r, rc.c, rows, cols) * 1.1;
      default: return perimeterScore(rc.r, rc.c, rows, cols);
    }
  }
  const pickTop = (list, scorer, count) => list.slice().sort((a, b) => scorer(b) - scorer(a)).slice(0, count);
  const Pcells = new Set(pickTop(all, scoreP, CP).map((x) => `${x.r},${x.c}`));
  const rem1 = all.filter((rc) => !Pcells.has(`${rc.r},${rc.c}`));
  const Acells = new Set(pickTop(rem1, scoreA, CA).map((x) => `${x.r},${x.c}`));
  const rem2 = rem1.filter((rc) => !Acells.has(`${rc.r},${rc.c}`));
  const Ucells = new Set(pickTop(rem2, scoreU, CU).map((x) => `${x.r},${x.c}`));
  const slots = [];
  for (const { r, c } of all) {
    const key = `${r},${c}`;
    let type = "Utility";
    if (Pcells.has(key)) type = "Power";
    else if (Acells.has(key)) type = "Ammo";
    else type = "Utility";
    slots.push({ r, c, type });
  }
  return slots;
}

function computeBudgets(rows, cols, CP, CA, CU) {
  const T = rows * cols;
  const PC = Math.round(3 * T + 4 * CP);
  const BW = Math.round(1 * T + 1.5 * CP + 1.2 * CA + 1.0 * CU);
  return { powerCapacity: PC, bandwidthLimit: BW };
}

function plannedHulls() {
  return [
    { id: "assault_frigate", name: "Assault Frigate", sizeId: "Frigate", archetype: "assault" },
    { id: "assault_cruiser", name: "Assault Cruiser", sizeId: "Cruiser", archetype: "assault" },
    { id: "artillery_destroyer", name: "Artillery Destroyer", sizeId: "Destroyer", archetype: "artillery" },
    { id: "artillery_capital", name: "Artillery Dreadnought", sizeId: "Capital", archetype: "artillery" },
    { id: "defender_frigate", name: "Defender Frigate", sizeId: "Frigate", archetype: "defender" },
    { id: "defender_cruiser", name: "Defender Cruiser", sizeId: "Cruiser", archetype: "defender" },
    { id: "bulwark_cruiser", name: "Bulwark Cruiser", sizeId: "Cruiser", archetype: "bulwark" },
    { id: "bulwark_capital", name: "Bulwark Bastion", sizeId: "Capital", archetype: "bulwark" },
    { id: "support_frigate", name: "Support Frigate", sizeId: "Frigate", archetype: "support" },
    { id: "support_cruiser", name: "Support Cruiser", sizeId: "Cruiser", archetype: "support" },
    { id: "recon_frigate", name: "Recon Frigate", sizeId: "Frigate", archetype: "recon" },
    { id: "recon_destroyer", name: "Recon Destroyer", sizeId: "Destroyer", archetype: "recon" },
    { id: "infiltrator_frigate", name: "Infiltrator Corvette", sizeId: "Frigate", archetype: "infiltrator" },
    { id: "infiltrator_destroyer", name: "Infiltrator Destroyer", sizeId: "Destroyer", archetype: "infiltrator" },
    { id: "carrier_cruiser", name: "Light Carrier", sizeId: "Cruiser", archetype: "carrier" },
    { id: "carrier_capital", name: "Fleet Carrier", sizeId: "Capital", archetype: "carrier" },
  ];
}

async function main() {
  const specs = plannedHulls();
  const keepIds = specs.map((s) => s.id);
  await prisma.hull.deleteMany({ where: { id: { notIn: keepIds } } });

  for (const spec of specs) {
    const dims = SIZE_DIMS[spec.sizeId] || SIZE_DIMS.Frigate;
    let weights = ARCH_WEIGHTS[spec.archetype] || ARCH_WEIGHTS.assault;
    if (spec.sizeId === "Cruiser" || spec.sizeId === "Capital") {
      if (["defender", "bulwark", "support"].includes(spec.archetype)) {
        weights = { P: weights.P, A: Math.max(0, weights.A - 0.05), U: Math.min(1, weights.U + 0.05) };
      }
      if (spec.archetype === "artillery") {
        weights = { P: weights.P, A: Math.min(1, weights.A + 0.05), U: Math.max(0, weights.U - 0.05) };
      }
      const total = weights.P + weights.A + weights.U;
      weights = { P: weights.P / total, A: weights.A / total, U: weights.U / total };
    }

    const T = dims.rows * dims.cols;
    const { CP, CA, CU } = largestRemainderCounts(T, weights, spec.archetype);
    const slots = buildSlotsForArchetype(spec.archetype, dims.rows, dims.cols, CP, CA, CU);
    const { powerCapacity, bandwidthLimit } = computeBudgets(dims.rows, dims.cols, CP, CA, CU);

    const data = {
      id: spec.id,
      name: spec.name,
      description: null,
      sizeId: spec.sizeId,
      archetype: spec.archetype,
      powerCapacity,
      bandwidthLimit,
      grid: { rows: dims.rows, cols: dims.cols, slots },
      compatibleTags: [spec.archetype],
    };
    await prisma.hull.upsert({ where: { id: spec.id }, update: data, create: data });
    // eslint-disable-next-line no-console
    console.log(`Upserted hull ${spec.id} (${spec.sizeId}/${spec.archetype})`);
  }
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });


