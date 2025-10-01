"use client";

import { useState } from 'react';
import { getTierColor, getMaterialGrade, formatIndustrialNumber } from '@/lib/industrial/calculations';
import type { Material } from '@/types/industrial';

interface MaterialStackDetailsProps {
  material: Material & { 
    stacks?: Array<{
      id: string;
      quantity: number;
      purity: number;
    }> 
  };
  onClose?: () => void;
}

export function MaterialStackDetails({ material, onClose }: MaterialStackDetailsProps) {
  const [showChart, setShowChart] = useState(true);
  
  const tierColor = getTierColor(material.tier);
  
  // Calculate statistics if we have multiple stacks
  const stats = material.stacks && material.stacks.length > 0 ? (() => {
    const purities = material.stacks.map(s => s.purity);
    const quantities = material.stacks.map(s => s.quantity);
    
    // Weighted average
    const totalQuantity = quantities.reduce((sum, q) => sum + q, 0);
    const weightedAvg = material.stacks.reduce((sum, s) => 
      sum + (s.purity * s.quantity), 0
    ) / totalQuantity;
    
    // Min/Max
    const minPurity = Math.min(...purities);
    const maxPurity = Math.max(...purities);
    
    // Standard deviation
    const mean = purities.reduce((sum, p) => sum + p, 0) / purities.length;
    const variance = purities.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / purities.length;
    const stdDev = Math.sqrt(variance);
    
    // Distribution buckets (10% ranges)
    const buckets: Record<string, { count: number; quantity: number }> = {};
    material.stacks.forEach(stack => {
      const bucket = Math.floor(stack.purity * 10) * 10;
      const key = `${bucket}-${bucket + 10}`;
      if (!buckets[key]) {
        buckets[key] = { count: 0, quantity: 0 };
      }
      buckets[key].count++;
      buckets[key].quantity += stack.quantity;
    });
    
    return {
      weightedAvg,
      minPurity,
      maxPurity,
      stdDev,
      mean,
      buckets,
      totalQuantity
    };
  })() : null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {material.name}
                <span 
                  className="px-2 py-1 rounded text-sm font-bold"
                  style={{ backgroundColor: `${tierColor}20`, color: tierColor }}
                >
                  Tier {material.tier}
                </span>
              </h2>
              <p className="text-sm text-neutral-400 mt-1">
                {material.category} • {formatIndustrialNumber(material.quantity)} total units
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          {stats ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-neutral-800 rounded p-3">
                  <div className="text-xs text-neutral-500">Stacks</div>
                  <div className="text-lg font-bold text-white">
                    {material.stacks?.length || 1}
                  </div>
                </div>
                <div className="bg-neutral-800 rounded p-3">
                  <div className="text-xs text-neutral-500">Avg Purity</div>
                  <div className="text-lg font-bold text-white">
                    {(stats.weightedAvg * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-neutral-600">
                    Grade {getMaterialGrade(stats.weightedAvg)}
                  </div>
                </div>
                <div className="bg-neutral-800 rounded p-3">
                  <div className="text-xs text-neutral-500">Purity Range</div>
                  <div className="text-lg font-bold text-white">
                    {(stats.minPurity * 100).toFixed(1)}-{(stats.maxPurity * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-neutral-600">
                    Δ{((stats.maxPurity - stats.minPurity) * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-neutral-800 rounded p-3">
                  <div className="text-xs text-neutral-500">Std Dev</div>
                  <div className="text-lg font-bold text-white">
                    ±{(stats.stdDev * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              
              {/* Distribution Chart */}
              <div className="bg-neutral-800 rounded p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Purity Distribution</h3>
                  <button
                    onClick={() => setShowChart(!showChart)}
                    className="text-xs text-neutral-400 hover:text-white"
                  >
                    {showChart ? 'Hide' : 'Show'}
                  </button>
                </div>
                
                {showChart && (
                  <div className="space-y-2">
                    {Object.entries(stats.buckets)
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([range, data]) => {
                        const percentage = (data.quantity / stats.totalQuantity) * 100;
                        const [min, max] = range.split('-').map(Number);
                        const grade = getMaterialGrade(min / 100);
                        
                        return (
                          <div key={range} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-neutral-400">
                                {min}-{max}% 
                                <span className="ml-2 text-neutral-600">
                                  Grade {grade}
                                </span>
                              </span>
                              <span className="text-neutral-300">
                                {data.count} stack{data.count > 1 ? 's' : ''} • {formatIndustrialNumber(data.quantity)} units
                              </span>
                            </div>
                            <div className="h-6 bg-neutral-900 rounded overflow-hidden">
                              <div
                                className="h-full transition-all"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: tierColor,
                                  opacity: 0.3 + (percentage / 100) * 0.7
                                }}
                              />
                            </div>
                            <div className="text-xs text-neutral-600 text-right">
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
              
              {/* Individual Stacks */}
              <div className="bg-neutral-800 rounded p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Individual Stacks</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {material.stacks?.sort((a, b) => b.purity - a.purity).map((stack, idx) => {
                    const grade = getMaterialGrade(stack.purity);
                    const gradeColor = grade === 'S' ? 'text-yellow-400' :
                                      grade === 'A' ? 'text-purple-400' :
                                      grade === 'B' ? 'text-blue-400' :
                                      grade === 'C' ? 'text-green-400' :
                                      grade === 'D' ? 'text-orange-400' : 'text-red-400';
                    
                    return (
                      <div
                        key={stack.id || idx}
                        className="flex items-center justify-between p-2 bg-neutral-900 rounded"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-neutral-600">#{idx + 1}</span>
                          <div>
                            <span className="text-sm text-white">
                              {formatIndustrialNumber(stack.quantity)} units
                            </span>
                            <span className="text-xs text-neutral-500 ml-2">
                              ({((stack.quantity / stats.totalQuantity) * 100).toFixed(1)}% of total)
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm text-white">
                              {(stack.purity * 100).toFixed(1)}%
                            </div>
                            <div className={`text-xs font-bold ${gradeColor}`}>
                              Grade {grade}
                            </div>
                          </div>
                          <div className="w-20 h-2 bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full"
                              style={{
                                width: `${stack.purity * 100}%`,
                                backgroundColor: tierColor
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Single Stack */
            <div className="bg-neutral-800 rounded p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-neutral-500 mb-1">Quantity</div>
                  <div className="text-lg font-bold text-white">
                    {formatIndustrialNumber(material.quantity)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-1">Purity</div>
                  <div className="text-lg font-bold text-white">
                    {(material.purity * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-neutral-600">
                    Grade {getMaterialGrade(material.purity)}
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="h-3 bg-neutral-900 rounded-full overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${material.purity * 100}%`,
                      backgroundColor: tierColor
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Attributes */}
          {material.attributes && (
            <div className="bg-neutral-800 rounded p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Material Attributes</h3>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(material.attributes).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className="text-xs text-neutral-500 capitalize">{key.slice(0, 3)}</div>
                    <div className="text-sm font-bold text-white">
                      {typeof value === 'number' ? value.toFixed(2) : value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
