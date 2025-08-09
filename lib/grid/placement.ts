import type { GridCell, SlotType } from "@/types/fitting";
import type { RNG } from "@/lib/rng";
import { seededShuffle } from "@/lib/rng";

function centerOf(rows: number, cols: number): { r: number; c: number } {
  return { r: (rows - 1) / 2, c: (cols - 1) / 2 };
}

function euclidean(a: { r: number; c: number }, b: { r: number; c: number }): number {
  const dr = a.r - b.r;
  const dc = a.c - b.c;
  return Math.sqrt(dr * dr + dc * dc);
}

function manhattanToEdge(r: number, c: number, rows: number, cols: number): number {
  const toTop = r;
  const toLeft = c;
  const toBottom = rows - 1 - r;
  const toRight = cols - 1 - c;
  return Math.min(toTop, toLeft, toBottom, toRight);
}

export function placeType(
  cells: GridCell[],
  rows: number,
  cols: number,
  type: SlotType,
  count: number,
  rngSeed: string,
  ammoBias?: number
): void {
  if (count <= 0) return;
  const center = centerOf(rows, cols);
  const candidates: Array<{ idx: number; r: number; c: number; score: number }> = [];
  for (let i = 0; i < cells.length; i += 1) {
    const cell = cells[i];
    if (cell.hole || cell.slot) continue;
    const r = Math.floor(i / cols);
    const c = i % cols;
    let score = 0;
    if (type === "Power") {
      score = euclidean({ r, c }, center);
    } else if (type === "Ammo") {
      const leftWall = 0;
      const rightWall = cols - 1;
      const bias = ammoBias ?? 0;
      const targetWall = bias >= 0 ? leftWall : rightWall;
      const distToWall = Math.abs(c - targetWall);
      const weight = Math.abs(bias) * 0.75;
      score = distToWall - weight; // lower is better
    } else if (type === "Utility") {
      score = manhattanToEdge(r, c, rows, cols);
    }
    candidates.push({ idx: i, r, c, score });
  }
  // Bucket by score for deterministic tiebreak via seeded shuffle
  const groups = new Map<number, Array<{ idx: number; r: number; c: number; score: number }>>();
  for (const it of candidates) {
    const key = Number(it.score.toFixed(6));
    const arr = groups.get(key) || [];
    arr.push(it);
    groups.set(key, arr);
  }
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => a - b);
  const ordered: number[] = [];
  for (const key of sortedKeys) {
    const group = groups.get(key)!;
    const shuffled = seededShuffle(group, `${rngSeed}|${type}|${key}`);
    for (const g of shuffled) ordered.push(g.idx);
  }

  let placed = 0;
  for (const idx of ordered) {
    if (placed >= count) break;
    if (cells[idx].hole || cells[idx].slot) continue;
    cells[idx].slot = type;
    placed += 1;
  }
}

export function selectEdgeUtilityTargets(
  cells: GridCell[],
  rows: number,
  cols: number,
  count: number,
  rngSeed: string
): number[] {
  const candidates: Array<{ idx: number; score: number }> = [];
  for (let i = 0; i < cells.length; i += 1) {
    const cell = cells[i];
    if (cell.hole) continue;
    if (cell.slot === "Utility") continue;
    const r = Math.floor(i / cols);
    const c = i % cols;
    const score = manhattanToEdge(r, c, rows, cols);
    candidates.push({ idx: i, score });
  }
  const groups = new Map<number, Array<{ idx: number; score: number }>>();
  for (const it of candidates) {
    const key = Number(it.score.toFixed(6));
    const arr = groups.get(key) || [];
    arr.push(it);
    groups.set(key, arr);
  }
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => a - b);
  const ordered: number[] = [];
  for (const key of sortedKeys) {
    const group = groups.get(key)!;
    const shuffled = seededShuffle(group, `${rngSeed}|edgeU|${key}`);
    for (const g of shuffled) ordered.push(g.idx);
  }
  return ordered.slice(0, count);
}

export function selectInnerUtilityTargets(
  cells: GridCell[],
  rows: number,
  cols: number,
  count: number,
  rngSeed: string
): number[] {
  const candidates: Array<{ idx: number; score: number }> = [];
  for (let i = 0; i < cells.length; i += 1) {
    const cell = cells[i];
    if (cell.hole) continue;
    if (cell.slot === "Utility") continue;
    const r = Math.floor(i / cols);
    const c = i % cols;
    const score = manhattanToEdge(r, c, rows, cols);
    candidates.push({ idx: i, score });
  }
  // Highest edge distance first (most inner)
  const groups = new Map<number, Array<{ idx: number; score: number }>>();
  for (const it of candidates) {
    const key = Number(it.score.toFixed(6));
    const arr = groups.get(key) || [];
    arr.push(it);
    groups.set(key, arr);
  }
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => b - a);
  const ordered: number[] = [];
  for (const key of sortedKeys) {
    const group = groups.get(key)!;
    const shuffled = seededShuffle(group, `${rngSeed}|innerU|${key}`);
    for (const g of shuffled) ordered.push(g.idx);
  }
  return ordered.slice(0, count);
}

