"use client";

import React, { useState, useMemo } from 'react';
import { formatIndustrialNumber, getTierColor } from '@/lib/industrial/calculations';
import { getQualityGrade, attemptPurification, getQualityBadgeStyles, getRefinementLevel, RISK_MODES, getAdjustedOdds } from '@/lib/industrial/quality';
import type { Material } from '@/types/industrial';
import type { RiskMode } from '@/lib/industrial/quality';

interface PurificationInterfaceProps {
  materials: Material[];
  playerMaterials?: any[];
  onPurificationComplete?: () => void;
}

export function PurificationInterface({ materials, playerMaterials = [], onPurificationComplete }: PurificationInterfaceProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [purificationAmount, setPurificationAmount] = useState(100);
  const [isPurifying, setIsPurifying] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [filterTier, setFilterTier] = useState<number | null>(null);
  const [filterQuality, setFilterQuality] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'quality' | 'quantity' | 'tier'>('quality');
  const [isLoading, setIsLoading] = useState(true);
  const [riskMode, setRiskMode] = useState<RiskMode>('standard');
  
  // Track local materials state for live updates
  const [localMaterials, setLocalMaterials] = useState<any[]>([]);
  
  // Initialize local materials
  React.useEffect(() => {
    if (playerMaterials.length > 0) {
      setLocalMaterials(playerMaterials.map(pm => ({
        id: pm.id,
        name: pm.material?.name || 'Unknown',
        category: pm.material?.category || 'unknown',
        tier: pm.tier,
        purity: pm.purity,
        quantity: parseInt(pm.quantity),
        baseValue: pm.material?.baseValue || 100,
        attributes: pm.attributes || {}
      })));
      setIsLoading(false);
    } else if (materials.length > 0) {
      // Only use mock materials if no player materials and we have mock data
      setLocalMaterials(materials);
      setIsLoading(false);
    }
  }, [playerMaterials, materials]);

  // Filter and sort materials
  const processedMaterials = useMemo(() => {
    let filtered = [...localMaterials];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply tier filter
    if (filterTier !== null) {
      filtered = filtered.filter(m => m.tier === filterTier);
    }
    
    // Apply quality filter
    if (filterQuality !== null) {
      filtered = filtered.filter(m => {
        const grade = getQualityGrade(m.purity).grade;
        return grade === filterQuality;
      });
    }
    
    // Sort materials
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'quality':
          return b.purity - a.purity;
        case 'quantity':
          return b.quantity - a.quantity;
        case 'tier':
          return b.tier - a.tier;
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [localMaterials, searchTerm, filterTier, filterQuality, sortBy]);

  const handlePurify = async () => {
    if (!selectedMaterial) return;
    
    setIsPurifying(true);
    setShowAnimation(true);
    
    try {
      // Call the API
      const response = await fetch('/api/purification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialStackId: selectedMaterial.id,
          quantity: purificationAmount,
          riskMode
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Purification failed');
      }
      
      const data = await response.json();
      
      // Update local materials state
      setLocalMaterials(prev => prev.map(mat => {
        if (mat.id === selectedMaterial.id) {
          if (data.remainingQuantity > 0) {
            return {
              ...mat,
              quantity: data.remainingQuantity,
              purity: data.result.newPurity
            };
          }
          return null; // Mark for removal
        }
        return mat;
      }).filter(Boolean)); // Remove null entries
      
      // Update selected material if it still exists
      if (data.remainingQuantity > 0) {
        const updatedMaterial = {
          ...selectedMaterial,
          quantity: data.remainingQuantity,
          purity: data.result.newPurity
        };
        setSelectedMaterial(updatedMaterial);
        setPurificationAmount(Math.min(100, updatedMaterial.quantity));
      } else {
        setSelectedMaterial(null);
      }
      
      setLastResult({
        success: data.result.success,
        message: data.result.message,
        inputQuality: getQualityGrade(selectedMaterial.purity),
        outputQuality: data.result.newGrade,
        inputAmount: purificationAmount,
        outputAmount: data.outputQuantity,
        materialLost: data.materialCost,
        oldPurity: selectedMaterial.purity,
        newPurity: data.result.newPurity
      });
      
    } catch (error) {
      console.error('Purification error:', error);
      alert(`Purification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setShowAnimation(false);
      setIsPurifying(false);
      
      if (onPurificationComplete) {
        onPurificationComplete();
      }
    }
  };

  // Group materials by type for better organization
  const materialsByType = useMemo(() => {
    const grouped: Record<string, typeof processedMaterials> = {};
    processedMaterials.forEach(mat => {
      if (!grouped[mat.name]) {
        grouped[mat.name] = [];
      }
      grouped[mat.name].push(mat);
    });
    return grouped;
  }, [processedMaterials]);

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 rounded text-sm text-white border border-neutral-700 focus:border-orange-500 focus:outline-none"
            />
          </div>
          
          {/* Tier Filter */}
          <select
            value={filterTier ?? ''}
            onChange={(e) => setFilterTier(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-2 bg-neutral-800 rounded text-sm text-white border border-neutral-700 focus:border-orange-500 focus:outline-none"
          >
            <option value="">All Tiers</option>
            {[1, 2, 3, 4, 5].map(tier => (
              <option key={tier} value={tier}>Tier {tier}</option>
            ))}
          </select>
          
          {/* Quality Filter */}
          <select
            value={filterQuality ?? ''}
            onChange={(e) => setFilterQuality(e.target.value || null)}
            className="px-3 py-2 bg-neutral-800 rounded text-sm text-white border border-neutral-700 focus:border-orange-500 focus:outline-none"
          >
            <option value="">All Qualities</option>
            <option value="SC">Scrap</option>
            <option value="CR">Crude</option>
            <option value="ST">Standard</option>
            <option value="RF">Refined</option>
            <option value="PR">Pure</option>
            <option value="PS">Pristine</option>
            <option value="QT">Quantum</option>
          </select>
          
          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 bg-neutral-800 rounded text-sm text-white border border-neutral-700 focus:border-orange-500 focus:outline-none"
          >
            <option value="quality">Sort by Quality</option>
            <option value="quantity">Sort by Quantity</option>
            <option value="tier">Sort by Tier</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Material Selection */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-white">Select Material to Purify</h3>
          
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mb-4"></div>
              <p className="text-neutral-400">Loading materials...</p>
            </div>
          )}
          
          {/* Materials Grid */}
          {!isLoading && (
          <div className="max-h-[600px] overflow-y-auto custom-scroll space-y-4 pr-2">
            {Object.entries(materialsByType).map(([materialName, mats]) => (
              <div key={materialName} className="space-y-2">
                <div className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">
                  {materialName} ({mats.length})
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {mats.map(material => {
                    const isSelected = selectedMaterial?.id === material.id;
                    const qualityInfo = getQualityGrade(material.purity);
                    const tierColor = getTierColor(material.tier);
                    
                    return (
                      <button
                        key={material.id}
                        onClick={() => {
                          setSelectedMaterial(material);
                          setPurificationAmount(Math.min(100, material.quantity));
                          setLastResult(null);
                        }}
                        disabled={isPurifying || material.quantity < 10}
                        className={`
                          p-3 rounded-lg border transition-all text-left relative
                          ${isSelected 
                            ? 'border-orange-500 bg-orange-500/10 shadow-lg ring-2 ring-orange-500/50' 
                            : 'border-neutral-800 hover:border-neutral-600 bg-neutral-900/50'
                          }
                          ${(isPurifying || material.quantity < 10) ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        {material.quantity < 10 && (
                          <div className="absolute top-1 right-1 text-xs text-red-400">
                            Too few
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="px-1.5 py-0.5 rounded text-xs font-bold"
                              style={{ backgroundColor: `${tierColor}20`, color: tierColor }}
                            >
                              T{material.tier}
                            </span>
                            <span 
                              className={`px-1.5 py-0.5 rounded text-xs font-bold ${getQualityBadgeStyles(qualityInfo)}`}
                              style={{ 
                                color: qualityInfo.grade === 'QT' ? 'white' : qualityInfo.color,
                                borderColor: qualityInfo.color 
                              }}
                            >
                              {qualityInfo.name}
                            </span>
                          </div>
                          <span className="text-xs text-neutral-400">
                            {formatIndustrialNumber(material.quantity)}
                          </span>
                        </div>
                        
                        <div className="w-full bg-neutral-800 rounded-full h-1.5">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(material.purity * 100, 100)}%`,
                              backgroundColor: qualityInfo.color
                            }}
                          />
                        </div>
                        
                        <div className="text-xs text-neutral-500 mt-1">
                          {(() => {
                            const refinement = getRefinementLevel(material.purity);
                            const displayPurity = Math.min(material.purity * 100, 100);
                            if (refinement.level > 0) {
                              return (
                                <>
                                  {displayPurity.toFixed(1)}% <span className="text-yellow-400 font-bold">+{refinement.level}</span>
                                </>
                              );
                            }
                            return `${displayPurity.toFixed(1)}%`;
                          })()}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {processedMaterials.length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                No materials match your filters
              </div>
            )}
          </div>
          )}
        </div>
        
        {/* Right: Purification Panel */}
        <div className="lg:col-span-1">
          {selectedMaterial ? (
            <div className="bg-gradient-to-r from-orange-900/20 to-yellow-900/20 border border-orange-800/50 rounded-lg p-4 sticky top-0">
              <h3 className="text-lg font-semibold text-orange-400 mb-4">Purification Chamber</h3>
              
              {/* Selected Material Info */}
              <div className="bg-neutral-900/50 rounded p-3 mb-4">
                <div className="text-xs text-neutral-400 mb-1">Selected Material</div>
                <div className="text-white font-semibold">{selectedMaterial.name}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span 
                    className={`px-2 py-1 rounded text-xs font-bold ${getQualityBadgeStyles(getQualityGrade(selectedMaterial.purity))}`}
                    style={{ 
                      color: getQualityGrade(selectedMaterial.purity).color,
                      borderColor: getQualityGrade(selectedMaterial.purity).color 
                    }}
                  >
                    {getQualityGrade(selectedMaterial.purity).name}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {(() => {
                      const refinement = getRefinementLevel(selectedMaterial.purity);
                      const displayPurity = Math.min(selectedMaterial.purity * 100, 100);
                      if (refinement.level > 0) {
                        return (
                          <>
                            {displayPurity.toFixed(1)}% <span className="text-yellow-400 font-bold">Refinement +{refinement.level}</span>
                          </>
                        );
                      }
                      return `${displayPurity.toFixed(2)}%`;
                    })()}
                  </span>
                </div>
              </div>
              
              {/* Risk Mode Selector */}
              <div className="mb-4">
                <label className="text-xs text-neutral-400 mb-2 block">Risk Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(RISK_MODES) as RiskMode[]).map((mode) => {
                    const config = RISK_MODES[mode];
                    const isSelected = riskMode === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => setRiskMode(mode)}
                        disabled={isPurifying}
                        className={`p-2 rounded-lg border transition-all ${
                          isSelected
                            ? mode === 'safe' ? 'bg-green-900/30 border-green-600'
                            : mode === 'standard' ? 'bg-blue-900/30 border-blue-600'
                            : mode === 'aggressive' ? 'bg-orange-900/30 border-orange-600'
                            : 'bg-red-900/30 border-red-600 animate-pulse'
                            : 'bg-neutral-900/50 border-neutral-700 hover:border-neutral-600'
                        }`}
                      >
                        <div className={`text-xs font-bold ${
                          mode === 'safe' ? 'text-green-400'
                          : mode === 'standard' ? 'text-blue-400'
                          : mode === 'aggressive' ? 'text-orange-400'
                          : 'text-red-400'
                        }`}>
                          {config.name}
                        </div>
                        <div className="text-xs text-neutral-500 mt-1">
                          {config.materialCost}% cost
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs text-neutral-400 mt-2 italic">
                  {RISK_MODES[riskMode].description}
                </div>
              </div>
              
              {/* Amount Slider */}
              <div className="mb-4">
                <label className="text-xs text-neutral-400">Amount to Purify</label>
                <div className="mt-2">
                  <input
                    type="range"
                    min={10}
                    max={selectedMaterial.quantity}
                    step={10}
                    value={purificationAmount}
                    onChange={(e) => setPurificationAmount(parseInt(e.target.value))}
                    disabled={isPurifying}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-neutral-500 mt-1">
                    <span>10</span>
                    <span className="text-white font-bold">{purificationAmount}</span>
                    <span>{selectedMaterial.quantity}</span>
                  </div>
                </div>
                <div className="text-xs text-orange-400 mt-2">
                  ⚠️ Will consume {Math.floor(purificationAmount * (RISK_MODES[riskMode].materialCost / 100))} units ({RISK_MODES[riskMode].materialCost}%)
                </div>
              </div>
              
              {/* Odds Display */}
              <div className="bg-neutral-900/50 rounded p-3 mb-4">
                <div className="text-xs font-semibold text-white mb-2">Purification Odds</div>
                <div className="space-y-2">
                  {(() => {
                    const odds = getAdjustedOdds(selectedMaterial.purity, riskMode);
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-green-400">⬆️ Upgrade</span>
                          <div className="flex-1 mx-2 bg-neutral-800 rounded-full h-2">
                            <div className="bg-green-500 h-full rounded-full transition-all duration-300" style={{ width: `${odds.upgrade}%` }} />
                          </div>
                          <span className="text-xs text-green-400 font-bold">{odds.upgrade}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-yellow-400">➡️ No Change</span>
                          <div className="flex-1 mx-2 bg-neutral-800 rounded-full h-2">
                            <div className="bg-yellow-500 h-full rounded-full transition-all duration-300" style={{ width: `${odds.same}%` }} />
                          </div>
                          <span className="text-xs text-yellow-400 font-bold">{odds.same}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-red-400">⬇️ Contaminate</span>
                          <div className="flex-1 mx-2 bg-neutral-800 rounded-full h-2">
                            <div className="bg-red-500 h-full rounded-full transition-all duration-300" style={{ width: `${odds.downgrade}%` }} />
                          </div>
                          <span className="text-xs text-red-400 font-bold">{odds.downgrade}%</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <div className="text-xs text-neutral-500 mt-2 italic">
                  {selectedMaterial.purity >= 0.95 && '⚠️ Extremely difficult at this purity!'}
                  {selectedMaterial.purity >= 0.85 && selectedMaterial.purity < 0.95 && '⚠️ Very difficult at this purity'}
                  {selectedMaterial.purity >= 0.75 && selectedMaterial.purity < 0.85 && '⚠️ Getting harder...'}
                  {selectedMaterial.purity < 0.2 && '✨ Easy improvement potential!'}
                </div>
              </div>
              
              {/* Purify Button */}
              <button
                onClick={handlePurify}
                disabled={isPurifying || purificationAmount < 10}
                className={`
                  w-full py-3 px-4 rounded-lg font-semibold transition-all
                  ${isPurifying 
                    ? 'bg-orange-600/50 text-orange-300 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-500 hover:to-yellow-500 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  }
                `}
              >
                {isPurifying ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Purifying...</span>
                  </div>
                ) : (
                  '⚗️ Start Purification'
                )}
              </button>
              
              {/* Last Result */}
              {lastResult && !isPurifying && (
                <div className={`
                  mt-4 p-3 rounded-lg border animate-bounce-once
                  ${lastResult.success 
                    ? lastResult.outputQuality.grade !== lastResult.inputQuality.grade
                      ? 'bg-green-900/20 border-green-600' 
                      : 'bg-yellow-900/20 border-yellow-600'
                    : 'bg-red-900/20 border-red-600'
                  }
                `}>
                  <div className="text-xs font-semibold text-white mb-2">
                    {lastResult.message}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400">Quality:</span>
                      <span className="text-neutral-300">
                        {lastResult.inputQuality.name} → {lastResult.outputQuality.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400">Purity:</span>
                      <span className="text-neutral-300">
                        {(() => {
                          const oldRefinement = getRefinementLevel(lastResult.oldPurity);
                          const newRefinement = getRefinementLevel(lastResult.newPurity);
                          const oldDisplay = Math.min(lastResult.oldPurity * 100, 100);
                          const newDisplay = Math.min(lastResult.newPurity * 100, 100);
                          
                          let oldText = `${oldDisplay.toFixed(1)}%`;
                          if (oldRefinement.level > 0) oldText += ` +${oldRefinement.level}`;
                          
                          let newText = `${newDisplay.toFixed(1)}%`;
                          if (newRefinement.level > 0) newText += ` +${newRefinement.level}`;
                          
                          return `${oldText} → ${newText}`;
                        })()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400">Material:</span>
                      <span className="text-neutral-300">
                        {lastResult.inputAmount} → {lastResult.outputAmount} (-{lastResult.materialLost})
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6 text-center">
              <div className="text-4xl mb-2">⚗️</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Select a Material
              </h3>
              <p className="text-sm text-neutral-400 mb-3">
                Choose a material from the left to begin purification
              </p>
              <div className="text-xs text-neutral-500 space-y-1">
                <p>💡 Higher quality = better manufacturing</p>
                <p>💡 Each attempt costs 20% material</p>
                <p>💡 Minimum 10 units required</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Animation Overlay */}
      {showAnimation && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-6xl animate-pulse">⚗️</div>
        </div>
      )}
    </div>
  );
}