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
  
  // Calculate average quality from stats vs base (rough estimate)
  const stats = module.stats as any;
  const baseStats = { shieldHP: 100, armor: 100, damage: 50, rechargeRate: 5, powerDraw: 10 }; // Rough bases
  let totalRatio = 0;
  let statCount = 0;
  
  Object.entries(stats).forEach(([key, value]) => {
    if (typeof value === 'number' && baseStats[key as keyof typeof baseStats]) {
      const ratio = value / baseStats[key as keyof typeof baseStats];
      totalRatio += ratio;
      statCount++;
    }
  });
  
  const avgMultiplier = statCount > 0 ? totalRatio / statCount : 1.0;
  let overallGrade = 'C';
  let gradeColor = 'text-green-400';
  
  if (avgMultiplier >= 2.5) { overallGrade = 'S'; gradeColor = 'text-yellow-400'; }
  else if (avgMultiplier >= 2.0) { overallGrade = 'A'; gradeColor = 'text-purple-400'; }
  else if (avgMultiplier >= 1.5) { overallGrade = 'B'; gradeColor = 'text-blue-400'; }
  else if (avgMultiplier >= 1.0) { overallGrade = 'C'; gradeColor = 'text-green-400'; }
  else if (avgMultiplier >= 0.8) { overallGrade = 'D'; gradeColor = 'text-yellow-600'; }
  else { overallGrade = 'F'; gradeColor = 'text-red-400'; }
  
  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 hover:border-neutral-600 transition-colors">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="font-semibold text-white">
          {getModuleName()}
        </div>
        <div className={`text-xs px-2 py-1 border font-black ${gradeColor} ${
          overallGrade === 'S' ? 'border-yellow-600' :
          overallGrade === 'A' ? 'border-purple-600' :
          overallGrade === 'B' ? 'border-blue-600' :
          overallGrade === 'C' ? 'border-green-600' :
          'border-neutral-700'
        }`}>
          GRADE {overallGrade}
        </div>
      </div>
      
      {/* Slot Info */}
      <div className="text-xs text-neutral-500 mb-3">
        {getSlotInfo()}
      </div>
      
      {/* Stats with quality bars */}
      <div className="space-y-2">
        {Object.entries(module.stats as any).map(([stat, value]) => {
          if (stat === 'blueprintName') return null;
          const baseValue = baseStats[stat as keyof typeof baseStats] || 50;
          const ratio = typeof value === 'number' ? value / baseValue : 1;
          const barWidth = Math.min(100, ratio * 50); // Cap at 200% for bar
          
          return (
            <div key={stat} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400 text-xs uppercase">
                  {formatStatName(stat)}:
                </span>
                <span className="font-mono text-white font-bold">
                  {formatStatValue(value)}
                </span>
              </div>
              {/* Quality bar */}
              <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    ratio >= 2.5 ? 'bg-yellow-500' :
                    ratio >= 2.0 ? 'bg-purple-500' :
                    ratio >= 1.5 ? 'bg-blue-500' :
                    ratio >= 1.0 ? 'bg-green-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
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
