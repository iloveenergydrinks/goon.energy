export type QualityGrade = 'SC' | 'CR' | 'ST' | 'RF' | 'PR' | 'PS' | 'QT';

export interface QualityInfo {
  grade: QualityGrade;
  name: string;
  shortName: string;
  minPurity: number;
  maxPurity: number;
  color: string;
  bgColor: string;
  borderColor: string;
  effectiveness: number;
  description: string;
}

export const QUALITY_GRADES: Record<QualityGrade, QualityInfo> = {
  SC: {
    grade: 'SC',
    name: 'Scrap',
    shortName: 'Scrap',
    minPurity: 0,
    maxPurity: 0.2,
    color: '#8B4513', // Rust brown
    bgColor: 'bg-orange-900/20',
    borderColor: 'border-orange-900',
    effectiveness: 0.7,
    description: 'Contaminated and barely usable'
  },
  CR: {
    grade: 'CR',
    name: 'Crude',
    shortName: 'Crude',
    minPurity: 0.2,
    maxPurity: 0.4,
    color: '#4B5563', // Dark gray
    bgColor: 'bg-gray-700/20',
    borderColor: 'border-gray-700',
    effectiveness: 0.8,
    description: 'Rough and unrefined'
  },
  ST: {
    grade: 'ST',
    name: 'Standard',
    shortName: 'Standard',
    minPurity: 0.4,
    maxPurity: 0.6,
    color: '#9CA3AF', // Light gray
    bgColor: 'bg-gray-500/20',
    borderColor: 'border-gray-500',
    effectiveness: 0.9,
    description: 'Industry standard quality'
  },
  RF: {
    grade: 'RF',
    name: 'Refined',
    shortName: 'Refined',
    minPurity: 0.6,
    maxPurity: 0.8,
    color: '#3B82F6', // Blue
    bgColor: 'bg-blue-600/20',
    borderColor: 'border-blue-600',
    effectiveness: 1.0,
    description: 'Well-processed material'
  },
  PR: {
    grade: 'PR',
    name: 'Pure',
    shortName: 'Pure',
    minPurity: 0.8,
    maxPurity: 0.95,
    color: '#8B5CF6', // Purple
    bgColor: 'bg-purple-600/20',
    borderColor: 'border-purple-600',
    effectiveness: 1.1,
    description: 'Laboratory-grade purity'
  },
  PS: {
    grade: 'PS',
    name: 'Pristine',
    shortName: 'Pristine',
    minPurity: 0.95,
    maxPurity: 0.9999,
    color: '#EAB308', // Gold
    bgColor: 'bg-yellow-600/20',
    borderColor: 'border-yellow-600',
    effectiveness: 1.2,
    description: 'Near-perfect molecular structure'
  },
  QT: {
    grade: 'QT',
    name: 'Quantum',
    shortName: 'Quantum',
    minPurity: 0.9999,
    maxPurity: 1.0,
    color: '#E11D48', // Prismatic (using bright pink as base)
    bgColor: 'bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20',
    borderColor: 'border-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600',
    effectiveness: 1.3,
    description: 'Quantum-aligned perfection'
  }
};

// Get quality grade from purity value
export function getQualityGrade(purity: number): QualityInfo {
  if (purity >= 0.9999) return QUALITY_GRADES.QT;
  if (purity >= 0.95) return QUALITY_GRADES.PS;
  if (purity >= 0.8) return QUALITY_GRADES.PR;
  if (purity >= 0.6) return QUALITY_GRADES.RF;
  if (purity >= 0.4) return QUALITY_GRADES.ST;
  if (purity >= 0.2) return QUALITY_GRADES.CR;
  return QUALITY_GRADES.SC;
}

// Get quality grade by key
export function getQualityByGrade(grade: QualityGrade): QualityInfo {
  return QUALITY_GRADES[grade];
}

// Format purity as quality string with float
export function formatQuality(purity: number): string {
  const quality = getQualityGrade(purity);
  const floatValue = purity.toFixed(4);
  
  if (quality.grade === 'QT') {
    return `${quality.name} (Perfect)`;
  }
  
  // Determine position within grade
  const rangeSize = quality.maxPurity - quality.minPurity;
  const positionInRange = (purity - quality.minPurity) / rangeSize;
  
  let descriptor = '';
  if (positionInRange > 0.9) descriptor = 'High ';
  else if (positionInRange > 0.5) descriptor = '';
  else if (positionInRange > 0.1) descriptor = 'Low ';
  else descriptor = 'Minimal ';
  
  return `${descriptor}${quality.name} (${floatValue})`;
}

// Get a random purity value for a given tier and node tier
export function generateQualityForMining(nodeTier: number, materialTier: number): number {
  // Higher tier nodes have better base quality
  const baseQuality = 0.1 + (nodeTier * 0.15);
  
  // Add randomness
  const variance = 0.3;
  const randomFactor = (Math.random() - 0.5) * variance;
  
  // Higher material tiers get a quality bonus
  const tierBonus = materialTier * 0.05;
  
  let purity = baseQuality + randomFactor + tierBonus;
  
  // Clamp between 0 and 0.99 (Quantum is extremely rare)
  purity = Math.max(0, Math.min(0.99, purity));
  
  // 0.1% chance for perfect Quantum
  if (Math.random() < 0.001) {
    purity = 1.0;
  }
  
  return purity;
}

// Purification (refining) outcome
export interface PurificationResult {
  success: boolean;
  newPurity: number;
  newGrade: QualityInfo;
  message: string;
}

// Risk modes for purification
export type RiskMode = 'safe' | 'standard' | 'aggressive' | 'yolo';

export interface RiskModeConfig {
  name: string;
  description: string;
  materialCost: number; // Percentage of material consumed
  upgradeMultiplier: number; // Multiplier for upgrade chance
  downgradeMultiplier: number; // Multiplier for downgrade chance
  minImprovement: number; // Min purity gain (as decimal, e.g. 0.05 = 5%)
  maxImprovement: number; // Max purity gain
  contaminationSeverity: number; // How bad contamination is
}

export const RISK_MODES: Record<RiskMode, RiskModeConfig> = {
  safe: {
    name: 'Safe',
    description: 'Low risk, low reward',
    materialCost: 10,
    upgradeMultiplier: 0.7,
    downgradeMultiplier: 0.5,
    minImprovement: 0.05,
    maxImprovement: 0.10,
    contaminationSeverity: 0.5
  },
  standard: {
    name: 'Standard',
    description: 'Balanced risk and reward',
    materialCost: 20,
    upgradeMultiplier: 1.0,
    downgradeMultiplier: 1.0,
    minImprovement: 0.10,
    maxImprovement: 0.20,
    contaminationSeverity: 1.0
  },
  aggressive: {
    name: 'Aggressive',
    description: 'Higher risk, higher reward',
    materialCost: 30,
    upgradeMultiplier: 1.3,
    downgradeMultiplier: 1.5,
    minImprovement: 0.15,
    maxImprovement: 0.35,
    contaminationSeverity: 1.2
  },
  yolo: {
    name: 'YOLO',
    description: 'Maximum chaos!',
    materialCost: 50,
    upgradeMultiplier: 1.5,
    downgradeMultiplier: 2.0,
    minImprovement: 0.25,
    maxImprovement: 0.50,
    contaminationSeverity: 1.5
  }
};

// Track refinement level for materials that reach 100% purity
export interface RefinementLevel {
  level: number;
  bonusMultiplier: number;
  effectivePurity: number;
}

export function getRefinementLevel(purity: number): RefinementLevel {
  // Purity above 1.0 represents refinement levels
  if (purity <= 1.0) {
    return { level: 0, bonusMultiplier: 1.0, effectivePurity: purity };
  }
  
  // Each 0.1 above 1.0 = 1 refinement level
  const level = Math.floor((purity - 1.0) * 10);
  // Each level gives 1% bonus to effectiveness
  const bonusMultiplier = 1.0 + (level * 0.01);
  
  return { level, bonusMultiplier, effectivePurity: 1.0 };
}

// Get base odds based on current purity
export function getBaseOdds(purity: number): { upgrade: number; same: number; downgrade: number } {
  // Account for refinement levels (purity > 100)
  const effectivePurity = Math.min(purity, 1.0);
  
  if (effectivePurity < 0.2) {
    // Scrap tier - very easy to improve
    return { upgrade: 80, same: 15, downgrade: 5 };
  } else if (effectivePurity < 0.4) {
    // Crude tier - easy to improve
    return { upgrade: 70, same: 20, downgrade: 10 };
  } else if (effectivePurity < 0.6) {
    // Standard tier - moderate difficulty
    return { upgrade: 60, same: 25, downgrade: 15 };
  } else if (effectivePurity < 0.75) {
    // Refined tier - getting harder
    return { upgrade: 45, same: 30, downgrade: 25 };
  } else if (effectivePurity < 0.85) {
    // Pure tier - difficult
    return { upgrade: 35, same: 35, downgrade: 30 };
  } else if (effectivePurity < 0.95) {
    // Pristine tier - very difficult
    return { upgrade: 25, same: 40, downgrade: 35 };
  } else {
    // Quantum tier - extremely difficult
    return { upgrade: 15, same: 45, downgrade: 40 };
  }
}

// Apply risk mode modifiers to base odds
export function getAdjustedOdds(
  purity: number,
  riskMode: RiskMode
): { upgrade: number; same: number; downgrade: number } {
  const baseOdds = getBaseOdds(purity);
  const config = RISK_MODES[riskMode];
  
  // Apply multipliers
  let upgrade = baseOdds.upgrade * config.upgradeMultiplier;
  let downgrade = baseOdds.downgrade * config.downgradeMultiplier;
  
  // Ensure odds are within bounds
  upgrade = Math.max(5, Math.min(90, upgrade));
  downgrade = Math.max(5, Math.min(60, downgrade));
  
  // Calculate 'same' to make total 100%
  const same = 100 - upgrade - downgrade;
  
  return {
    upgrade: Math.round(upgrade),
    same: Math.round(same),
    downgrade: Math.round(downgrade)
  };
}

export function attemptPurification(currentPurity: number, riskMode: RiskMode = 'standard'): PurificationResult {
  const config = RISK_MODES[riskMode];
  const odds = getAdjustedOdds(currentPurity, riskMode);
  const currentGrade = getQualityGrade(Math.min(currentPurity, 1.0));
  const currentRefinement = getRefinementLevel(currentPurity);
  
  // Calculate diminishing returns for refinement levels
  const refinementDiminishing = currentRefinement.level > 0 
    ? Math.pow(0.8, currentRefinement.level) 
    : 1.0;
  
  const roll = Math.random() * 100;
  
  if (roll < odds.upgrade) {
    // Success - upgrade with risk-based improvement
    const baseImprovement = config.minImprovement + 
      Math.random() * (config.maxImprovement - config.minImprovement);
    
    // Apply diminishing returns for high purity and refinement levels
    let improvement = baseImprovement * refinementDiminishing;
    
    // Further reduce improvement at very high purities
    if (currentPurity >= 0.95) {
      improvement *= 0.5;
    } else if (currentPurity >= 0.85) {
      improvement *= 0.7;
    }
    
    // Minimum improvement to prevent complete stagnation
    improvement = Math.max(improvement, 0.001);
    
    let newPurity = currentPurity + improvement;
    const newGrade = getQualityGrade(Math.min(newPurity, 1.0));
    const newRefinement = getRefinementLevel(newPurity);
    
    // Format message based on refinement level
    let message = '';
    if (currentPurity >= 1.0 && newRefinement.level > currentRefinement.level) {
      message = `🎯 Refinement level increased to +${newRefinement.level}!`;
    } else if (currentPurity >= 1.0) {
      message = `✨ Refinement improved! (Level +${newRefinement.level})`;
    } else if (newPurity >= 1.0) {
      message = `💎 Achieved perfect Quantum purity! Refinement +${newRefinement.level}`;
    } else if (newGrade.grade !== currentGrade.grade) {
      message = `⬆️ Upgraded to ${newGrade.name}!`;
    } else {
      const displayPurity = Math.min(newPurity * 100, 100);
      message = `📈 Purity increased to ${displayPurity.toFixed(1)}%!`;
    }
    
    return {
      success: true,
      newPurity,
      newGrade,
      message
    };
  } else if (roll < odds.upgrade + odds.same) {
    // No change
    return {
      success: false,
      newPurity: currentPurity,
      newGrade: currentGrade,
      message: currentRefinement.level > 0 
        ? `➡️ No improvement at refinement +${currentRefinement.level}`
        : '➡️ No change in quality'
    };
  } else {
    // Failure - downgrade with risk-based severity
    const baseLoss = 0.05 + Math.random() * 0.10; // 5-15% base loss
    
    // Apply contamination severity from risk mode
    let loss = baseLoss * config.contaminationSeverity;
    
    // At higher refinement levels, losses are much smaller
    if (currentRefinement.level > 0) {
      loss *= 0.2; // 80% reduction in loss at refinement levels
    }
    
    // At higher purities, losses are proportionally smaller
    if (currentPurity >= 0.95) {
      loss *= 0.3;
    } else if (currentPurity >= 0.85) {
      loss *= 0.5;
    }
    
    let newPurity = Math.max(0.01, currentPurity - loss);
    const newGrade = getQualityGrade(Math.min(newPurity, 1.0));
    const newRefinement = getRefinementLevel(newPurity);
    
    let message = '';
    if (currentRefinement.level > 0 && newRefinement.level < currentRefinement.level) {
      message = `⚠️ Refinement degraded to +${newRefinement.level}!`;
    } else if (newRefinement.level > 0) {
      message = `⬇️ Minor contamination! Still at refinement +${newRefinement.level}`;
    } else if (newGrade.grade !== currentGrade.grade) {
      message = `❌ Contaminated to ${newGrade.name}!`;
    } else {
      message = '⬇️ Quality degraded!';
    }
    
    return {
      success: false,
      newPurity,
      newGrade,
      message
    };
  }
}

// Get quality badge styles for UI
export function getQualityBadgeStyles(grade: QualityInfo): string {
  if (grade.grade === 'QT') {
    return 'bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 text-white font-bold animate-pulse';
  }
  
  return `${grade.bgColor} border ${grade.borderColor}`;
}

// Get quality text color
export function getQualityTextColor(grade: QualityInfo): string {
  return grade.color;
}
