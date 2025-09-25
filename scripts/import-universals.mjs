import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const powerList = [
  ["Pulse Modulators", "Power", "M2", "Increases beam/energy weapon fire rate (rofBonus); adds heat per cycle; no effect on kinetic."],
  ["Energy Redistributor", "Power", "SL", "Provides steady weapon power (powerGen) and minor reserve smoothing (capBuffer); small efficiency overhead."],
  ["Surge Protector Array", "Power", "M2", "Adds reserve capacity (capBuffer) and clamps input spikes; lowers blackout risk through smoother delivery."],
  ["Auxiliary Reactor Node", "Power", "S2", "Adds constant reactor output (powerGen); raises baseline heat; small BW tax."],
  ["Flux Capacitors", "Power", "S1", "Stores charge for burst windows (capBuffer); reduces momentary sag under alpha fire."],
  ["Overdrive Converter", "Power", "MT", "Global throughput boost to powered modules (rofBonus, powerGen); generates heavy heat while active."],
  ["High-Throughput Conduits", "Power", "M2", "Raises max deliverable draw to modules (effective powerGen ceiling); minor efficiency loss."],
  ["Stability Regulators", "Power", "S3", "Smooths rail noise; small precision boost to turrets/sensors (trackingBonus)."],
  ["Load Equalizer Grid", "Power", "S2", "Balances draw to prevent overload; consumes extra bandwidth (baseBW)."],
  ["Hotline Node", "Power", "S1", "Direct hardline to primary; faster spool/spin‑up; high local heat."],
  ["Thermal Reclaimers", "Power", "S3", "Converts excess thermal into short power bursts (powerGen); stacking increases runaway risk."],
  ["Emergency Power Bridges", "Power", "SL", "Bypass channels after critical damage; temporary reserve/throughput boost (capBuffer)."],
  ["Oscillation Dampeners", "Power", "S1", "Suppresses micro‑oscillations; improves lock quality slightly (lockStrength)."],
  ["Power Couplers Mk.I–III", "Power", "S1", "Direct reactor‑grid coupling; incremental power (powerGen); slight stability loss."],
  ["Flux Stabilizer Rings", "Power", "SL", "Improves heat‑to‑power ratio (capBuffer, powerGen); rotation‑locked mounting."],
  ["Peak Load Capacitors", "Power", "M2", "Allows brief load spikes (capBuffer burst); slower recharge afterwards."],
  ["Reactor Bypass Conduits", "Power", "SL", "Raises usable power (powerGen) at increased surge risk."],
  ["Isolated Node Lattice", "Power", "M2", "Splits grid into redundancies; limits cascade failure; small reserve (capBuffer)."],
  ["Thermal Relays", "Power", "S2", "Routes heat to external mounts; slower onboard heat growth; minor mobility penalty under saturation."],
  ["Overburn Regulators", "Power", "MT", "Sustains overburn (rofBonus) with controlled heat accrual."],
];

const ammoList = [
  ["Impact Fuze Modulators", "Ammo", "S2", "Tighter fuze window; more reliable detonations (critChance); fewer duds."],
  ["Expanded Ammo Bunker", "Ammo", "M2", "Additional ammunition storage (ammoCap); slower reload (reloadBonus −)."],
  ["Quick-Feed Loader", "Ammo", "S2", "Faster reloads (reloadBonus +); higher heat and jam risk."],
  ["Multi-Caliber Racks", "Ammo", "S3", "Accepts mixed calibers; small efficiency/accuracy penalty (reloadBonus −, trackingBonus −)."],
  ["Sabot Casings", "Ammo", "S2", "Higher muzzle velocity; better penetration (penetration +); slightly lower impact transfer."],
  ["Stabilizer Fins", "Ammo", "S1", "Improved projectile stability at range (trackingBonus +); minor ROF trade."],
  ["Auto-Aim Gyros", "Ammo", "S1", "Barrel/trajectory correction (trackingBonus +, small rofBonus +); adds heat."],
  ["Rotary Feed Adapters", "Ammo", "S3", "Burst feeder (rofBonus ++); longer refill (reloadBonus −−); higher jam risk."],
  ["Overpacked Magazines", "Ammo", "M2", "More rounds per mag (ammoCap +); higher heat and slower reload (reloadBonus −)."],
  ["Smart Fuze Kits", "Ammo", "S1", "Programmable fuzes; fewer duds and better detonation (critChance +)."],
  ["Counterweight Casings", "Ammo", "S2", "Balanced rounds; straighter flight (trackingBonus +); slight −penetration possible."],
  ["Polymer Sabots", "Ammo", "S1", "Lighter sabots; faster shells; reduced penetration (penetration −)."],
  ["Blast Shaping Inserts", "Ammo", "S2", "Shaped explosive; wider splash AoE; less penetration versus armor."],
  ["Variable Mag Wells", "Ammo", "S3", "On‑the‑fly ammo type swap; slower swaps (reloadBonus −)."],
  ["Precision Cartridges", "Ammo", "S1", "Tight tolerances; better consistency (trackingBonus +); minor extra bandwidth (baseBW +)."],
  ["Kinetic Dampener Sleeves", "Ammo", "S1", "Muzzle recoil absorption; tighter grouping (trackingBonus +); raises heat."],
  ["Cluster Loading Frames", "Ammo", "M2", "Pre‑stacked micro‑rounds; high ROF bursts (rofBonus +); long reload (reloadBonus −)."],
  ["Reactive Ammunition Rails", "Ammo", "M2", "Active rail alignment; faster reload (reloadBonus +) and fewer jams."],
  ["Mag Coolant Liners", "Ammo", "S2", "Heat‑isolating liners; sustain fire longer; slight capacity trade if any."],
  ["Multi-Round Couplers", "Ammo", "S3", "Chained shots; bursts fire faster (rofBonus +) but reload longer (reloadBonus −)."],
];

const utilityList = [
  ["Maintenance Bay", "Utility", "M2", "Improves drone turnaround: higher drone repairRate and faster refit between sorties."],
  ["Tracking Enhancer", "Utility", "S2", "Increases turret precision (trackingBonus +); reduces lead error at high transversal."],
  ["Long-Range Optics", "Utility", "S3", "Extends target acquisition range (lockRange +); small trackingBonus from better solutions."],
  ["Arc Control Servo", "Utility", "S1", "Improves turret traverse authority (arcBonus +) and response."],
  ["ECM Suite", "Utility", "M2", "Baseline jammer (ecm +); increases enemy lock times; emissions_pct +."],
  ["Signal Amplifiers", "Utility", "S2", "Boosts outgoing returns (lockStrength +); emissions_pct +."],
  ["Spoof Emitters", "Utility", "S3", "False telemetry against guidance; light ecm; modest mobility tax while active."],
  ["Micro-Thruster Bank", "Utility", "S2", "Adds lateral/trim thrust (mobility +); improves fine positioning."],
  ["Rotation Assist Gyros", "Utility", "S1", "Improves roll/yaw/pitch response (mobility +) and slight arcBonus."],
  ["Vector Dampers", "Utility", "S2", "Suppresses drift; steadier aim during maneuvers (mobility +, trackingBonus +)."],
  ["Drone Command Processor", "Utility", "M2", "Increases droneControl; better multi‑unit coordination and pathing."],
  ["Autonomy Firmware", "Utility", "S1", "Smarter drone AI (droneAI +); faster target switching and return behavior."],
  ["Flux Support Matrix", "Utility", "S1", "Stabilizes rails for support lattices (powerGen +, capBuffer +, repairRate +)."],
  ["Noise Filters", "Utility", "S2", "Reduces emission spikes (emissions_pct −); smoother signature under fire."],
  ["Compartment Sealant", "Utility", "S2", "Slow hull breach sealing (small repair over time); limits spall propagation."],
  ["Mag Dampeners", "Utility", "S1", "Reduces recoil jitter; improves sustained grouping (trackingBonus +)."],
  ["Light Baffles", "Utility", "S2", "Optical baffling (emissions_pct −); small bandwidth/maintenance overhead (baseBW +)."],
  ["Drone Bay Scheduler", "Utility", "S3", "Faster drone launch turnover; reduced downtime between sorties."],
  ["Formation Logic Core", "Utility", "S2", "Tighter drone formations; improves hit quality and survivability."],
  ["Thermal Baffles", "Utility", "S2", "Lowers ambient heat emissions (emissions_pct −); prevents scan spikes under load."],
  ["Wideband Antenna", "Utility", "S2", "Extends comms/relay range; increases emissions footprint (emissions_pct +)."],
  ["Quiet Mounts", "Utility", "S1", "Vibration damping (trackingBonus +); emissions_pct −."],
  ["Spall Liner Insert", "Utility", "S2", "Reduces internal spall damage; small hull resistance gain."],
  ["Armor Weave Kit", "Utility", "M2", "Minor hull resistance and HP bonus."],
  ["Drone Armor Skins", "Utility", "S2", "Adds drone HP/armor; +BW per drone; slight −drone mobility."],
  ["Kinetic Gel Packs", "Utility", "S1", "Impact‑absorbing gel in compartments; lowers crit/internal damage."],
  ["Recoil Compensators", "Utility", "S1", "Stabilizes barrels; improves sustained fire stability (trackingBonus +)."],
  ["Grav Trim Jets", "Utility", "S3", "Balances asymmetric thrust; steadies aim during throttle changes (mobility +)."],
  ["Emitter Chopper", "Utility", "S2", "Clips power‑up spikes (emissions_pct −); slightly delays startup."],
  ["Emergency Patch Mesh", "Utility", "S1", "Temporary hull patch that decays; buys time for repairs."],
];

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

// Helpers to create canonical shapes
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
  // canonical L: [(0,0),(1,0),(1,1)]
  return { id, cells: [{ dr: 0, dc: 0 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }], rotations: [0, 90, 180, 270], sizeClass };
}

function chooseS3Shape(slot, description) {
  const t = (description || "").toLowerCase();
  // Prefer bars for Power; L for Ammo/Utility unless text suggests mast/antenna/optic
  if (slot === "Power") return bar1xN(3, "S", "S3_BAR");
  if (t.includes("mast") || t.includes("antenna") || t.includes("optic")) return bar1xN(3, "S", "S3_BAR");
  return lTriomino("S", "S3_L");
}

function shapeFor(code, slot, description) {
  // Returns { shape }
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
  // branchingFactor: +1 if L-triomino (3 cells and not a straight bar)
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

function deriveStats(slot, name, desc) {
  const s = {};
  const t = `${name} ${desc}`.toLowerCase();
  if (t.includes("reload")) s.reloadBonus = (s.reloadBonus || 0) + 10;
  if (t.includes("ammo") || t.includes("storage")) s.ammoCap = (s.ammoCap || 0) + 40;
  if (t.includes("tracking") || t.includes("stability")) s.trackingBonus = (s.trackingBonus || 0) + 5;
  if (t.includes("arc")) s.arcBonus = (s.arcBonus || 0) + 6;
  if (t.includes("ecm") || t.includes("jam")) s.ecm = (s.ecm || 0) + 10;
  if (t.includes("drone")) s.droneControl = (s.droneControl || 0) + 2;
  if (t.includes("ai")) s.droneAI = (s.droneAI || 0) + 10;
  if (t.includes("repair")) s.repairRate = (s.repairRate || 0) + 10;
  if (t.includes("lock") || t.includes("optic")) s.lockRange = (s.lockRange || 0) + 20;
  if (t.includes("power") || t.includes("reactor") || t.includes("capacitor")) s.powerGen = (s.powerGen || 0) + 8;
  if (t.includes("rof") || t.includes("overclock") || t.includes("throughput") || t.includes("spin-up") || t.includes("burst")) s.rofBonus = (s.rofBonus || 0) + 8;
  if (t.includes("penetration") || t.includes("sabot")) s.penetration = (s.penetration || 0) + 10;
  if (t.includes("crit") || t.includes("dud")) s.critChance = (s.critChance || 0) + 5;
  if (t.includes("thruster") || t.includes("roll") || t.includes("turn") || t.includes("drift") || t.includes("balance")) s.mobility = (s.mobility || 0) + 6;
  return s;
}

async function upsertModules(list) {
  for (const [name, slot, code, description] of list) {
    const id = name;
    // Prefer curated shapes/stats from existing modules.json when available
    const modulesJsonPath = path.resolve(process.cwd(), "app/data/modules.json");
    let prior = null;
    if (fs.existsSync(modulesJsonPath)) {
      const raw = fs.readFileSync(modulesJsonPath, "utf8");
      /** @type {Array<any>} */
      const priorList = JSON.parse(raw);
      prior = priorList.find((m) => m.id === id) || null;
    }

    let shape, baseBW;
    if (prior?.shape) {
      shape = prior.shape;
      baseBW = typeof prior.baseBW === "number" ? prior.baseBW : computeBaseBW(prior.shape, slot, description);
    } else {
      ({ shape } = shapeFor(code, slot, description));
      baseBW = computeBaseBW(shape, slot, description);
    }

    const derived = deriveStats(slot, name, description);
    const stats = prior?.stats ? { ...prior.stats, ...derived } : derived;
    const tags = Array.from(new Set([...(prior?.tags || []), slot.toLowerCase(), `code:${code}`]));
    await prisma.module.upsert({
      where: { id },
      update: { slot, shape, stats, description, baseBW, tags },
      create: { id, slot, shape, stats, description, baseBW, tags },
    });
    // eslint-disable-next-line no-console
    console.log(`Upserted universal ${id}`);
  }
}

async function main() {
  const keepIds = [...powerList, ...ammoList, ...utilityList].map(([name]) => name);
  await prisma.module.deleteMany({ where: { id: { notIn: keepIds } } });
  await upsertModules(powerList);
  await upsertModules(ammoList);
  await upsertModules(utilityList);
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


