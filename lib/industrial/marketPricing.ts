import { getQualityGrade } from './quality';

// Base prices for materials per unit
export const BASE_PRICES: Record<string, number> = {
  'Iron': 10,
  'Titanium': 25,
  'Silicon': 20,
  'Plasma': 30,
  'Quantum': 100,
  'Dark matter': 150,
};

// Tier multipliers
export const TIER_MULTIPLIERS: Record<number, number> = {
  1: 1.0,
  2: 1.5,
  3: 2.5,
  4: 4.0,
  5: 7.0,
};

export interface MarketPrice {
  buyPrice: number;
  sellPrice: number;
  demandModifier: number;
  supplyModifier: number;
}

/**
 * Calculate market price for a material based on quality
 */
export function calculateMarketPrice(
  materialName: string,
  tier: number,
  purity: number,
  quantity: number = 1
): MarketPrice {
  // Get base price
  const basePrice = BASE_PRICES[materialName] || 10;
  
  // Apply tier multiplier
  const tierMultiplier = TIER_MULTIPLIERS[tier] || 1.0;
  
  // Get quality info
  const qualityInfo = getQualityGrade(purity);
  const qualityMultiplier = qualityInfo.effectiveness;
  
  // Calculate base value
  const baseValue = basePrice * tierMultiplier * qualityMultiplier;
  
  // Apply bulk discounts/premiums
  let bulkModifier = 1.0;
  if (quantity > 1000) {
    bulkModifier = 0.95; // 5% bulk discount
  } else if (quantity > 500) {
    bulkModifier = 0.97; // 3% bulk discount
  } else if (quantity < 10) {
    bulkModifier = 1.1; // 10% premium for small quantities
  }
  
  // Simulate market dynamics
  const demandModifier = 0.9 + Math.random() * 0.4; // 0.9 to 1.3
  const supplyModifier = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
  
  // Calculate final prices
  const buyPrice = Math.round(baseValue * bulkModifier * demandModifier * 1.1); // Market sells at 10% markup
  const sellPrice = Math.round(baseValue * bulkModifier * supplyModifier * 0.85); // Market buys at 15% discount
  
  return {
    buyPrice,
    sellPrice,
    demandModifier,
    supplyModifier
  };
}

/**
 * Get market trend for a material (for UI display)
 */
export function getMarketTrend(demandModifier: number, supplyModifier: number): {
  trend: 'up' | 'down' | 'stable';
  strength: number;
  description: string;
} {
  const ratio = demandModifier / supplyModifier;
  const strength = Math.abs(ratio - 1.0);
  
  if (ratio > 1.1) {
    return {
      trend: 'up',
      strength,
      description: 'High demand, prices rising'
    };
  } else if (ratio < 0.9) {
    return {
      trend: 'down',
      strength,
      description: 'Oversupply, prices falling'
    };
  } else {
    return {
      trend: 'stable',
      strength,
      description: 'Market is stable'
    };
  }
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  if (price >= 1_000_000) {
    return `${(price / 1_000_000).toFixed(1)}M`;
  } else if (price >= 1_000) {
    return `${(price / 1_000).toFixed(1)}K`;
  }
  return price.toString();
}
