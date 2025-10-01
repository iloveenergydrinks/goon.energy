'use client';

import React from 'react';

interface InventoryCardProps {
  module: any;
}

export function InventoryCard({ module }: InventoryCardProps) {
  // Try to get a better name from the blueprint or module
  const getModuleName = () => {
    // Check if we have blueprint info stored
    if (module.blueprintName) return module.blueprintName;
    
    // Try to parse from stats
    if (module.stats) {
      const stats = module.stats as any;
      if (stats.shieldHP) return 'Shield Generator';
      if (stats.damage) return stats.fireRate > 1.5 ? 'Pulse Laser' : 'Plasma Cannon';
      if (stats.cargoBonus) return 'Cargo Expander';
      if (stats.speedBonus) return 'Afterburner';
    }
    
    // Fallback to module family name
    return module.module?.familyName || 'Unknown Module';
  };
  
  const getSlotInfo = () => {
    const slot = module.module?.slot || 'Unknown';
    const size = module.module?.size || module.module?.shape?.length || '?';
    return `${slot} Slot • Size ${size}`;
  };
  
  const getQualityColor = (quality: number) => {
    if (quality >= 1.2) return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
    if (quality >= 1.0) return 'bg-green-500/20 text-green-400 border-green-500/50';
    if (quality >= 0.8) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    return 'bg-red-500/20 text-red-400 border-red-500/50';
  };
  
  const formatStatName = (stat: string) => {
    // Convert camelCase to Title Case
    return stat
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };
  
  const formatStatValue = (value: any) => {
    if (typeof value === 'object') {
      // Handle complex stats like resistances
      return Object.entries(value)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
    }
    return value;
  };
  
  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 hover:border-neutral-600 transition-colors">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="font-semibold text-white">
          {getModuleName()}
        </div>
        <div className={`text-xs px-2 py-1 rounded border ${getQualityColor(module.quality)}`}>
          {Math.round(module.quality * 100)}%
        </div>
      </div>
      
      {/* Slot Info */}
      <div className="text-xs text-neutral-500 mb-3">
        {getSlotInfo()}
      </div>
      
      {/* Stats */}
      <div className="space-y-1">
        {Object.entries(module.stats as any).map(([stat, value]) => (
          <div key={stat} className="flex justify-between text-sm">
            <span className="text-neutral-400">
              {formatStatName(stat)}:
            </span>
            <span className="font-mono text-white">
              {formatStatValue(value)}
            </span>
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-neutral-800 flex justify-between items-center">
        <div className="text-xs text-neutral-500">
          Crafted {new Date(module.createdAt).toLocaleDateString()}
        </div>
        {module.equipped && (
          <div className="text-xs text-green-400">
            ✓ Equipped
          </div>
        )}
      </div>
    </div>
  );
}
