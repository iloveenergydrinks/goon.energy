// Component drop system for mining
export interface ComponentDrop {
  id: string;
  name: string;
  emoji: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  baseRate: number;
  minRoom: number;
  minTier: number;
  description: string;
  use: string;
}

// Component definitions (matching the UI)
export const COMPONENT_DEFINITIONS: ComponentDrop[] = [
  // Common
  { id: 'flux_dust', name: 'Flux Dust', emoji: '✨', rarity: 'common', baseRate: 5.0, minRoom: 1, minTier: 2, description: '+5% quality on any craft', use: 'Optional enhancer' },
  { id: 'circuit_fragment', name: 'Circuit Fragment', emoji: '🔌', rarity: 'common', baseRate: 3.0, minRoom: 1, minTier: 2, description: 'Required for electronic modules', use: 'Crafting component' },
  { id: 'alloy_binder', name: 'Alloy Binder', emoji: '🔗', rarity: 'common', baseRate: 4.0, minRoom: 1, minTier: 2, description: 'Reduces quality mismatch penalty', use: 'Optional enhancer' },
  { id: 'cooling_gel', name: 'Cooling Gel', emoji: '❄️', rarity: 'common', baseRate: 3.0, minRoom: 1, minTier: 2, description: 'Required for energy weapons', use: 'Crafting component' },
  
  // Uncommon
  { id: 'power_core', name: 'Power Core', emoji: '⚡', rarity: 'uncommon', baseRate: 2.0, minRoom: 2, minTier: 3, description: 'Required for T2+ weapons and shields', use: 'Required for Tier 2' },
  { id: 'control_matrix', name: 'Control Matrix', emoji: '🎛️', rarity: 'uncommon', baseRate: 1.5, minRoom: 2, minTier: 3, description: 'Required for targeting systems', use: 'Required for Tier 2' },
  { id: 'structural_lattice', name: 'Structural Lattice', emoji: '🏗️', rarity: 'uncommon', baseRate: 2.5, minRoom: 1, minTier: 3, description: 'Required for armor and hull mods', use: 'Required for Tier 2' },
  { id: 'neural_processor', name: 'Neural Processor', emoji: '🧠', rarity: 'uncommon', baseRate: 1.0, minRoom: 3, minTier: 3, description: 'Required for AI modules', use: 'Required for Tier 2' },
  
  // Rare
  { id: 'quantum_processor', name: 'Quantum Processor', emoji: '💎', rarity: 'rare', baseRate: 0.5, minRoom: 3, minTier: 4, description: 'Required for T3+ advanced weapons', use: 'Required for Tier 3' },
  { id: 'zero_point_capacitor', name: 'Zero-Point Capacitor', emoji: '🔮', rarity: 'rare', baseRate: 0.3, minRoom: 4, minTier: 4, description: 'Required for elite shields', use: 'Required for Tier 3' },
  { id: 'graviton_mesh', name: 'Graviton Mesh', emoji: '🌀', rarity: 'rare', baseRate: 0.4, minRoom: 3, minTier: 4, description: 'Required for propulsion systems', use: 'Required for Tier 3' },
  { id: 'plasma_injector', name: 'Plasma Injector', emoji: '💉', rarity: 'rare', baseRate: 0.6, minRoom: 3, minTier: 4, description: 'Damage amplifier component', use: 'Required for Tier 3' },
  
  // Legendary
  { id: 'singularity_core', name: 'Singularity Core', emoji: '🌟', rarity: 'legendary', baseRate: 0.05, minRoom: 5, minTier: 5, description: 'Required for doomsday weapons', use: 'Required for Tier 5' },
  { id: 'chrono_fragment', name: 'Chrono Fragment', emoji: '⏳', rarity: 'legendary', baseRate: 0.03, minRoom: 1, minTier: 2, description: '🎰 LOTTERY ITEM - Can drop anywhere!', use: 'Ultra rare component' },
  { id: 'void_crystal', name: 'Void Crystal', emoji: '🔷', rarity: 'legendary', baseRate: 0.08, minRoom: 4, minTier: 5, description: 'Interdimensional technology', use: 'Required for Tier 5' },
  { id: 'dark_energy_cell', name: 'Dark Energy Cell', emoji: '⚫', rarity: 'legendary', baseRate: 0.04, minRoom: 5, minTier: 5, description: 'Infinite power source', use: 'Required for Tier 5' },
];

// Room multipliers (Room 1-5)
const ROOM_MULTIPLIERS = [0.5, 1.0, 1.5, 2.0, 3.0];

// Map node tier to room (simplified for now)
export function getNodeRoom(nodeTier: number): number {
  // For now, map node tier directly to room
  // T1 = Room 1, T2 = Room 2, etc.
  return Math.min(nodeTier, 5);
}

/**
 * Calculate if a component drops and which ones
 * @param nodeTier The tier of the node being mined
 * @param materialTier The actual tier of material obtained
 * @returns Array of component IDs that dropped
 */
export function calculateComponentDrops(nodeTier: number, materialTier: number): string[] {
  const drops: string[] = [];
  const room = getNodeRoom(nodeTier);
  const roomMultiplier = ROOM_MULTIPLIERS[room - 1];
  const tierBonus = materialTier >= 4 ? 1.5 : 1.0;
  
  // Check each component
  for (const component of COMPONENT_DEFINITIONS) {
    // Skip if requirements not met
    if (component.minRoom > room || component.minTier > materialTier) {
      continue;
    }
    
    // Calculate actual drop chance
    const dropChance = (component.baseRate * roomMultiplier * tierBonus) / 100;
    
    // Roll for drop
    if (Math.random() < dropChance) {
      drops.push(component.id);
    }
  }
  
  return drops;
}

/**
 * Get component details by ID
 */
export function getComponentById(id: string): ComponentDrop | undefined {
  return COMPONENT_DEFINITIONS.find(c => c.id === id);
}

/**
 * Format component drops for display
 */
export function formatComponentDrops(componentIds: string[]): Array<{
  id: string;
  name: string;
  emoji: string;
  rarity: string;
}> {
  return componentIds.map(id => {
    const component = getComponentById(id);
    if (!component) return null;
    return {
      id: component.id,
      name: component.name,
      emoji: component.emoji,
      rarity: component.rarity
    };
  }).filter(Boolean) as any;
}
