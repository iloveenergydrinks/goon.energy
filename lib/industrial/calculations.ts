// Industrial System Calculations and Helper Functions

import type { 
  Material, 
  MaterialTier, 
  MaterialAttributes,
  Blueprint, 
  RefiningFacility, 
  ManufacturingFacility,
  MaterialRequirement,
  ResearchAggressiveness,
  RefiningCycle
} from '@/types/industrial';
import type { QualityGrade } from '@/lib/industrial/quality';
import { getQualityGrade } from '@/lib/industrial/quality';

// Tier thresholds based on purity
const TIER_THRESHOLDS = {
  1: { min: 0.0, max: 0.3, grade: 'F' as const },
  2: { min: 0.3, max: 0.5, grade: 'D' as const },
  3: { min: 0.5, max: 0.7, grade: 'B' as const },
  4: { min: 0.7, max: 0.9, grade: 'A' as const },
  5: { min: 0.9, max: 1.0, grade: 'S' as const }
};

// Research aggressiveness parameters
const RESEARCH_PARAMS = {
  safe: { successRate: 0.95, speedMultiplier: 0.5, criticalFailureChance: 0.01 },
  normal: { successRate: 0.85, speedMultiplier: 1.0, criticalFailureChance: 0.05 },
  aggressive: { successRate: 0.70, speedMultiplier: 1.5, criticalFailureChance: 0.10 },
  reckless: { successRate: 0.50, speedMultiplier: 2.0, criticalFailureChance: 0.20 }
};

/**
 * Determines material tier based on purity
 */
export function calculateMaterialTier(purity: number): MaterialTier {
  if (purity >= 0.9) return 5;
  if (purity >= 0.7) return 4;
  if (purity >= 0.5) return 3;
  if (purity >= 0.3) return 2;
  return 1;
}

/**
 * Calculate stat bonus from material quality
 * Higher tier and purity = better bonus
 */
export function calculateStatBonus(
  baseStat: number, 
  materialTier: MaterialTier, 
  purity: number
): number {
  // Base multiplier from tier: +10% per tier above 1
  const tierMultiplier = 1 + (materialTier - 1) * 0.1;
  
  // Purity bonus: up to +20% at max purity
  const purityBonus = purity * 0.2;
  
  // Combined multiplier
  const totalMultiplier = tierMultiplier + purityBonus;
  
  return Math.round(baseStat * totalMultiplier * 100) / 100;
}

/**
 * Calculate how well a material matches a requirement
 */
export function calculateMaterialMatch(
  requirement: MaterialRequirement,
  material: Material
): number {
  const attributeValue = material.attributes[requirement.attribute];
  
  // Below minimum is unacceptable
  if (attributeValue < requirement.minValue) {
    return 0;
  }
  
  // Between min and ideal - linear scaling
  if (attributeValue < requirement.idealValue) {
    const range = requirement.idealValue - requirement.minValue;
    const progress = attributeValue - requirement.minValue;
    return 0.5 + (progress / range) * 0.5;
  }
  
  // At or above ideal - perfect match with diminishing returns
  const surplus = attributeValue - requirement.idealValue;
  const bonusScore = Math.min(0.2, surplus * 0.1);
  return Math.min(1.0 + bonusScore, 1.2); // Cap at 120% match
}

/**
 * Roll for special abilities based on material quality
 */
export function rollSpecialAbilities(materials: Material[]): string[] {
  const abilities: string[] = [];
  const averageTier = materials.reduce((sum, m) => sum + m.tier, 0) / materials.length;
  const averagePurity = materials.reduce((sum, m) => sum + m.purity, 0) / materials.length;
  
  // Tier 3+ materials can grant basic abilities
  if (averageTier >= 3) {
    if (Math.random() < 0.2 * averagePurity) {
      abilities.push("Efficient Power Draw (-10% power consumption)");
    }
    if (Math.random() < 0.15 * averagePurity) {
      abilities.push("Enhanced Durability (+25% module HP)");
    }
  }
  
  // Tier 4+ materials can grant advanced abilities
  if (averageTier >= 4) {
    if (Math.random() < 0.25 * averagePurity) {
      abilities.push("Quick Charge (20% faster capacitor recharge)");
    }
    if (Math.random() < 0.20 * averagePurity) {
      abilities.push("Overload Capable (Can boost stats by 50% temporarily)");
    }
  }
  
  // Tier 5 materials can grant legendary abilities
  if (averageTier >= 5) {
    if (Math.random() < 0.30 * averagePurity) {
      abilities.push("Self-Repair (Regenerates 1% HP per minute)");
    }
    if (Math.random() < 0.25 * averagePurity) {
      abilities.push("Adaptive Resistance (15% omni-resistance)");
    }
    if (Math.random() < 0.20 * averagePurity) {
      abilities.push("Quantum Efficiency (30% reduction in all penalties)");
    }
  }
  
  return abilities;
}

/**
 * Calculate final item quality from blueprint, materials, and facility
 */
export function calculateItemQuality(
  blueprint: Blueprint,
  materials: Material[],
  facility: ManufacturingFacility
): number {
  // Base quality from blueprint research level
  const blueprintQuality = Math.min(50, blueprint.researchLevel * 2);
  
  // Material quality contribution (30% weight)
  const avgMaterialTier = materials.reduce((sum, m) => sum + m.tier, 0) / materials.length;
  const avgPurity = materials.reduce((sum, m) => sum + m.purity, 0) / materials.length;
  const materialQuality = ((avgMaterialTier - 1) / 4 * 20) + (avgPurity * 10); // Max 30
  
  // Facility quality contribution (20% weight)
  const facilityQuality = facility.capabilities.qualityBonus;
  
  // Total quality (0-100 scale)
  const totalQuality = blueprintQuality + materialQuality + facilityQuality;
  
  return Math.min(100, Math.max(0, totalQuality));
}

// =============================
// New: Item Rating (0-100) model
// =============================

// Base score by material grade (from purity)
export const MATERIAL_GRADE_BASE_SCORE: Record<QualityGrade, number> = {
  SC: 20, // Scrap
  CR: 35, // Crude
  ST: 50, // Standard
  RF: 65, // Refined
  PR: 80, // Pure
  PS: 92, // Pristine
  QT: 100 // Quantum
};

export function materialPurityToScore(purity: number): number {
  const grade = getQualityGrade(purity).grade;
  return MATERIAL_GRADE_BASE_SCORE[grade];
}

export function scoreToItemGrade(score: number): "F" | "E" | "D" | "C" | "B" | "A" | "S" {
  if (score >= 97) return 'S';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  if (score >= 50) return 'E';
  return 'F';
}

export function scoreToMultiplier(score: number): number {
  // Map 0..100 -> 0.7..1.3 (50 -> 1.0)
  const clamped = Math.max(0, Math.min(100, score));
  return Math.round((0.7 + (clamped / 100) * 0.6) * 1000) / 1000;
}

export function computeManufacturingQualityScore(
  materialPurities: number[],
  blueprintTier: number,
  captainQualityBonusPct: number = 0
): { score: number; grade: "F" | "E" | "D" | "C" | "B" | "A" | "S"; multiplier: number; mismatchPenalty: number } {
  if (materialPurities.length === 0) {
    return { score: 50, grade: 'E', multiplier: 1.0, mismatchPenalty: 0 };
  }
  const scores = materialPurities.map(p => materialPurityToScore(p));
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const spread = max - min;
  // Penalize heavy mixing; cap at 12 points
  const mismatchPenalty = Math.min(12, Math.round(spread * 0.25));
  const blueprintBonus = Math.max(0, Math.round((blueprintTier - 1) * 5));
  const captainBonusPts = Math.round((captainQualityBonusPct || 0) * 100);
  const raw = avg + blueprintBonus + captainBonusPts - mismatchPenalty;
  const score = Math.max(0, Math.min(100, Math.round(raw)));
  const grade = scoreToItemGrade(score);
  const multiplier = scoreToMultiplier(score);
  return { score, grade, multiplier, mismatchPenalty };
}

/**
 * Calculate refining output based on input, facility, and cycle
 */
export function calculateRefiningOutput(
  quantity: number,
  purity: number,
  tier: number,
  facilityEfficiency: number,
  cycleNumber: number
): { outputQuantity: number; outputPurity: number; outputTier: number } {
  // Base efficiency decreases with each cycle
  const cycleEfficiency = facilityEfficiency * Math.pow(0.85, cycleNumber - 1);
  
  // Calculate output quantity (with waste)
  const retentionRate = cycleEfficiency;
  const outputQuantity = Math.floor(quantity * retentionRate);
  
  // Calculate new purity (increases with each cycle but with diminishing returns)
  // Assume max purity of 1.0 (100%)
  const maxPurity = 1.0;
  const purityGain = (maxPurity - purity) * (0.4 / cycleNumber);
  const outputPurity = Math.min(maxPurity, purity + purityGain);
  
  // Determine new tier based on purity
  const outputTier = calculateMaterialTier(outputPurity);
  
  return {
    outputQuantity,
    outputPurity,
    outputTier
  };
}

/**
 * Calculate research success chance
 */
export function calculateResearchSuccess(
  blueprint: Blueprint,
  materials: Material[],
  aggressiveness: ResearchAggressiveness
): number {
  const params = RESEARCH_PARAMS[aggressiveness];
  let successChance = params.successRate;
  
  // Consecutive failures reduce success chance
  successChance *= Math.pow(0.95, blueprint.consecutiveFailures);
  
  // Higher research levels are harder
  const levelPenalty = Math.min(0.3, blueprint.researchLevel * 0.01);
  successChance -= levelPenalty;
  
  // High quality materials improve success chance
  if (materials.length > 0) {
    const avgStability = materials.reduce((sum, m) => sum + m.attributes.stability, 0) / materials.length;
    successChance += avgStability * 0.1; // Up to +10% from stability
  }
  
  // Security level affects industrial espionage risk
  if (blueprint.isShared) {
    successChance -= (100 - blueprint.securityLevel) * 0.002; // Up to -20% if no security
  }
  
  return Math.max(0.1, Math.min(0.99, successChance));
}

/**
 * Calculate research points required for next level
 * Exponential growth to prevent easy maxing
 */
export function calculateResearchRequirement(currentLevel: number): number {
  // Base requirement doubles every 5 levels
  const baseRequirement = 100;
  const growthFactor = Math.pow(2, currentLevel / 5);
  
  return Math.floor(baseRequirement * growthFactor);
}

/**
 * Apply logarithmic scaling for stats that shouldn't grow linearly
 */
export function applyStatScaling(
  statName: string,
  baseValue: number,
  improvementPercent: number
): number {
  const linearStats = ['durability', 'hp', 'damage', 'powerGen', 'capBuffer'];
  const logarithmicStats = ['speed', 'rateOfFire', 'trackingSpeed'];
  const diminishingStats = ['resistance', 'evasion', 'critChance'];
  
  if (linearStats.includes(statName)) {
    // Linear scaling - direct percentage increase
    return baseValue * (1 + improvementPercent / 100);
  } else if (logarithmicStats.includes(statName)) {
    // Logarithmic scaling - heavy diminishing returns
    const scaleFactor = Math.log10(1 + improvementPercent / 10) + 1;
    return baseValue * scaleFactor;
  } else if (diminishingStats.includes(statName)) {
    // Asymptotic scaling - approaches but never reaches a cap
    const maxIncrease = baseValue * 0.5; // Can at most increase by 50%
    const actualIncrease = maxIncrease * (1 - Math.exp(-improvementPercent / 50));
    return baseValue + actualIncrease;
  }
  
  // Default to conservative scaling
  return baseValue * (1 + improvementPercent / 200);
}

/**
 * Calculate material requirements based on blueprint efficiency
 */
export function calculateMaterialRequirements(
  baseRequirements: MaterialRequirement[],
  blueprint: Blueprint
): MaterialRequirement[] {
  return baseRequirements.map(req => ({
    ...req,
    quantity: Math.ceil(req.quantity * blueprint.materialEfficiency)
  }));
}

/**
 * Estimate production time
 */
export function calculateProductionTime(
  baseTime: number, // in seconds
  blueprint: Blueprint,
  facility: ManufacturingFacility,
  materials: Material[]
): number {
  // Blueprint research reduces time
  const blueprintModifier = blueprint.productionTimeModifier;
  
  // Facility affects speed
  const facilityModifier = facility.capabilities.speedMultiplier;
  
  // High quality materials can speed up production slightly
  const avgPurity = materials.reduce((sum, m) => sum + m.purity, 0) / materials.length;
  const materialModifier = 1 - (avgPurity * 0.1); // Up to 10% faster with perfect materials
  
  return Math.floor(baseTime * blueprintModifier * facilityModifier * materialModifier);
}

/**
 * Calculate transport costs
 */
export function calculateTransportCost(
  distance: number, // in units
  cargoVolume: number, // in m³
  securityLevel: "high" | "low" | "null",
  insuranceLevel: number // 0-1
): number {
  const baseCostPerUnit = 10;
  const volumeMultiplier = 1 + (cargoVolume / 1000) * 0.5;
  
  const securityMultipliers = {
    high: 1.0,
    low: 1.5,
    null: 2.5
  };
  
  const insuranceCost = insuranceLevel * cargoVolume * 0.02;
  
  return Math.floor(
    distance * baseCostPerUnit * volumeMultiplier * 
    securityMultipliers[securityLevel] + insuranceCost
  );
}

/**
 * Calculate espionage success chance
 */
export function calculateEspionageSuccess(
  infiltrationLevel: number,
  targetSecurity: number,
  agentSkill: number,
  hasCounterIntel: boolean
): number {
  // Base chance from infiltration level
  let successChance = infiltrationLevel / 100;
  
  // Target security reduces chance
  successChance *= (1 - targetSecurity / 200);
  
  // Agent skill improves chance
  successChance += agentSkill / 100 * 0.3;
  
  // Counter-intelligence cuts success rate
  if (hasCounterIntel) {
    successChance *= 0.6;
  }
  
  return Math.max(0.05, Math.min(0.95, successChance));
}

/**
 * Calculate market price based on supply, demand, and events
 */
export function calculateMarketPrice(
  basePrice: number,
  supply: number,
  demand: number,
  volatility: number,
  eventMultiplier: number = 1.0
): number {
  // Supply/demand ratio affects price
  const supplyDemandRatio = supply / Math.max(1, demand);
  const sdMultiplier = Math.pow(1 / supplyDemandRatio, 0.5); // Inverse relationship
  
  // Add random volatility
  const randomFactor = 1 + (Math.random() - 0.5) * volatility;
  
  return Math.floor(basePrice * sdMultiplier * randomFactor * eventMultiplier);
}

/**
 * Grade a material for display
 */
export function getMaterialGrade(purity: number): string {
  if (purity >= 0.95) return 'S';
  if (purity >= 0.85) return 'A';
  if (purity >= 0.70) return 'B';
  if (purity >= 0.50) return 'C';
  if (purity >= 0.30) return 'D';
  if (purity >= 0.15) return 'E';
  return 'F';
}

/**
 * Get color for material tier display
 */
export function getTierColor(tier: MaterialTier): string {
  const colors = {
    1: '#6B7280', // Gray
    2: '#10B981', // Green  
    3: '#3B82F6', // Blue
    4: '#A855F7', // Purple
    5: '#F97316'  // Orange
  };
  return colors[tier];
}

/**
 * Format large numbers for display
 */
export function formatIndustrialNumber(value: number | undefined | null): string {
  if (!value && value !== 0) return '0';
  
  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) return '0';
  
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}









