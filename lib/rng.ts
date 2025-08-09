import seedrandom, { type PRNG } from "seedrandom";

export type RNG = PRNG;

export function createRng(seed: string): RNG {
  return seedrandom(seed) as PRNG;
}

export function seededShuffle<T>(items: T[], seed: string): T[] {
  const rng = createRng(seed);
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function seededChoice<T>(items: T[], rng: RNG): T {
  return items[Math.floor(rng() * items.length)];
}

export function seededBool(probability: number, rng: RNG): boolean {
  return rng() < probability;
}

