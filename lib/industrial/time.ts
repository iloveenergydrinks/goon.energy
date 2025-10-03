import { getCaptainEffects } from '@/lib/industrial/captains';

export function estimateRefiningTimeSeconds(
  quantity: number,
  cycles: number,
  captainId?: string | null
): number {
  // Base: 30s setup + 0.05s per unit per cycle with diminishing factor
  const baseSetup = 30;
  const perUnitPerCycle = 0.05;
  // Diminishing returns for later cycles
  const cycleWeight = Array.from({ length: cycles }, (_, i) => Math.pow(0.9, i)).reduce((a, b) => a + b, 0);
  let total = baseSetup + quantity * perUnitPerCycle * cycleWeight;

  const effects = getCaptainEffects(captainId);
  if (effects.refiningSpeedMultiplier) {
    total *= effects.refiningSpeedMultiplier;
  }
  // Clamp
  return Math.max(5, Math.round(total));
}

export function estimateManufacturingTimeSeconds(
  blueprintTier: number,
  batchSize: number,
  averageMaterialPurity: number,
  captainId?: string | null
): number {
  // Base per-item time scales with blueprint tier; purity can speed slightly
  const basePerItem = 60 * Math.max(1, blueprintTier); // 1-3 minutes typical
  const puritySpeedFactor = 1 - Math.min(0.1, averageMaterialPurity * 0.1); // up to 10% faster at 100% purity
  let total = basePerItem * puritySpeedFactor * batchSize;

  const effects = getCaptainEffects(captainId);
  if (effects.manufacturingSpeedMultiplier) {
    total *= effects.manufacturingSpeedMultiplier;
  }
  // Clamp
  return Math.max(10, Math.round(total));
}




