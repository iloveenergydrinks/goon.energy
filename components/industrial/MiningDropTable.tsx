'use client';

import { useState } from 'react';

// Define component drops with their base rates
const COMPONENT_DROPS = {
  common: [
    { id: 'flux_dust', name: 'Flux Dust', emoji: '✨', baseRate: 5.0, minRoom: 1, minTier: 2, description: '+5% quality on any craft', use: 'Optional enhancer' },
    { id: 'circuit_fragment', name: 'Circuit Fragment', emoji: '🔌', baseRate: 3.0, minRoom: 1, minTier: 2, description: 'Required for electronic modules', use: 'Crafting component' },
    { id: 'alloy_binder', name: 'Alloy Binder', emoji: '🔗', baseRate: 4.0, minRoom: 1, minTier: 2, description: 'Reduces quality mismatch penalty', use: 'Optional enhancer' },
    { id: 'cooling_gel', name: 'Cooling Gel', emoji: '❄️', baseRate: 3.0, minRoom: 1, minTier: 2, description: 'Required for energy weapons', use: 'Crafting component' },
  ],
  uncommon: [
    { id: 'power_core', name: 'Power Core', emoji: '⚡', baseRate: 2.0, minRoom: 2, minTier: 3, description: 'Required for T2+ weapons and shields', use: 'Required for Tier 2' },
    { id: 'control_matrix', name: 'Control Matrix', emoji: '🎛️', baseRate: 1.5, minRoom: 2, minTier: 3, description: 'Required for targeting systems', use: 'Required for Tier 2' },
    { id: 'structural_lattice', name: 'Structural Lattice', emoji: '🏗️', baseRate: 2.5, minRoom: 1, minTier: 3, description: 'Required for armor and hull mods', use: 'Required for Tier 2' },
    { id: 'neural_processor', name: 'Neural Processor', emoji: '🧠', baseRate: 1.0, minRoom: 3, minTier: 3, description: 'Required for AI modules', use: 'Required for Tier 2' },
  ],
  rare: [
    { id: 'quantum_processor', name: 'Quantum Processor', emoji: '💎', baseRate: 0.5, minRoom: 3, minTier: 4, description: 'Required for T3+ advanced weapons', use: 'Required for Tier 3' },
    { id: 'zero_point_capacitor', name: 'Zero-Point Capacitor', emoji: '🔮', baseRate: 0.3, minRoom: 4, minTier: 4, description: 'Required for elite shields', use: 'Required for Tier 3' },
    { id: 'graviton_mesh', name: 'Graviton Mesh', emoji: '🌀', baseRate: 0.4, minRoom: 3, minTier: 4, description: 'Required for propulsion systems', use: 'Required for Tier 3' },
    { id: 'plasma_injector', name: 'Plasma Injector', emoji: '💉', baseRate: 0.6, minRoom: 3, minTier: 4, description: 'Damage amplifier component', use: 'Required for Tier 3' },
  ],
  legendary: [
    { id: 'singularity_core', name: 'Singularity Core', emoji: '🌟', baseRate: 0.05, minRoom: 5, minTier: 5, description: 'Required for doomsday weapons', use: 'Required for Tier 5' },
    { id: 'chrono_fragment', name: 'Chrono Fragment', emoji: '⏳', baseRate: 0.03, minRoom: 1, minTier: 2, description: '🎰 LOTTERY ITEM - Can drop anywhere!', use: 'Ultra rare component' },
    { id: 'void_crystal', name: 'Void Crystal', emoji: '🔷', baseRate: 0.08, minRoom: 4, minTier: 5, description: 'Interdimensional technology', use: 'Required for Tier 5' },
    { id: 'dark_energy_cell', name: 'Dark Energy Cell', emoji: '⚫', baseRate: 0.04, minRoom: 5, minTier: 5, description: 'Infinite power source', use: 'Required for Tier 5' },
  ]
};

const ROOM_NAMES = ['Safe Zone', 'Industrial', 'Contested', 'Deep Core', 'Quantum'];
const ROOM_MULTIPLIERS = [0.5, 1.0, 1.5, 2.0, 3.0]; // Room 1-5 multipliers

const TIER_COLORS = {
  1: 'text-gray-400',
  2: 'text-green-400', 
  3: 'text-blue-400',
  4: 'text-purple-400',
  5: 'text-orange-400'
};

const RARITY_COLORS = {
  common: 'bg-gray-600',
  uncommon: 'bg-green-600',
  rare: 'bg-blue-600',
  legendary: 'bg-purple-600'
};

const RARITY_EMOJI = {
  common: '⚪',
  uncommon: '🟢',
  rare: '🔵',
  legendary: '🟣'
};

export function MiningDropTable() {
  const [selectedRoom, setSelectedRoom] = useState(1);
  const [selectedTier, setSelectedTier] = useState(1);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  
  const calculateDropChance = (component: any) => {
    // Check if component can drop in this room/tier
    if (component.minRoom > selectedRoom || component.minTier > selectedTier) {
      return 0;
    }
    
    // Calculate actual drop chance
    const roomMultiplier = ROOM_MULTIPLIERS[selectedRoom - 1];
    const tierBonus = selectedTier >= 4 ? 1.5 : 1.0;
    
    return component.baseRate * roomMultiplier * tierBonus;
  };
  
  const formatDropChance = (chance: number) => {
    if (chance === 0) return { text: 'Cannot Drop', subtext: 'Requirements not met' };
    if (chance < 0.01) return { text: '🎰 ULTRA RARE', subtext: `1 in ${Math.round(100/chance).toLocaleString()}` };
    if (chance < 0.1) return { text: 'Very Rare', subtext: `1 in ${Math.round(100/chance).toLocaleString()}` };
    if (chance < 1) return { text: 'Rare', subtext: `${chance.toFixed(2)}% chance` };
    if (chance < 5) return { text: 'Uncommon', subtext: `${chance.toFixed(1)}% chance` };
    return { text: 'Common', subtext: `${chance.toFixed(1)}% chance` };
  };
  
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-purple-400 mb-2 flex items-center gap-2">
          💎 Component Drop System
        </h3>
        <p className="text-sm text-neutral-400">
          Special components can drop when mining! Higher rooms and better materials = better drops.
          Some components are <span className="text-yellow-400 font-semibold">REQUIRED</span> to craft advanced items.
        </p>
      </div>
      
      {/* Scenario Selector */}
      <div className="bg-neutral-800 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-bold text-yellow-400 mb-3">📍 Select Your Mining Scenario:</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-neutral-400 uppercase tracking-wider block mb-2">Where are you mining?</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(room => (
                <button
                  key={room}
                  onClick={() => setSelectedRoom(room)}
                  className={`flex-1 px-2 py-3 rounded text-xs flex flex-col items-center transition-all ${
                    selectedRoom === room 
                      ? 'bg-blue-600 text-white shadow-lg scale-105' 
                      : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                  }`}
                >
                  <span className="font-bold text-lg">{room}</span>
                  <span className="mt-1">{ROOM_NAMES[room - 1]}</span>
                  <span className="text-xs mt-1 opacity-75">×{ROOM_MULTIPLIERS[room - 1]} drops</span>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-xs text-neutral-400 uppercase tracking-wider block mb-2">What material tier are you mining?</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(tier => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`flex-1 px-2 py-3 rounded text-xs flex flex-col items-center transition-all ${
                    selectedTier === tier 
                      ? 'bg-purple-600 text-white shadow-lg scale-105' 
                      : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                  }`}
                >
                  <span className={`font-bold text-lg ${TIER_COLORS[tier as keyof typeof TIER_COLORS]}`}>T{tier}</span>
                  <span className="mt-1">
                    {tier === 1 ? 'Basic' : 
                     tier === 2 ? 'Common' : 
                     tier === 3 ? 'Advanced' : 
                     tier === 4 ? 'Elite' : 'Legendary'}
                  </span>
                  {tier >= 4 && <span className="text-xs mt-1 text-yellow-300">+50% bonus</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-neutral-900 rounded flex items-center justify-between">
          <div className="text-sm">
            <span className="text-neutral-400">Current Scenario: </span>
            <span className="text-white font-bold">{ROOM_NAMES[selectedRoom - 1]} (Room {selectedRoom})</span>
            <span className="text-neutral-400"> mining </span>
            <span className={`font-bold ${TIER_COLORS[selectedTier as keyof typeof TIER_COLORS]}`}>Tier {selectedTier}</span>
            <span className="text-neutral-400"> materials</span>
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-400">
            <input
              type="checkbox"
              checked={showOnlyAvailable}
              onChange={(e) => setShowOnlyAvailable(e.target.checked)}
              className="rounded"
            />
            Hide locked items
          </label>
        </div>
      </div>
      
      {/* Drop Table */}
      <div className="space-y-4">
        {Object.entries(COMPONENT_DROPS).map(([rarity, components]) => {
          const availableComponents = showOnlyAvailable 
            ? components.filter(c => calculateDropChance(c) > 0)
            : components;
            
          if (availableComponents.length === 0) return null;
          
          return (
            <div key={rarity} className="border border-neutral-700 rounded-lg overflow-hidden">
              <div className={`${RARITY_COLORS[rarity as keyof typeof RARITY_COLORS]} px-4 py-2 flex items-center justify-between`}>
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <span className="text-lg">{RARITY_EMOJI[rarity as keyof typeof RARITY_EMOJI]}</span>
                  {rarity.toUpperCase()} DROPS
                </h4>
                <span className="text-xs opacity-75">
                  {availableComponents.filter(c => calculateDropChance(c) > 0).length}/{availableComponents.length} available
                </span>
              </div>
              
              <div className="p-3 space-y-2">
                {availableComponents.map(component => {
                  const dropChance = calculateDropChance(component);
                  const canDrop = dropChance > 0;
                  const dropInfo = formatDropChance(dropChance);
                  
                  return (
                    <div 
                      key={component.id}
                      className={`p-3 rounded-lg transition-all ${
                        canDrop 
                          ? 'bg-neutral-800 hover:bg-neutral-750 border border-neutral-700' 
                          : 'bg-neutral-900/50 opacity-60 border border-neutral-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">{component.emoji}</span>
                            <div>
                              <span className={`font-medium ${canDrop ? 'text-white' : 'text-neutral-500'}`}>
                                {component.name}
                              </span>
                              {component.id === 'chrono_fragment' && (
                                <span className="ml-2 text-xs bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded animate-pulse">
                                  🎰 LOTTERY
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-neutral-400 ml-10">{component.description}</p>
                          <div className="flex items-center gap-3 mt-2 ml-10">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              component.use.includes('Required') 
                                ? 'bg-red-900/30 text-red-400 border border-red-800' 
                                : 'bg-neutral-700 text-neutral-300'
                            }`}>
                              {component.use}
                            </span>
                            {!canDrop && (
                              <span className="text-xs text-orange-400">
                                🔒 Needs Room {component.minRoom}+ & T{component.minTier}+ materials
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-sm font-bold ${
                            dropChance === 0 ? 'text-neutral-600' :
                            dropChance < 0.1 ? 'text-purple-400 animate-pulse' :
                            dropChance < 1 ? 'text-yellow-400' :
                            dropChance < 5 ? 'text-green-400' :
                            'text-white'
                          }`}>
                            {dropInfo.text}
                          </div>
                          <div className="text-xs text-neutral-500 mt-1">
                            {dropInfo.subtext}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Summary Stats */}
      <div className="mt-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-800/30 rounded-lg p-4">
        <h4 className="text-sm font-bold text-yellow-400 mb-3 flex items-center gap-2">
          📊 Drop Analysis for Your Scenario
        </h4>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-neutral-900/50 rounded p-3">
            <div className="text-xs text-neutral-400 mb-1">Any Component Drop Chance</div>
            <div className="text-2xl font-bold text-green-400">
              {Object.values(COMPONENT_DROPS).flat()
                .reduce((sum, c) => sum + calculateDropChance(c), 0)
                .toFixed(1)}%
            </div>
            <div className="text-xs text-neutral-500 mt-1">per mining action</div>
          </div>
          
          <div className="bg-neutral-900/50 rounded p-3">
            <div className="text-xs text-neutral-400 mb-1">Unlocked Components</div>
            <div className="text-2xl font-bold text-blue-400">
              {Object.values(COMPONENT_DROPS).flat()
                .filter(c => calculateDropChance(c) > 0).length}
              <span className="text-lg text-neutral-500">/{Object.values(COMPONENT_DROPS).flat().length}</span>
            </div>
            <div className="text-xs text-neutral-500 mt-1">available in this scenario</div>
          </div>
          
          <div className="bg-neutral-900/50 rounded p-3">
            <div className="text-xs text-neutral-400 mb-1">Best Drop Available</div>
            <div className="text-lg font-bold text-purple-400">
              {(() => {
                const best = Object.values(COMPONENT_DROPS).flat()
                  .filter(c => calculateDropChance(c) > 0)
                  .sort((a, b) => {
                    const rarityOrder = { legendary: 4, rare: 3, uncommon: 2, common: 1 };
                    const aRarity = Object.entries(COMPONENT_DROPS).find(([_, comps]) => comps.includes(a))?.[0] || 'common';
                    const bRarity = Object.entries(COMPONENT_DROPS).find(([_, comps]) => comps.includes(b))?.[0] || 'common';
                    return (rarityOrder[bRarity as keyof typeof rarityOrder] || 0) - (rarityOrder[aRarity as keyof typeof rarityOrder] || 0);
                  })[0];
                return best ? `${best.emoji} ${best.name}` : 'None';
              })()}
            </div>
            <div className="text-xs text-neutral-500 mt-1">highest rarity available</div>
          </div>
        </div>
        
        <div className="mt-3 p-2 bg-neutral-800/50 rounded text-xs text-neutral-400">
          💡 <span className="text-yellow-400">Pro Tip:</span> 
          {selectedRoom < 3 
            ? " Move to higher rooms for better component drops and rare materials!" 
            : selectedTier < 3 
            ? " Try mining higher tier materials for access to advanced components!"
            : selectedRoom === 5 && selectedTier === 5
            ? " You're in the best possible scenario! All components can drop here."
            : " Great spot! Consider Room 5 + T5 materials for maximum drop rates."}
        </div>
      </div>
    </div>
  );
}
