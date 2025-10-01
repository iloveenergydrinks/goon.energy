"use client";

import React, { useState } from 'react';
import type { Blueprint, ResearchAggressiveness, ResearchFocus } from '@/types/industrial';
import { calculateResearchRequirement, calculateResearchSuccess } from '@/lib/industrial/calculations';

interface BlueprintResearchProps {
  blueprint: Blueprint;
  onStartResearch: (config: ResearchConfig) => void;
  onCancelResearch: () => void;
  isResearching?: boolean;
}

interface ResearchConfig {
  aggressiveness: ResearchAggressiveness;
  focusAreas: ResearchFocus[];
  materials?: string[]; // Material IDs to consume
}

export function BlueprintResearch({ 
  blueprint, 
  onStartResearch, 
  onCancelResearch,
  isResearching = false 
}: BlueprintResearchProps) {
  const [selectedAggressiveness, setSelectedAggressiveness] = useState<ResearchAggressiveness>('normal');
  const [focusAreas, setFocusAreas] = useState<ResearchFocus[]>([]);
  
  const nextLevelRequirement = calculateResearchRequirement(blueprint.researchLevel);
  const progress = (blueprint.researchPoints / nextLevelRequirement) * 100;
  
  const aggressivenessOptions = {
    safe: { label: 'Safe', success: '95%', speed: '0.5x', color: 'text-green-400' },
    normal: { label: 'Normal', success: '85%', speed: '1.0x', color: 'text-blue-400' },
    aggressive: { label: 'Aggressive', success: '70%', speed: '1.5x', color: 'text-yellow-400' },
    reckless: { label: 'Reckless', success: '50%', speed: '2.0x', color: 'text-red-400' }
  };
  
  // Available stats to focus on based on blueprint type
  const availableStats = {
    hull: ['hp', 'powerCapacity', 'bandwidthLimit', 'resistance'],
    module: ['powerGen', 'capBuffer', 'damage', 'rateOfFire', 'efficiency'],
    primary: ['damage', 'rateOfFire', 'tracking', 'range', 'powerDraw'],
    secondary: ['damage', 'utility', 'defense', 'powerDraw']
  };
  
  const stats = availableStats[blueprint.type] || [];
  
  const handleFocusChange = (stat: string, weight: number) => {
    setFocusAreas(prev => {
      const existing = prev.find(f => f.stat === stat);
      if (existing) {
        if (weight === 0) {
          return prev.filter(f => f.stat !== stat);
        }
        return prev.map(f => f.stat === stat ? { ...f, weight } : f);
      }
      return [...prev, { stat, weight, scalingType: 'linear' as const }];
    });
  };
  
  return (
    <div className="border border-neutral-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">{blueprint.name}</h2>
          <p className="text-sm text-neutral-500 mt-1">
            {blueprint.type.charAt(0).toUpperCase() + blueprint.type.slice(1)} Blueprint
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">Level {blueprint.researchLevel}</div>
          {blueprint.isOriginal && (
            <span className="text-xs text-green-400">Original</span>
          )}
          {blueprint.copyNumber && (
            <span className="text-xs text-yellow-400">Copy #{blueprint.copyNumber}</span>
          )}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-neutral-500">Research Progress</span>
          <span className="text-neutral-300">
            {Math.floor(blueprint.researchPoints)} / {nextLevelRequirement} points
          </span>
        </div>
        <div className="h-3 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {isResearching && blueprint.estimatedCompletion && (
          <p className="text-xs text-neutral-500 mt-2">
            Estimated completion: {new Date(blueprint.estimatedCompletion).toLocaleString()}
          </p>
        )}
      </div>
      
      {/* Current Stats */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-neutral-300 mb-3">Current Improvements</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(blueprint.statImprovements).map(([stat, improvement]) => (
            <div key={stat} className="bg-neutral-900 rounded p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400 capitalize">
                  {stat.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="text-sm font-medium text-green-400">
                  +{improvement.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
          <div className="bg-neutral-900 rounded p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">Material Efficiency</span>
              <span className="text-sm font-medium text-blue-400">
                {((1 - blueprint.materialEfficiency) * 100).toFixed(0)}% saved
              </span>
            </div>
          </div>
          <div className="bg-neutral-900 rounded p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">Production Speed</span>
              <span className="text-sm font-medium text-purple-400">
                {(1 / blueprint.productionTimeModifier).toFixed(1)}x
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Research Configuration */}
      {!isResearching ? (
        <>
          {/* Aggressiveness Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-neutral-300 mb-3">Research Aggressiveness</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(aggressivenessOptions).map(([key, option]) => (
                <button
                  key={key}
                  onClick={() => setSelectedAggressiveness(key as ResearchAggressiveness)}
                  className={`
                    p-3 rounded-lg border transition-all
                    ${selectedAggressiveness === key 
                      ? 'border-white bg-neutral-900' 
                      : 'border-neutral-700 hover:border-neutral-600'
                    }
                  `}
                >
                  <div className={`font-medium ${option.color}`}>{option.label}</div>
                  <div className="flex items-center justify-between mt-1 text-xs text-neutral-500">
                    <span>Success: {option.success}</span>
                    <span>Speed: {option.speed}</span>
                  </div>
                </button>
              ))}
            </div>
            {blueprint.consecutiveFailures > 0 && (
              <p className="text-xs text-red-400 mt-2">
                ⚠️ {blueprint.consecutiveFailures} consecutive failures - success chance reduced
              </p>
            )}
          </div>
          
          {/* Focus Areas */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-neutral-300 mb-3">Research Focus</h3>
            <div className="space-y-2">
              {stats.map(stat => {
                const focus = focusAreas.find(f => f.stat === stat);
                const weight = focus?.weight || 0;
                
                return (
                  <div key={stat} className="flex items-center gap-3">
                    <span className="text-xs text-neutral-400 w-24 capitalize">
                      {stat.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={weight * 100}
                      onChange={(e) => handleFocusChange(stat, parseInt(e.target.value) / 100)}
                      className="flex-1"
                    />
                    <span className="text-xs text-neutral-300 w-10 text-right">
                      {Math.round(weight * 100)}%
                    </span>
                  </div>
                );
              })}
            </div>
            {focusAreas.length === 0 && (
              <p className="text-xs text-neutral-500 mt-2">
                Select focus areas to guide research improvements
              </p>
            )}
          </div>
          
          {/* Industrial Espionage Risk */}
          {blueprint.isShared && (
            <div className="mb-6 p-3 bg-red-900/20 border border-red-800 rounded-lg">
              <h3 className="text-sm font-semibold text-red-400 mb-2">Security Warning</h3>
              <p className="text-xs text-neutral-400">
                This blueprint is shared with {blueprint.sharedWith.length} other player(s).
                Security Level: {blueprint.securityLevel}%
              </p>
              <p className="text-xs text-red-300 mt-1">
                Risk of industrial espionage during research: {100 - blueprint.securityLevel}%
              </p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => onStartResearch({
                aggressiveness: selectedAggressiveness,
                focusAreas,
                materials: [] // Would be selected in a more complete UI
              })}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Start Research
            </button>
            {blueprint.isOriginal && (
              <button
                className="px-4 py-2 border border-neutral-700 hover:border-neutral-600 rounded-lg transition-colors text-neutral-300"
              >
                Create Copy
              </button>
            )}
          </div>
        </>
      ) : (
        /* Research in Progress */
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mb-4">
            <svg className="w-8 h-8 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Research in Progress</h3>
          <p className="text-sm text-neutral-400 mb-4">
            Blueprint is in stasis and cannot be used for production
          </p>
          <button
            onClick={onCancelResearch}
            className="px-4 py-2 border border-red-600 hover:bg-red-600/20 text-red-400 rounded-lg transition-colors"
          >
            Cancel Research
          </button>
        </div>
      )}
    </div>
  );
}

// Blueprint List Component
interface BlueprintListProps {
  blueprints: Blueprint[];
  onSelectBlueprint: (blueprint: Blueprint) => void;
  selectedId?: string;
}

export function BlueprintList({ blueprints, onSelectBlueprint, selectedId }: BlueprintListProps) {
  const typeIcons = {
    hull: '🚀',
    module: '⚙️',
    primary: '⚔️',
    secondary: '🛡️'
  };
  
  return (
    <div className="space-y-2">
      {blueprints.map(blueprint => {
        const isSelected = blueprint.id === selectedId;
        const totalImprovement = Object.values(blueprint.statImprovements)
          .reduce((sum, val) => sum + val, 0);
        
        return (
          <button
            key={blueprint.id}
            onClick={() => onSelectBlueprint(blueprint)}
            className={`
              w-full p-3 rounded-lg border text-left transition-all
              ${isSelected 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-neutral-800 hover:border-neutral-700'
              }
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{typeIcons[blueprint.type]}</span>
                <div>
                  <div className="text-sm font-medium text-white">{blueprint.name}</div>
                  <div className="text-xs text-neutral-500">
                    Level {blueprint.researchLevel} • +{totalImprovement.toFixed(0)}% total
                  </div>
                </div>
              </div>
              <div className="text-right">
                {blueprint.inResearch && (
                  <span className="text-xs text-yellow-400">Researching</span>
                )}
                {blueprint.isShared && (
                  <span className="text-xs text-red-400">Shared</span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}









