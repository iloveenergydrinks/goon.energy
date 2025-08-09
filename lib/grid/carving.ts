import type { GridCell } from "@/types/fitting";
import type { RNG } from "@/lib/rng";
import { seededBool } from "@/lib/rng";

function indexOf(r: number, c: number, cols: number): number {
  return r * cols + c;
}

function inBounds(r: number, c: number, rows: number, cols: number): boolean {
  return r >= 0 && c >= 0 && r < rows && c < cols;
}

function ensureConnectedAfterCarve(cells: GridCell[], rows: number, cols: number): boolean {
  // BFS over non-hole cells: grid must be 4-connected.
  const visited = new Set<number>();
  let start = -1;
  for (let i = 0; i < cells.length; i += 1) {
    if (!cells[i].hole) { start = i; break; }
  }
  if (start === -1) return true; // all holes trivially connected
  const q: number[] = [start];
  visited.add(start);
  while (q.length) {
    const cur = q.shift()!;
    const r = Math.floor(cur / cols);
    const c = cur % cols;
    const neighbors = [
      [r - 1, c],
      [r + 1, c],
      [r, c - 1],
      [r, c + 1],
    ];
    for (const [nr, nc] of neighbors) {
      if (!inBounds(nr, nc, rows, cols)) continue;
      const ni = indexOf(nr, nc, cols);
      if (cells[ni].hole) continue;
      if (visited.has(ni)) continue;
      visited.add(ni);
      q.push(ni);
    }
  }
  const nonHoleCount = cells.filter((c) => !c.hole).length;
  return visited.size === nonHoleCount;
}

export function carveIrregular(cells: GridCell[], rows: number, cols: number, rng: RNG): void {
  const corners: Array<[number, number]> = [
    [0, 0],
    [0, cols - 1],
    [rows - 1, 0],
    [rows - 1, cols - 1],
  ];
  for (const [r, c] of corners) {
    if (!seededBool(0.6, rng)) continue;
    const i = indexOf(r, c, cols);
    const prev = cells[i].hole;
    cells[i].hole = true;
    if (!ensureConnectedAfterCarve(cells, rows, cols)) {
      cells[i].hole = prev;
    }
  }
}

export function carveCentralPockets(cells: GridCell[], rows: number, cols: number, rng: RNG): void {
  const pockets = seededBool(0.75, rng) ? 1 : 2;
  const centerR = Math.floor(rows / 2);
  const centerC = Math.floor(cols / 2);
  const candidates: Array<[number, number]> = [];
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      const r = centerR + dr;
      const c = centerC + dc;
      if (!inBounds(r, c, rows, cols)) continue;
      if (r === 0 || c === 0 || r === rows - 1 || c === cols - 1) continue; // avoid edge
      candidates.push([r, c]);
    }
  }
  for (let k = 0; k < pockets && candidates.length > 0; k += 1) {
    const idx = Math.floor(rng() * candidates.length);
    const [r, c] = candidates.splice(idx, 1)[0];
    const i = indexOf(r, c, cols);
    const prev = cells[i].hole;
    cells[i].hole = true;
    if (!ensureConnectedAfterCarve(cells, rows, cols)) {
      cells[i].hole = prev;
    }
  }
}

