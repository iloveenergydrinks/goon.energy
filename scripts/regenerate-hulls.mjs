import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Archetype slot weight distributions
const ARCH_WEIGHTS = {
  support: { P: 0.25, A: 0.10, U: 0.65 },      // Revised for more utility
  defender: { P: 0.35, A: 0.15, U: 0.50 },
  assault: { P: 0.60, A: 0.25, U: 0.15 },
  artillery: { P: 0.40, A: 0.45, U: 0.15 },
  recon: { P: 0.25, A: 0.20, U: 0.55 },
  infiltrator: { P: 0.25, A: 0.35, U: 0.40 },
  carrier: { P: 0.35, A: 0.20, U: 0.45 },
  bulwark: { P: 0.40, A: 0.10, U: 0.50 },      // Revised to differentiate from support
};

// Grid dimensions per size
const SIZE_DIMS = {
  Frigate: { rows: 3, cols: 3 },
  Destroyer: { rows: 4, cols: 4 },
  Cruiser: { rows: 4, cols: 5 },
  Capital: { rows: 5, cols: 5 },
};

// Hull definitions - 2 variants per archetype per size
const HULL_SPECS = [
  // SUPPORT
  { id: "swift_medic_frigate", name: "Swift Medic", sizeId: "Frigate", archetype: "support", 
    baseStats: { hull: 650, armor: 150, speed: 130, evasion: 35 }, bandwidth: 60 },
  { id: "field_station_frigate", name: "Field Station", sizeId: "Frigate", archetype: "support",
    baseStats: { hull: 850, armor: 250, speed: 85, evasion: 20 }, bandwidth: 65 },
  { id: "combat_medic_destroyer", name: "Combat Medic", sizeId: "Destroyer", archetype: "support",
    baseStats: { hull: 1100, armor: 350, speed: 95, evasion: 18 }, bandwidth: 85 },
  { id: "sanctuary_destroyer", name: "Sanctuary", sizeId: "Destroyer", archetype: "support",
    baseStats: { hull: 1400, armor: 450, speed: 65, evasion: 10 }, bandwidth: 90 },
  { id: "angel_wing_cruiser", name: "Angel Wing", sizeId: "Cruiser", archetype: "support",
    baseStats: { hull: 1500, armor: 400, speed: 80, evasion: 15 }, bandwidth: 110 },
  { id: "haven_cruiser", name: "Haven", sizeId: "Cruiser", archetype: "support",
    baseStats: { hull: 1900, armor: 550, speed: 55, evasion: 8 }, bandwidth: 115 },

  // DEFENDER
  { id: "sentinel_frigate", name: "Sentinel", sizeId: "Frigate", archetype: "defender",
    baseStats: { hull: 900, armor: 300, speed: 90, evasion: 18 }, bandwidth: 65 },
  { id: "ironclad_frigate", name: "Ironclad", sizeId: "Frigate", archetype: "defender",
    baseStats: { hull: 1000, armor: 400, speed: 70, evasion: 10 }, bandwidth: 70 },
  { id: "guardian_destroyer", name: "Guardian", sizeId: "Destroyer", archetype: "defender",
    baseStats: { hull: 1500, armor: 500, speed: 75, evasion: 12 }, bandwidth: 90 },
  { id: "fortress_destroyer", name: "Fortress", sizeId: "Destroyer", archetype: "defender",
    baseStats: { hull: 1700, armor: 600, speed: 60, evasion: 8 }, bandwidth: 95 },
  { id: "aegis_cruiser", name: "Aegis", sizeId: "Cruiser", archetype: "defender",
    baseStats: { hull: 2000, armor: 650, speed: 65, evasion: 10 }, bandwidth: 115 },
  { id: "citadel_cruiser", name: "Citadel", sizeId: "Cruiser", archetype: "defender",
    baseStats: { hull: 2300, armor: 800, speed: 50, evasion: 5 }, bandwidth: 120 },

  // ASSAULT
  { id: "striker_frigate", name: "Striker", sizeId: "Frigate", archetype: "assault",
    baseStats: { hull: 700, armor: 150, speed: 125, evasion: 30 }, bandwidth: 65 },
  { id: "brawler_frigate", name: "Brawler", sizeId: "Frigate", archetype: "assault",
    baseStats: { hull: 850, armor: 200, speed: 105, evasion: 22 }, bandwidth: 70 },
  { id: "ravager_destroyer", name: "Ravager", sizeId: "Destroyer", archetype: "assault",
    baseStats: { hull: 1100, armor: 300, speed: 95, evasion: 18 }, bandwidth: 90 },
  { id: "marauder_destroyer", name: "Marauder", sizeId: "Destroyer", archetype: "assault",
    baseStats: { hull: 1300, armor: 350, speed: 85, evasion: 15 }, bandwidth: 95 },
  { id: "devastator_cruiser", name: "Devastator", sizeId: "Cruiser", archetype: "assault",
    baseStats: { hull: 1400, armor: 400, speed: 75, evasion: 12 }, bandwidth: 115 },
  { id: "berserker_cruiser", name: "Berserker", sizeId: "Cruiser", archetype: "assault",
    baseStats: { hull: 1600, armor: 450, speed: 70, evasion: 10 }, bandwidth: 120 },

  // ARTILLERY
  { id: "longbow_frigate", name: "Longbow", sizeId: "Frigate", archetype: "artillery",
    baseStats: { hull: 750, armor: 180, speed: 100, evasion: 20 }, bandwidth: 65 },
  { id: "trebuchet_frigate", name: "Trebuchet", sizeId: "Frigate", archetype: "artillery",
    baseStats: { hull: 800, armor: 220, speed: 85, evasion: 15 }, bandwidth: 70 },
  { id: "ballista_destroyer", name: "Ballista", sizeId: "Destroyer", archetype: "artillery",
    baseStats: { hull: 1200, armor: 350, speed: 70, evasion: 10 }, bandwidth: 90 },
  { id: "howitzer_destroyer", name: "Howitzer", sizeId: "Destroyer", archetype: "artillery",
    baseStats: { hull: 1350, armor: 400, speed: 60, evasion: 8 }, bandwidth: 95 },
  { id: "raildriver_cruiser", name: "Raildriver", sizeId: "Cruiser", archetype: "artillery",
    baseStats: { hull: 1500, armor: 450, speed: 60, evasion: 8 }, bandwidth: 115 },
  { id: "siege_engine_cruiser", name: "Siege Engine", sizeId: "Cruiser", archetype: "artillery",
    baseStats: { hull: 1650, armor: 500, speed: 50, evasion: 5 }, bandwidth: 120 },

  // RECON
  { id: "scout_frigate", name: "Scout", sizeId: "Frigate", archetype: "recon",
    baseStats: { hull: 600, armor: 120, speed: 140, evasion: 35 }, bandwidth: 60 },
  { id: "watcher_frigate", name: "Watcher", sizeId: "Frigate", archetype: "recon",
    baseStats: { hull: 750, armor: 180, speed: 110, evasion: 25 }, bandwidth: 65 },
  { id: "pathfinder_destroyer", name: "Pathfinder", sizeId: "Destroyer", archetype: "recon",
    baseStats: { hull: 1000, armor: 280, speed: 105, evasion: 20 }, bandwidth: 85 },
  { id: "sentinel_destroyer", name: "Sentinel", sizeId: "Destroyer", archetype: "recon",
    baseStats: { hull: 1200, armor: 350, speed: 85, evasion: 15 }, bandwidth: 90 },
  { id: "oracle_cruiser", name: "Oracle", sizeId: "Cruiser", archetype: "recon",
    baseStats: { hull: 1400, armor: 380, speed: 85, evasion: 14 }, bandwidth: 110 },
  { id: "overseer_cruiser", name: "Overseer", sizeId: "Cruiser", archetype: "recon",
    baseStats: { hull: 1600, armor: 450, speed: 70, evasion: 10 }, bandwidth: 115 },

  // INFILTRATOR
  { id: "ghost_frigate", name: "Ghost", sizeId: "Frigate", archetype: "infiltrator",
    baseStats: { hull: 600, armor: 100, speed: 135, evasion: 40 }, bandwidth: 65 },
  { id: "phantom_frigate", name: "Phantom", sizeId: "Frigate", archetype: "infiltrator",
    baseStats: { hull: 750, armor: 150, speed: 115, evasion: 30 }, bandwidth: 70 },
  { id: "specter_destroyer", name: "Specter", sizeId: "Destroyer", archetype: "infiltrator",
    baseStats: { hull: 950, armor: 250, speed: 100, evasion: 25 }, bandwidth: 90 },
  { id: "wraith_destroyer", name: "Wraith", sizeId: "Destroyer", archetype: "infiltrator",
    baseStats: { hull: 1150, armor: 300, speed: 90, evasion: 20 }, bandwidth: 95 },
  { id: "shadow_cruiser", name: "Shadow", sizeId: "Cruiser", archetype: "infiltrator",
    baseStats: { hull: 1350, armor: 350, speed: 80, evasion: 18 }, bandwidth: 115 },
  { id: "nightfall_cruiser", name: "Nightfall", sizeId: "Cruiser", archetype: "infiltrator",
    baseStats: { hull: 1550, armor: 400, speed: 70, evasion: 15 }, bandwidth: 120 },

  // CARRIER
  { id: "hive_frigate", name: "Hive", sizeId: "Frigate", archetype: "carrier",
    baseStats: { hull: 700, armor: 160, speed: 110, evasion: 22 }, bandwidth: 65 },
  { id: "nest_frigate", name: "Nest", sizeId: "Frigate", archetype: "carrier",
    baseStats: { hull: 850, armor: 200, speed: 90, evasion: 18 }, bandwidth: 70 },
  { id: "swarm_lord_destroyer", name: "Swarm Lord", sizeId: "Destroyer", archetype: "carrier",
    baseStats: { hull: 1150, armor: 320, speed: 85, evasion: 15 }, bandwidth: 90 },
  { id: "colony_destroyer", name: "Colony", sizeId: "Destroyer", archetype: "carrier",
    baseStats: { hull: 1350, armor: 380, speed: 70, evasion: 12 }, bandwidth: 95 },
  { id: "mothership_cruiser", name: "Mothership", sizeId: "Cruiser", archetype: "carrier",
    baseStats: { hull: 1550, armor: 420, speed: 75, evasion: 12 }, bandwidth: 115 },
  { id: "ark_cruiser", name: "Ark", sizeId: "Cruiser", archetype: "carrier",
    baseStats: { hull: 1750, armor: 480, speed: 60, evasion: 8 }, bandwidth: 120 },

  // BULWARK
  { id: "bastion_frigate", name: "Bastion", sizeId: "Frigate", archetype: "bulwark",
    baseStats: { hull: 850, armor: 280, speed: 85, evasion: 15 }, bandwidth: 70 },
  { id: "rampart_frigate", name: "Rampart", sizeId: "Frigate", archetype: "bulwark",
    baseStats: { hull: 950, armor: 350, speed: 70, evasion: 10 }, bandwidth: 75 },
  { id: "stronghold_destroyer", name: "Stronghold", sizeId: "Destroyer", archetype: "bulwark",
    baseStats: { hull: 1450, armor: 480, speed: 70, evasion: 10 }, bandwidth: 95 },
  { id: "citadel_destroyer", name: "Citadel", sizeId: "Destroyer", archetype: "bulwark",
    baseStats: { hull: 1650, armor: 550, speed: 55, evasion: 6 }, bandwidth: 100 },
  { id: "fortress_cruiser", name: "Fortress", sizeId: "Cruiser", archetype: "bulwark",
    baseStats: { hull: 1950, armor: 650, speed: 60, evasion: 8 }, bandwidth: 120 },
  { id: "redoubt_cruiser", name: "Redoubt", sizeId: "Cruiser", archetype: "bulwark",
    baseStats: { hull: 2200, armor: 750, speed: 45, evasion: 4 }, bandwidth: 125 },
];

// Calculate slot counts using largest remainder method
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
    { key: "U", frac: (T * w.U) - Math.floor(T * w.U) },
  ].sort((a, b) => b.frac - a.frac);
  
  const assigned = CP + CA + CU;
  let remaining = T - assigned;
  let idx = 0;
  while (remaining > 0 && idx < remainders.length) {
    const k = remainders[idx].key;
    if (k === "P") CP += 1; 
    else if (k === "A") CA += 1; 
    else CU += 1;
    remaining -= 1;
    idx += 1;
  }
  
  // Ensure minimum 1 of each type for grids >= 5 cells
  if (T >= 5) {
    if (CP === 0) { CP += 1; if (CA >= CU) CA -= 1; else CU -= 1; }
    if (CA === 0) { CA += 1; if (CP >= CU) CP -= 1; else CU -= 1; }
    if (CU === 0) { CU += 1; if (CP >= CA) CP -= 1; else CA -= 1; }
  }
  
  // Special case: Artillery needs minimum ammo
  if (archetype === "artillery") {
    if (CA < 4 && T >= 12) {
      const need = 4 - CA;
      for (let i = 0; i < need; i++) { 
        if (CU > 1) { CA += 1; CU -= 1; }
      }
    }
  }
  
  return { CP, CA, CU };
}

// Generate coordinate list
function coordList(rows, cols) {
  const out = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out.push({ r, c });
    }
  }
  return out;
}

// Scoring functions for slot placement
function centerScore(r, c, rows, cols) {
  const dr = Math.abs(r - (rows - 1) / 2);
  const dc = Math.abs(c - (cols - 1) / 2);
  return -(dr + dc);
}

function perimeterScore(r, c, rows, cols) {
  const edgeDist = Math.min(r, c, rows - 1 - r, cols - 1 - c);
  return -edgeDist;
}

function crossScore(r, c, rows, cols) {
  const centerR = (rows - 1) / 2;
  const centerC = (cols - 1) / 2;
  const onVertical = Math.abs(c - centerC) < 0.5;
  const onHorizontal = Math.abs(r - centerR) < 0.5;
  return (onVertical || onHorizontal) ? 1 : 0;
}

function frontScore(r) {
  return -r;
}

function backScore(r, rows) {
  return -(rows - 1 - r);
}

function columnBandScore(c, cols) {
  const center = (cols - 1) / 2;
  const d = Math.abs(c - center);
  return -d;
}

// Build slot layout for archetype
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
  
  const pickTop = (list, scorer, count) => 
    list.slice().sort((a, b) => scorer(b) - scorer(a)).slice(0, count);
  
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

// Compute power capacity based on slot distribution
function computePowerCapacity(rows, cols, CP, CA, CU) {
  const T = rows * cols;
  const base = 40 + T * 2;
  const powerBonus = CP * 1.5;
  return Math.round(base + powerBonus);
}

async function main() {
  console.log("🚀 Starting hull regeneration...");
  
  // Clear existing hulls
  await prisma.hull.deleteMany();
  console.log("✅ Cleared existing hulls");
  
  let created = 0;
  
  for (const spec of HULL_SPECS) {
    const dims = SIZE_DIMS[spec.sizeId];
    const weights = ARCH_WEIGHTS[spec.archetype];
    
    // Calculate slot counts
    const T = dims.rows * dims.cols;
    const { CP, CA, CU } = largestRemainderCounts(T, weights, spec.archetype);
    
    // Generate slot layout
    const slots = buildSlotsForArchetype(spec.archetype, dims.rows, dims.cols, CP, CA, CU);
    
    // Calculate power capacity
    const powerCapacity = computePowerCapacity(dims.rows, dims.cols, CP, CA, CU);
    
    // Prepare hull data
    const hullData = {
      id: spec.id,
      name: spec.name,
      description: `${spec.archetype.charAt(0).toUpperCase() + spec.archetype.slice(1)}-class ${spec.sizeId.toLowerCase()}`,
      sizeId: spec.sizeId,
      archetype: spec.archetype,
      powerCapacity: powerCapacity,
      bandwidthLimit: spec.bandwidth,
      baseStats: spec.baseStats,
      grid: {
        rows: dims.rows,
        cols: dims.cols,
        slots: slots
      },
      compatibleTags: [spec.archetype],
      incompatibleTags: [],
      preferredWeapons: []
    };
    
    // Create hull
    await prisma.hull.create({ data: hullData });
    
    const slotSummary = `P:${CP} A:${CA} U:${CU}`;
    console.log(`✅ Created ${spec.name} (${spec.sizeId}/${spec.archetype}) - ${slotSummary}`);
    created++;
  }
  
  console.log(`\n🎉 Successfully regenerated ${created} hulls!`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
