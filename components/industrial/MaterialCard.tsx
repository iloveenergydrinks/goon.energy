"use client";

import React from 'react';
import type { Material } from '@/types/industrial';
import { getTierColor, getMaterialGrade, formatIndustrialNumber } from '@/lib/industrial/calculations';

interface MaterialCardProps {
  material: Material;
  selected?: boolean;
  onSelect?: (material: Material) => void;
  showDetails?: boolean;
}

export function MaterialCard({ material, selected, onSelect, showDetails = false }: MaterialCardProps) {
  const tierColor = getTierColor(material.tier);
  const grade = getMaterialGrade(material.purity);
  
  // Calculate attribute percentages for display
  const attributePercentages = Object.entries(material.attributes).map(([key, value]) => ({
    name: key,
    value: Math.round(value * 100),
    display: `${Math.round(value * 100)}%`
  }));
  
  return (
    <div
      className={`
        border rounded-lg p-4 transition-all cursor-pointer
        ${selected 
          ? 'border-2 shadow-lg' 
          : 'border hover:border-neutral-600'
        }
      `}
      style={{
        borderColor: selected ? tierColor : undefined,
        boxShadow: selected ? `0 0 20px ${tierColor}40` : undefined
      }}
      onClick={() => onSelect?.(material)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{material.name}</h3>
          <p className="text-xs text-neutral-500 mt-0.5">{material.category}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Tier Badge */}
          <div
            className="px-2 py-1 rounded-md text-xs font-bold"
            style={{
              backgroundColor: `${tierColor}20`,
              color: tierColor,
              border: `1px solid ${tierColor}60`
            }}
          >
            T{material.tier}
          </div>
          {/* Grade Badge */}
          <div
            className={`
              px-2 py-1 rounded-md text-xs font-bold
              ${grade === 'S' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/60' :
                grade === 'A' ? 'bg-purple-500/20 text-purple-400 border-purple-500/60' :
                grade === 'B' ? 'bg-blue-500/20 text-blue-400 border-blue-500/60' :
                grade === 'C' ? 'bg-green-500/20 text-green-400 border-green-500/60' :
                'bg-neutral-700/50 text-neutral-400 border-neutral-600'
              }
              border
            `}
          >
            {grade}
          </div>
        </div>
      </div>
      
      {/* Purity Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-neutral-500">Purity</span>
          <span className="text-neutral-300">{(material.purity * 100).toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${material.purity * 100}%`,
              backgroundColor: tierColor
            }}
          />
        </div>
      </div>
      
      {/* Quantity */}
      <div className="flex items-center justify-between text-xs mb-3">
        <span className="text-neutral-500">Quantity</span>
        <span className="text-neutral-200 font-medium">
          {formatIndustrialNumber(material.quantity)} units
        </span>
      </div>
      
      {/* Attributes Grid */}
      {showDetails && (
        <div className="border-t border-neutral-800 pt-3">
          <p className="text-xs text-neutral-500 mb-2 uppercase tracking-wider">Attributes</p>
          <div className="grid grid-cols-2 gap-2">
            {attributePercentages.map(attr => (
              <div key={attr.name} className="flex items-center justify-between">
                <span className="text-xs text-neutral-400 capitalize">
                  {attr.name.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className={`text-xs font-medium ${
                  attr.value >= 80 ? 'text-green-400' :
                  attr.value >= 60 ? 'text-blue-400' :
                  attr.value >= 40 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {attr.display}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Rarity Indicator */}
      <div className="mt-3 pt-3 border-t border-neutral-800 flex items-center justify-between">
        <span className="text-xs text-neutral-500">Rarity</span>
        <span className={`text-xs font-medium ${
          material.rarity === 'Legendary' ? 'text-orange-400' :
          material.rarity === 'Epic' ? 'text-purple-400' :
          material.rarity === 'Rare' ? 'text-blue-400' :
          material.rarity === 'Uncommon' ? 'text-green-400' :
          'text-neutral-400'
        }`}>
          {material.rarity}
        </span>
      </div>
      
      {/* Base Value */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-neutral-500">Base Value</span>
        <span className="text-xs text-amber-400 font-medium">
          {formatIndustrialNumber(material.baseValue)} ORE
        </span>
      </div>
    </div>
  );
}

// Material Comparison Component
interface MaterialComparisonProps {
  materials: Material[];
  requirements?: {
    attribute: keyof Material['attributes'];
    minValue: number;
    idealValue: number;
  }[];
}

export function MaterialComparison({ materials, requirements }: MaterialComparisonProps) {
  if (materials.length === 0) return null;
  
  // Get all unique attributes
  const attributes = Object.keys(materials[0].attributes) as Array<keyof Material['attributes']>;
  
  return (
    <div className="border border-neutral-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-white mb-3">Material Comparison</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="text-left py-2 text-neutral-500">Material</th>
              <th className="text-center px-2 py-2 text-neutral-500">Tier</th>
              <th className="text-center px-2 py-2 text-neutral-500">Purity</th>
              {attributes.map(attr => (
                <th key={attr} className="text-center px-2 py-2 text-neutral-500 capitalize">
                  {attr}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {materials.map(material => {
              const tierColor = getTierColor(material.tier);
              return (
                <tr key={material.id} className="border-b border-neutral-900">
                  <td className="py-2">
                    <div>
                      <div className="text-neutral-200 font-medium">{material.name}</div>
                      <div className="text-neutral-500">{material.category}</div>
                    </div>
                  </td>
                  <td className="text-center px-2">
                    <span
                      className="px-1.5 py-0.5 rounded text-xs font-bold"
                      style={{ color: tierColor }}
                    >
                      T{material.tier}
                    </span>
                  </td>
                  <td className="text-center px-2 text-neutral-300">
                    {(material.purity * 100).toFixed(0)}%
                  </td>
                  {attributes.map(attr => {
                    const value = material.attributes[attr];
                    const requirement = requirements?.find(r => r.attribute === attr);
                    
                    let colorClass = 'text-neutral-400';
                    if (requirement) {
                      if (value >= requirement.idealValue) {
                        colorClass = 'text-green-400';
                      } else if (value >= requirement.minValue) {
                        colorClass = 'text-yellow-400';
                      } else {
                        colorClass = 'text-red-400';
                      }
                    }
                    
                    return (
                      <td key={attr} className={`text-center px-2 ${colorClass}`}>
                        {(value * 100).toFixed(0)}%
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {requirements && requirements.length > 0 && (
        <div className="mt-3 pt-3 border-t border-neutral-800">
          <p className="text-xs text-neutral-500 mb-2">Requirements Legend</p>
          <div className="flex gap-4 text-xs">
            <span className="text-green-400">● Ideal</span>
            <span className="text-yellow-400">● Acceptable</span>
            <span className="text-red-400">● Below Minimum</span>
          </div>
        </div>
      )}
    </div>
  );
}
