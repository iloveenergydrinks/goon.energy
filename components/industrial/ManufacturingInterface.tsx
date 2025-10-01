'use client';

import React, { useState, useMemo } from 'react';
import { getQualityGrade, getQualityBadgeStyles } from '@/lib/industrial/quality';

interface Blueprint {
  id: string;
  name: string;
  description?: string;
  type: string;
  requiredMaterials: any;
  baseStats: any;
  tier: number;
  masteryRequired: number;
  timesUsed: number;
  unlocked: boolean;
}

interface PlayerMaterial {
  id: string;
  materialId: string;
  material: {
    name: string;
    category: string;
    tier: number;
  };
  quantity: string;
  purity: number;
  tier: number;
}

interface ManufacturingInterfaceProps {
  blueprints: Blueprint[];
  playerMaterials: PlayerMaterial[];
  onCraftComplete?: () => void;
}

export function ManufacturingInterface({
  blueprints,
  playerMaterials,
  onCraftComplete
}: ManufacturingInterfaceProps) {
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null);
  const [selectedMaterials, setSelectedMaterials] = useState<Record<string, string>>({});
  const [batchSize, setBatchSize] = useState(1);
  const [isCrafting, setIsCrafting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  // Group materials by type and tier for selection
  const materialsByType = useMemo(() => {
    const grouped: Record<string, PlayerMaterial[]> = {};
    
    for (const mat of playerMaterials) {
      const key = mat.material.name;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(mat);
    }
    
    // Sort each group by quality (purity)
    for (const key in grouped) {
      grouped[key].sort((a, b) => b.purity - a.purity);
    }
    
    return grouped;
  }, [playerMaterials]);

  // Calculate crafting preview
  const craftingPreview = useMemo(() => {
    if (!selectedBlueprint) return null;
    
    const requiredMaterials = selectedBlueprint.requiredMaterials as any[];
    let canCraft = true;
    let totalQuality = 0;
    let qualityCount = 0;
    const materialQualities: number[] = [];
    const materialDetails: any[] = [];
    
    // Calculate batch discount
    let materialMultiplier = batchSize;
    if (batchSize >= 25) {
      materialMultiplier = batchSize * 0.7;
    } else if (batchSize >= 10) {
      materialMultiplier = batchSize * 0.8;
    } else if (batchSize >= 5) {
      materialMultiplier = batchSize * 0.9;
    }
    
    for (const required of requiredMaterials) {
      const selectedId = selectedMaterials[required.materialType];
      const playerMat = playerMaterials.find(m => m.id === selectedId);
      
      if (!playerMat) {
        canCraft = false;
        materialDetails.push({
          type: required.materialType,
          required: Math.floor(required.quantity * materialMultiplier),
          available: 0,
          quality: null,
          sufficient: false
        });
      } else {
        const available = parseInt(playerMat.quantity);
        const requiredQty = Math.floor(required.quantity * materialMultiplier);
        const qualityGrade = getQualityGrade(playerMat.purity);
        
        totalQuality += qualityGrade.effectiveness;
        qualityCount++;
        materialQualities.push(qualityGrade.effectiveness);
        
        materialDetails.push({
          type: required.materialType,
          required: requiredQty,
          available,
          quality: qualityGrade,
          purity: playerMat.purity,
          sufficient: available >= requiredQty
        });
        
        if (available < requiredQty) {
          canCraft = false;
        }
      }
    }
    
    // Calculate average quality
    const averageQuality = qualityCount > 0 ? totalQuality / qualityCount : 0;
    
    // Apply quality mismatch penalty
    let finalQuality = averageQuality;
    let qualityPenalty = 0;
    
    if (materialQualities.length > 1) {
      const maxQuality = Math.max(...materialQualities);
      const minQuality = Math.min(...materialQualities);
      const qualityDifference = maxQuality - minQuality;
      
      if (qualityDifference > 0.2) {
        qualityPenalty = Math.min(0.5, qualityDifference * 0.5);
        finalQuality = averageQuality * (1 - qualityPenalty);
      }
    }
    
    // No mastery bonus for now
    
    // Calculate final stats
    const baseStats = selectedBlueprint.baseStats as any;
    const finalStats: any = {};
    
    for (const [stat, value] of Object.entries(baseStats)) {
      if (typeof value === 'number') {
        finalStats[stat] = Math.round(value * finalQuality);
      } else {
        finalStats[stat] = value;
      }
    }
    
    return {
      canCraft,
      materialDetails,
      averageQuality,
      finalQuality,
      qualityPenalty,
      finalStats,
      discount: batchSize >= 25 ? 30 : batchSize >= 10 ? 20 : batchSize >= 5 ? 10 : 0
    };
  }, [selectedBlueprint, selectedMaterials, batchSize, playerMaterials]);

  const handleCraft = async () => {
    if (!selectedBlueprint || !craftingPreview?.canCraft) return;
    
    setIsCrafting(true);
    try {
      const response = await fetch('/api/manufacturing/craft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprintId: selectedBlueprint.id,
          materials: selectedMaterials,
          batchSize
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setLastResult(result);
        onCraftComplete?.();
        
        // Clear selection after successful craft
        setTimeout(() => {
          setSelectedMaterials({});
          setBatchSize(1);
        }, 2000);
      } else {
        alert(`Crafting failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Crafting error:', error);
      alert('Failed to craft module');
    } finally {
      setIsCrafting(false);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Blueprint Selection */}
      <div className="col-span-1 space-y-2">
        <h3 className="text-lg font-bold mb-2">Select Blueprint</h3>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {blueprints
            .filter(bp => bp.unlocked)
            .sort((a, b) => a.tier - b.tier)
            .map(blueprint => (
              <div
                key={blueprint.id}
                onClick={() => {
                  setSelectedBlueprint(blueprint);
                  setSelectedMaterials({});
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedBlueprint?.id === blueprint.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-neutral-700 hover:border-neutral-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                  <div className="font-semibold">{blueprint.name}</div>
                  <div className="text-xs text-neutral-400">
                    Tier {blueprint.tier}
                  </div>
                  </div>
                  {blueprint.timesUsed > 0 && (
                    <div className="text-xs text-green-400">
                      ×{blueprint.timesUsed}
                    </div>
                  )}
                </div>
                {blueprint.description && (
                  <div className="text-xs text-neutral-500 mt-1">
                    {blueprint.description}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Material Selection & Preview */}
      <div className="col-span-2 space-y-4">
        {selectedBlueprint ? (
          <>
            {/* Material Selection */}
            <div className="bg-neutral-900 rounded-lg p-4">
              <h3 className="text-lg font-bold mb-3">Select Materials</h3>
              <div className="space-y-3">
                {(selectedBlueprint.requiredMaterials as any[]).map(required => (
                  <div key={required.materialType} className="flex items-center gap-3">
                    <div className="w-32 text-sm">{required.materialType}:</div>
                    <select
                      value={selectedMaterials[required.materialType] || ''}
                      onChange={(e) => setSelectedMaterials(prev => ({
                        ...prev,
                        [required.materialType]: e.target.value
                      }))}
                      className="flex-1 bg-neutral-800 rounded px-3 py-2 text-sm"
                    >
                      <option value="">Select quality...</option>
                      {materialsByType[required.materialType]?.map(mat => {
                        const qualityGrade = getQualityGrade(mat.purity);
                        const available = parseInt(mat.quantity);
                        const needed = Math.floor(required.quantity * (
                          batchSize >= 25 ? batchSize * 0.7 :
                          batchSize >= 10 ? batchSize * 0.8 :
                          batchSize >= 5 ? batchSize * 0.9 :
                          batchSize
                        ));
                        
                        return (
                          <option
                            key={mat.id}
                            value={mat.id}
                            disabled={available < needed}
                          >
                            {qualityGrade.name} ({Math.round(mat.purity * 100)}%) - 
                            {available} available / {needed} needed
                          </option>
                        );
                      })}
                    </select>
                  </div>
                ))}
              </div>

              {/* Batch Size */}
              <div className="mt-4 flex items-center gap-4">
                <label className="text-sm">Batch Size:</label>
                <div className="flex gap-2">
                  {[1, 5, 10, 25].map(size => (
                    <button
                      key={size}
                      onClick={() => setBatchSize(size)}
                      className={`px-3 py-1 rounded text-sm ${
                        batchSize === size
                          ? 'bg-blue-600 text-white'
                          : 'bg-neutral-700 hover:bg-neutral-600'
                      }`}
                    >
                      ×{size}
                      {size > 1 && craftingPreview && (
                        <span className="text-xs ml-1 text-green-400">
                          -{size >= 25 ? 30 : size >= 10 ? 20 : size >= 5 ? 10 : 0}%
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Crafting Preview */}
            {craftingPreview && (
              <div className="bg-neutral-900 rounded-lg p-4">
                <h3 className="text-lg font-bold mb-3">Output Preview</h3>
                
                {/* Quality Calculation */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Average Quality:</span>
                    <span>{Math.round(craftingPreview.averageQuality * 100)}%</span>
                  </div>
                  
                  {craftingPreview.qualityPenalty > 0 && (
                    <div className="flex justify-between text-sm text-red-400">
                      <span>⚠️ Quality Mismatch:</span>
                      <span>-{Math.round(craftingPreview.qualityPenalty * 100)}%</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-bold border-t border-neutral-700 pt-2">
                    <span>Final Quality:</span>
                    <span className={`${
                      craftingPreview.finalQuality >= 1.2 ? 'text-purple-400' :
                      craftingPreview.finalQuality >= 1.0 ? 'text-green-400' :
                      craftingPreview.finalQuality >= 0.8 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {Math.round(craftingPreview.finalQuality * 100)}%
                    </span>
                  </div>
                </div>

                {/* Final Stats */}
                <div className="bg-neutral-800 rounded p-3">
                  <div className="text-sm font-semibold mb-2">Module Stats:</div>
                  <div className="space-y-1">
                    {Object.entries(craftingPreview.finalStats).map(([stat, value]) => (
                      <div key={stat} className="flex justify-between text-sm">
                        <span className="capitalize">{stat.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Craft Button */}
                <button
                  onClick={handleCraft}
                  disabled={!craftingPreview.canCraft || isCrafting}
                  className={`w-full mt-4 py-3 rounded-lg font-bold transition-all ${
                    craftingPreview.canCraft && !isCrafting
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                  }`}
                >
                  {isCrafting ? 'Crafting...' : `Craft ${batchSize > 1 ? `${batchSize}× ` : ''}${selectedBlueprint.name}`}
                </button>

                {/* Result Message */}
                {lastResult && (
                  <div className="mt-4 p-3 bg-green-500/20 border border-green-500 rounded-lg">
                    <div className="font-semibold text-green-400">{lastResult.message}</div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="bg-neutral-900 rounded-lg p-8 text-center text-neutral-400">
            Select a blueprint to begin manufacturing
          </div>
        )}
      </div>
    </div>
  );
}
