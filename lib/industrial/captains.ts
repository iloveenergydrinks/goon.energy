// Captain system for industrial jobs (refining and manufacturing)

export type CaptainId =
  | 'none'
  | 'refiner_ace'
  | 'assembly_maestro'
  | 'balanced_veteran';

export interface CaptainDefinition {
  id: CaptainId;
  name: string;
  description: string;
  // Effects are multiplicative modifiers where lower is better for time and waste
  effects: {
    refiningSpeedMultiplier?: number; // e.g., 0.9 = 10% faster
    refiningYieldBonus?: number;      // additive to retention rate per cycle, e.g., +0.02
    refiningPurityBonus?: number;     // additive purity gain bonus, e.g., +0.02 absolute

    manufacturingSpeedMultiplier?: number; // e.g., 0.9 = 10% faster
    manufacturingQualityBonus?: number;    // additive quality bonus multiplier, e.g., +0.05
  };
}

const CAPTAINS: Record<CaptainId, CaptainDefinition> = {
  none: {
    id: 'none',
    name: 'No Captain',
    description: 'Unassigned job with no bonuses.',
    effects: {}
  },
  refiner_ace: {
    id: 'refiner_ace',
    name: 'Refiner Ace',
    description: 'Specialist in extraction and purity control.',
    effects: {
      refiningSpeedMultiplier: 0.9,
      refiningYieldBonus: 0.02,
      refiningPurityBonus: 0.02
    }
  },
  assembly_maestro: {
    id: 'assembly_maestro',
    name: 'Assembly Maestro',
    description: 'Expert at workflow and QA on the line.',
    effects: {
      manufacturingSpeedMultiplier: 0.85,
      manufacturingQualityBonus: 0.05
    }
  },
  balanced_veteran: {
    id: 'balanced_veteran',
    name: 'Balanced Veteran',
    description: 'Seasoned leader with steady gains everywhere.',
    effects: {
      refiningSpeedMultiplier: 0.95,
      refiningYieldBonus: 0.01,
      manufacturingSpeedMultiplier: 0.95,
      manufacturingQualityBonus: 0.03
    }
  }
};

export function getCaptainById(id?: string | null): CaptainDefinition {
  if (!id) return CAPTAINS.none;
  const key = id as CaptainId;
  return CAPTAINS[key] ?? CAPTAINS.none;
}

export type CaptainEffects = CaptainDefinition['effects'];

export function getCaptainEffects(id?: string | null): CaptainEffects {
  return getCaptainById(id).effects;
}




