import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { parse as parseCsv } from "csv-parse/sync";

const prisma = new PrismaClient();

// --- Shapes (S1, S2, S3, M2, MT, SL) ---
function bar1xN(n, sizeClass, id) {
  return { id, cells: Array.from({ length: n }, (_, i) => ({ dr: 0, dc: i })), rotations: [0, 90], sizeClass };
}
function block(w, h, sizeClass, id, rotationsLocked = false) {
  const cells = [];
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) cells.push({ dr: r, dc: c });
  }
  return { id, cells, rotations: rotationsLocked ? [0] : [0, 90], sizeClass };
}
function lTriomino(sizeClass, id) {
  return { id, cells: [{ dr: 0, dc: 0 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }], rotations: [0, 90, 180, 270], sizeClass };
}
function chooseS3Shape(slot, description) {
  const t = (description || "").toLowerCase();
  if (slot === "Power") return bar1xN(3, "S", "S3_BAR");
  if (t.includes("mast") || t.includes("antenna") || t.includes("optic")) return bar1xN(3, "S", "S3_BAR");
  return lTriomino("S", "S3_L");
}
function shapeFor(code, slot, description) {
  if (code === "S1") return { shape: { id: "S1_1x1", cells: [{ dr: 0, dc: 0 }], rotations: [0, 90, 180, 270], sizeClass: "S" } };
  if (code === "S2") return { shape: bar1xN(2, "S", "S2_BAR") };
  if (code === "S3") return { shape: chooseS3Shape(slot, description) };
  if (code === "M2") return { shape: block(2, 2, "M", "M2_BLOCK") };
  if (code === "MT") return { shape: block(3, 2, "M", "MT_BLOCK") };
  if (code === "SL") return { shape: block(2, 2, "L", "SL_BLOCK", true) };
  // default
  return { shape: { id: "S1_1x1", cells: [{ dr: 0, dc: 0 }], rotations: [0, 90, 180, 270], sizeClass: "S" } };
}
function computeBaseBW(shape, slot, description) {
  const cellCount = Array.isArray(shape?.cells) ? shape.cells.length : 1;
  const isL = cellCount === 3 && !(shape.cells.every((c) => c.dr === 0) || shape.cells.every((c) => c.dc === 0));
  const branching = isL ? 1 : 0;
  const complexity = cellCount + branching;
  const slotFactor = slot === "Power" ? 3.0 : slot === "Ammo" ? 2.0 : 1.5;
  const t = (description || "").toLowerCase();
  let roleAdj = 0;
  if (t.includes("reactor") || t.includes("conduit") || t.includes("overdrive") || t.includes("bypass")) roleAdj += 0.5;
  if (t.includes("jam") || t.includes("ecm") || t.includes("spoof")) roleAdj += 0.3;
  if (t.includes("drone")) roleAdj += 0.4;
  if (t.includes("optic") || t.includes("sensor") || t.includes("antenna")) roleAdj += 0.2;
  const factor = slotFactor * (1 + roleAdj);
  const bw = Math.max(4, Math.round(complexity * factor));
  return bw;
}

// --- CSV mapping ---
const knownStatKeys = new Set([
  "powerDraw",
  "powerGen",
  "capBuffer",
  "bwLimitPct",
  "bwLimitBonus",
  "rofBonus",
  "reloadBonus",
  "trackingBonus",
  "arcBonus",
  "mobility",
  "speed",
  "sensorStrength",
  "lockRange",
  "lockStrength",
  "ecm",
  "droneCapacity",
  "droneControl",
  "droneAI",
  "droneRepair",
  "ammoCap",
  "repairRate",
  "penetration",
  "critChance"
]);

// Header aliases -> internal key
const headerAlias = new Map([
  ["PowerDraw", "powerDraw"],
  ["PowerGen", "powerGen"],
  ["CapBuffer", "capBuffer"],
  ["AmmoCap", "ammoCap"],
  ["ReloadBonus", "reloadBonus"],
  ["RoF", "rofBonus"],
  ["RofBonus", "rofBonus"],
  ["TrackingBonus", "trackingBonus"],
  ["ArcBonus", "arcBonus"],
  ["Mobility", "mobility"],
  ["Speed", "speed"],
  ["SensorStrength", "sensorStrength"],
  ["LockRange", "lockRange"],
  ["LockStrength", "lockStrength"],
  ["ECM", "ecm"],
  ["DroneCapacity", "droneCapacity"],
  ["DroneControl", "droneControl"],
  ["DroneAI", "droneAI"],
  ["DroneRepair", "droneRepair"],
  ["RepairRate", "repairRate"],
  ["BwLimitPct", "bwLimitPct"],
  ["BwLimitBonus", "bwLimitBonus"],
  ["CritChance", "critChance"],
  ["Penetration", "penetration"],
]);

function coerceNumber(v) {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "number") return isFinite(v) ? v : undefined;
  const s = String(v).trim();
  if (s === "") return undefined;
  const n = Number(s);
  return isFinite(n) ? n : undefined;
}

function getArg(flag, def) {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return def;
}

async function main() {
  const csvPath = path.resolve(process.cwd(), getArg("--file", "app/data/universals.csv"));
  const keepUnknown = getArg("--keep-unknown", "false") === "true"; // if true, do not delete modules not present

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(csvPath, "utf8");
  const records = parseCsv(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  });

  /** @type {string[]} */
  const keepIds = [];

  for (const rec of records) {
    const name = (rec["Name"] || "").toString().trim();
    if (!name) continue;
    const id = name;
    keepIds.push(id);

    const slot = (rec["Slot"] || "Utility").toString().trim();
    const code = (rec["Type"] || "S1").toString().trim();
    const category = (rec["Category"] || "").toString().trim();
    const desc = (rec["Description"] || "").toString();
    const notes = (rec["Notes"] || "").toString();
    const description = notes ? `${desc} ${notes}`.trim() : desc.trim();

    const { shape } = shapeFor(code, slot, description);
    const bwCsv = coerceNumber(rec["BW"]);
    const baseBW = typeof bwCsv === "number" ? bwCsv : computeBaseBW(shape, slot, description);

    // Collect stats from known columns
    const stats = {};
    for (const [rawKey, rawVal] of Object.entries(rec)) {
      if (rawKey === "" || rawVal === undefined || rawVal === null) continue;
      if (["Category", "Description", "Name", "Slot", "Type", "BW", "Notes"].includes(rawKey)) continue;
      const alias = headerAlias.get(rawKey) || rawKey;
      if (!knownStatKeys.has(alias)) continue;
      const n = coerceNumber(rawVal);
      if (n !== undefined && n !== 0) stats[alias] = n;
    }

    // Build tags; include category and type
    const tags = [];
    if (category) tags.push(category.toLowerCase());
    tags.push("universal", slot.toLowerCase(), `code:${code}`);

    await prisma.module.upsert({
      where: { id },
      update: { slot, shape, stats, description, baseBW, tags },
      create: { id, slot, shape, stats, description, baseBW, tags },
    });
    console.log(`Upserted universal ${id}`);
  }

  if (!keepUnknown) {
    await prisma.module.deleteMany({ where: { id: { notIn: keepIds } } });
    console.log(`Deleted modules not listed in CSV (${keepIds.length} kept).`);
  } else {
    console.log(`Skipped deletion of unknown modules (keep-unknown=true).`);
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


