'use client';

import React from 'react';

interface InventoryCardProps {
  module: any;
  onDelete?: (moduleId: string) => void;
}

export function InventoryCard({ module, onDelete }: InventoryCardProps) {
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
  
  const qualityPercent = Math.round(module.quality * 100);
  
  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 hover:border-neutral-600 transition-colors">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="font-semibold text-white">
          {getModuleName()}
        </div>
        <div className={`text-xs px-2 py-1 rounded border ${
          qualityPercent >= 120 ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' :
          qualityPercent >= 100 ? 'bg-green-500/20 text-green-400 border-green-500/50' :
          qualityPercent >= 90 ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' :
          'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
        }`}>
          {qualityPercent}%
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
        <div className="flex items-center gap-2">
          {module.equipped && (
            <div className="text-xs text-green-400">
              ✓ Equipped
            </div>
          )}
          {onDelete && !module.equipped && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Destroy ${getModuleName()}?`)) {
                  onDelete(module.id);
                }
              }}
              className="text-xs px-2 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded border border-red-500/50 transition-colors"
            >
              🗑️ Destroy
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
