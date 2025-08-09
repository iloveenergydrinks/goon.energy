import type { SecondaryDef } from "@/types/fitting";

export function applySecondaries(
  baseRatio: { P: number; A: number; U: number },
  secondaries: SecondaryDef[]
): { P: number; A: number; U: number } {
  const sorted = [...secondaries].sort((a, b) => a.id.localeCompare(b.id));
  let P = baseRatio.P;
  let A = baseRatio.A;
  let U = baseRatio.U;
  for (const s of sorted) {
    P += s.delta.dP;
    A += s.delta.dA;
    U += s.delta.dU;
  }
  P = Math.max(0, P);
  A = Math.max(0, A);
  U = Math.max(0, U);
  const S = P + A + U;
  if (S === 0) {
    // fallback equally
    return { P: 1 / 3, A: 1 / 3, U: 1 / 3 };
  }
  return { P: P / S, A: A / S, U: U / S };
}

export function ratioToCounts(
  P: number,
  A: number,
  U: number,
  N: number
): [number, number, number] {
  const targets = [P * N, A * N, U * N];
  const floors = targets.map((x) => Math.floor(x));
  let rem = N - (floors[0] + floors[1] + floors[2]);
  const fracs = targets.map((x, i) => ({ i, f: x - Math.floor(x) }));
  fracs.sort((a, b) => b.f - a.f);
  const counts = [...floors];
  for (let k = 0; k < fracs.length && rem > 0; k += 1) {
    counts[fracs[k].i] += 1;
    rem -= 1;
  }
  return [counts[0], counts[1], counts[2]];
}

