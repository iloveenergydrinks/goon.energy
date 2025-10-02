'use client';

import { useState } from 'react';

// Define component drops with their base rates
const COMPONENT_DROPS = {
  common: [
    { id: 'flux_dust', name: 'Flux Dust', baseRate: 5.0, minRoom: 1, minTier: 2, description: '+5% quality on any craft' },
    { id: 'circuit_fragment', name: 'Circuit Fragment', baseRate: 3.0, minRoom: 1, minTier: 2, description: 'Required for electronic modules' },
    { id: 'alloy_binder', name: 'Alloy Binder', baseRate: 4.0, minRoom: 1, minTier: 2, description: 'Reduces quality mismatch penalty' },
    { id: 'cooling_gel', name: 'Cooling Gel', baseRate: 3.0, minRoom: 1, minTier: 2, description: 'Required for energy weapons' },
  ],
  uncommon: [
    { id: 'power_core', name: 'Power Core', baseRate: 2.0, minRoom: 2, minTier: 3, description: 'Required for T2+ weapons and shields' },
    { id: 'control_matrix', name: 'Control Matrix', baseRate: 1.5, minRoom: 2, minTier: 3, description: 'Required for targeting systems' },
    { id: 'structural_lattice', name: 'Structural Lattice', baseRate: 2.5, minRoom: 1, minTier: 3, description: 'Required for armor and hull mods' },
    { id: 'neural_processor', name: 'Neural Processor', baseRate: 1.0, minRoom: 3, minTier: 3, description: 'Required for AI modules' },
  ],
  rare: [
    { id: 'quantum_processor', name: 'Quantum Processor', baseRate: 0.5, minRoom: 3, minTier: 4, description: 'Required for T3+ advanced weapons' },
    { id: 'zero_point_capacitor', name: 'Zero-Point Capacitor', baseRate: 0.3, minRoom: 4, minTier: 4, description: 'Required for elite shields' },
    { id: 'graviton_mesh', name: 'Graviton Mesh', baseRate: 0.4, minRoom: 3, minTier: 4, description: 'Required for propulsion systems' },
    { id: 'plasma_injector', name: 'Plasma Injector', baseRate: 0.6, minRoom: 3, minTier: 4, description: 'Damage amplifier component' },
  ],
  legendary: [
    { id: 'singularity_core', name: 'Singularity Core', baseRate: 0.05, minRoom: 5, minTier: 5, description: 'Required for doomsday weapons' },
    { id: 'chrono_fragment', name: 'Chrono Fragment', baseRate: 0.03, minRoom: 1, minTier: 2, description: 'Can drop anywhere! Time-based modules' },
    { id: 'void_crystal', name: 'Void Crystal', baseRate: 0.08, minRoom: 4, minTier: 5, description: 'Interdimensional technology' },
    { id: 'dark_energy_cell', name: 'Dark Energy Cell', baseRate: 0.04, minRoom: 5, minTier: 5, description: 'Infinite power source' },
  ]
};

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
    if (chance === 0) return 'Cannot Drop';
    if (chance < 0.01) return `${(chance * 10000).toFixed(0)} in 1M`;
    if (chance < 0.1) return `${(chance * 1000).toFixed(0)} in 100k`;
    if (chance < 1) return `${(chance * 100).toFixed(1)} in 10k`;
    return `${chance.toFixed(2)}%`;
  };
  
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-purple-400 mb-4 flex items-center gap-2">
        💎 Mining Drop Table
      </h3>
      
      {/* Controls */}
      <div className="flex gap-4 mb-6">
        <div>
          <label className="text-sm text-neutral-400 block mb-1">Room Level</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(room => (
              <button
                key={room}
                onClick={() => setSelectedRoom(room)}
                className={`px-3 py-1 rounded text-sm ${
                  selectedRoom === room 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                Room {room}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="text-sm text-neutral-400 block mb-1">Material Tier</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(tier => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-3 py-1 rounded text-sm ${
                  selectedTier === tier 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                <span className={TIER_COLORS[tier as keyof typeof TIER_COLORS]}>T{tier}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-neutral-400">
            <input
              type="checkbox"
              checked={showOnlyAvailable}
              onChange={(e) => setShowOnlyAvailable(e.target.checked)}
              className="rounded"
            />
            Show only available drops
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
            <div key={rarity} className="border border-neutral-700 rounded-lg p-4">
              <h4 className={`text-sm font-bold mb-3 ${RARITY_COLORS[rarity as keyof typeof RARITY_COLORS]} inline-block px-2 py-1 rounded`}>
                {rarity.toUpperCase()} COMPONENTS
              </h4>
              
              <div className="space-y-2">
                {availableComponents.map(component => {
                  const dropChance = calculateDropChance(component);
                  const canDrop = dropChance > 0;
                  
                  return (
                    <div 
                      key={component.id}
                      className={`flex items-center justify-between p-2 rounded ${
                        canDrop ? 'bg-neutral-800' : 'bg-neutral-900 opacity-50'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${canDrop ? 'text-white' : 'text-neutral-500'}`}>
                            {component.name}
                          </span>
                          {!canDrop && (
                            <span className="text-xs text-red-400">
                              (Requires Room {component.minRoom}+ / T{component.minTier}+)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 mt-1">{component.description}</p>
                      </div>
                      
                      <div className="text-right ml-4">
                        <div className={`text-sm font-bold ${
                          dropChance === 0 ? 'text-neutral-600' :
                          dropChance < 0.1 ? 'text-red-400' :
                          dropChance < 1 ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          {formatDropChance(dropChance)}
                        </div>
                        <div className="text-xs text-neutral-500">
                          Base: {component.baseRate}%
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
      <div className="mt-6 p-4 bg-neutral-800 rounded-lg">
        <h4 className="text-sm font-bold text-yellow-400 mb-2">Drop Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-neutral-400">Room {selectedRoom} Multiplier:</span>
            <span className="text-white ml-2">{ROOM_MULTIPLIERS[selectedRoom - 1]}x</span>
          </div>
          <div>
            <span className="text-neutral-400">Tier Bonus:</span>
            <span className="text-white ml-2">{selectedTier >= 4 ? '1.5x' : '1.0x'}</span>
          </div>
          <div>
            <span className="text-neutral-400">Total Component Chance:</span>
            <span className="text-green-400 ml-2 font-bold">
              {Object.values(COMPONENT_DROPS).flat()
                .reduce((sum, c) => sum + calculateDropChance(c), 0)
                .toFixed(2)}%
            </span>
          </div>
          <div>
            <span className="text-neutral-400">Available Components:</span>
            <span className="text-white ml-2">
              {Object.values(COMPONENT_DROPS).flat()
                .filter(c => calculateDropChance(c) > 0).length} / {Object.values(COMPONENT_DROPS).flat().length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
