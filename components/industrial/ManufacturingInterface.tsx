'use client';

import React, { useState, useMemo } from 'react';
import { getQualityGrade, getQualityBadgeStyles } from '@/lib/industrial/quality';
import { computeManufacturingQualityScore } from '@/lib/industrial/calculations';
import { getCaptainEffects } from '@/lib/industrial/captains';

interface Blueprint {
  id: string;
  name: string;
  description?: string;
  type: string;
  requiredMaterials: any;
  requiredComponents?: any;
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

interface PlayerComponent {
  id: string;
  componentId: string;
  quantity: string;
  quality: number;
  name: string;
  emoji: string;
  rarity: string;
}

interface ManufacturingInterfaceProps {
  blueprints: Blueprint[];
  playerMaterials: PlayerMaterial[];
  playerComponents?: PlayerComponent[];
  isLoading?: boolean;
  onCraftComplete?: () => void;
}

export function ManufacturingInterface({
  blueprints,
  playerMaterials,
  playerComponents = [],
  isLoading = false,
  onCraftComplete
}: ManufacturingInterfaceProps) {
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null);
  const [selectedMaterials, setSelectedMaterials] = useState<Record<string, string>>({});
  const [selectedComponents, setSelectedComponents] = useState<Record<string, string>>({});
  const [batchSize, setBatchSize] = useState(1);
  const [isCrafting, setIsCrafting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [captainId, setCaptainId] = useState<string>('none');
  const [jobs, setJobs] = useState<any[]>([]);
  const [polling, setPolling] = useState<boolean>(false);
  const [now, setNow] = useState<number>(Date.now());

  // Update current time every second for live countdown
  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  async function pollJobs(forceOnce: boolean = false) {
    try {
      const res = await fetch('/api/manufacturing/craft', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        // Normalize fields
        const normalized = Array.isArray(data) ? data : (data.jobs || []);
        const prevCompleted = jobs.filter(j => j.status === 'completed').length;
        const newJobs = normalized.map((j: any) => ({
          id: j.id,
          status: j.status,
          estimatedCompletion: j.estimatedCompletion || (j.startedAt && j.estimatedTime ? new Date(new Date(j.startedAt).getTime() + (j.estimatedTime * 1000)).toISOString() : null),
          batchSize: j.batchSize || 1,
          blueprintId: j.blueprintId,
          blueprintName: j.blueprint?.name
        }));
        setJobs(newJobs);
        
        // Auto-refresh inventory when jobs complete
        const nowCompleted = newJobs.filter(j => j.status === 'completed').length;
        if (nowCompleted > prevCompleted && onCraftComplete) {
          onCraftComplete();
        }
      }
    } catch (e) {
      console.error('Failed to poll manufacturing jobs', e);
    } finally {
      if (!forceOnce) {
        setTimeout(() => pollJobs(false), 1000); // Poll every 1s for live timer
      }
    }
  }

  // Start polling on mount so ETA shows even before first craft
  React.useEffect(() => {
    if (!polling) {
      setPolling(true);
      pollJobs(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Calculate crafting preview (rating-based)
  const craftingPreview = useMemo(() => {
    if (!selectedBlueprint) return null;
    
    const requiredMaterials = selectedBlueprint.requiredMaterials as any[];
    let canCraft = true;
    const materialPurities: number[] = [];
    const materialDetails: any[] = [];
    
    // No batch discount: scale linearly with batchSize
    const materialMultiplier = batchSize;
    
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
        
        materialPurities.push(playerMat.purity);
        
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
    
    // Compute rating-based quality
    const captainEffects = getCaptainEffects(captainId);
    const captainBonusPct = captainEffects.manufacturingQualityBonus || 0; // e.g., 0.05
    const quality = computeManufacturingQualityScore(
      materialPurities,
      selectedBlueprint.tier,
      captainBonusPct
    );

    // Calculate final stats using multiplier
    const baseStats = selectedBlueprint.baseStats as any;
    const finalStats: any = {};
    
    for (const [stat, value] of Object.entries(baseStats)) {
      if (typeof value === 'number') {
        finalStats[stat] = Math.round(value * quality.multiplier);
      } else {
        finalStats[stat] = value;
      }
    }
    
    return {
      canCraft,
      materialDetails,
      quality, // { score, grade, multiplier, mismatchPenalty }
      finalStats
    };
  }, [selectedBlueprint, selectedMaterials, batchSize, playerMaterials, captainId]);

  const handleCraft = async () => {
    if (!selectedBlueprint || !craftingPreview?.canCraft) return;
    
    setIsCrafting(true);
    try {
      // Auto-select components if not manually selected
      const finalComponents: Record<string, string> = {};
      if (selectedBlueprint.requiredComponents) {
        for (const required of (selectedBlueprint.requiredComponents as any[])) {
          if (selectedComponents[required.componentId]) {
            finalComponents[required.componentId] = selectedComponents[required.componentId];
          } else {
            // Auto-select first available component
            const available = playerComponents.find(c => c.componentId === required.componentId);
            if (available) {
              finalComponents[required.componentId] = available.id;
            }
          }
        }
      }
      
      const response = await fetch('/api/manufacturing/craft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprintId: selectedBlueprint.id,
          materials: selectedMaterials,
          components: finalComponents,
          batchSize,
          captainId
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setLastResult(result);
        // Immediately poll to show the new job in Active Jobs panel
        pollJobs(true);
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
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-pulse">
                <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-4"></div>
                <p className="text-neutral-400">Loading blueprints...</p>
              </div>
            </div>
          ) : blueprints.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-400">No blueprints available</p>
              <p className="text-xs text-neutral-500 mt-2">Complete missions to unlock blueprints</p>
            </div>
          ) : (
            blueprints
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
            ))
          )}
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
                        const needed = Math.floor(required.quantity * batchSize);
                        
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

              {/* Component Selection */}
              {selectedBlueprint.requiredComponents && (selectedBlueprint.requiredComponents as any[]).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-bold mb-2 text-yellow-400">Required Components</h4>
                  <div className="space-y-2">
                    {(selectedBlueprint.requiredComponents as any[]).map(required => {
                      const availableComponents = playerComponents.filter(c => c.componentId === required.componentId);
                      const component = availableComponents[0];
                      const totalAvailable = availableComponents.reduce((sum, c) => sum + parseInt(c.quantity), 0);
                      const needed = required.quantity * batchSize;
                      
                      return (
                        <div key={required.componentId} className="flex items-center gap-3 p-2 bg-neutral-800 rounded">
                          <span className="text-lg">{component?.emoji || '📦'}</span>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{component?.name || required.componentId}</div>
                            <div className="text-xs text-neutral-400">
                              Need: {needed} | Have: {totalAvailable}
                            </div>
                          </div>
                          {totalAvailable < needed && (
                            <span className="text-xs text-red-400">Insufficient!</span>
                          )}
                          {availableComponents.length > 1 && (
                            <select
                              value={selectedComponents[required.componentId] || ''}
                              onChange={(e) => setSelectedComponents(prev => ({
                                ...prev,
                                [required.componentId]: e.target.value
                              }))}
                              className="bg-neutral-700 rounded px-2 py-1 text-xs"
                            >
                              <option value="">Auto-select</option>
                              {availableComponents.map(comp => (
                                <option key={comp.id} value={comp.id}>
                                  Quality: {comp.quality}% - Qty: {comp.quantity}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Captain & Batch Size */}
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
                    </button>
                  ))}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <label className="text-sm text-neutral-400">Captain:</label>
                  <select
                    value={captainId}
                    onChange={(e) => setCaptainId(e.target.value)}
                    className="bg-neutral-800 rounded px-3 py-2 text-sm"
                  >
                    <option value="none">No Captain</option>
                    <option value="assembly_maestro">Assembly Maestro (+Quality, faster)</option>
                    <option value="balanced_veteran">Balanced Veteran (small bonuses)</option>
                    <option value="refiner_ace">Refiner Ace (refining focused)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Crafting Preview */}
            {craftingPreview && (
              <div className="bg-neutral-900 rounded-lg p-4">
                <h3 className="text-lg font-bold mb-3">Output Preview</h3>
                
                {/* Quality Calculation */}
                <div className="space-y-2 mb-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Item Rating:</span>
                      <span className="font-bold">{craftingPreview.quality.score}/100</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Grade:</span>
                      <span className="font-bold">{craftingPreview.quality.grade}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Stat Multiplier:</span>
                      <span className="font-bold">{(craftingPreview.quality.multiplier).toFixed(2)}×</span>
                    </div>
                    {craftingPreview.quality.mismatchPenalty > 0 && (
                      <div className="flex items-center justify-between text-red-400">
                        <span>Mismatch Penalty:</span>
                        <span className="font-bold">-{craftingPreview.quality.mismatchPenalty} pts</span>
                      </div>
                    )}
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

                {/* Estimated Time Preview */}
                <div className="mt-4 p-3 bg-neutral-800 rounded border border-neutral-700">
                  <div className="text-xs text-neutral-400 mb-1">Estimated Manufacturing Time</div>
                  <div className="text-lg font-bold text-blue-400">
                    {craftingPreview.canCraft ? (
                      <>~{Math.round((selectedBlueprint.tier || 1) * 60 * (1 - (captainId === 'assembly_maestro' ? 0.15 : captainId === 'balanced_veteran' ? 0.05 : 0)))}s</>
                    ) : '--'}
                  </div>
                </div>

                {/* Result Message */}
                {lastResult && (
                  <div className="mt-4 p-3 bg-green-500/20 border border-green-500 rounded-lg">
                    <div className="font-semibold text-green-400">{lastResult.message}</div>
                    {lastResult.estimatedCompletion && (() => {
                      const eta = new Date(lastResult.estimatedCompletion).getTime();
                      const remaining = Math.max(0, Math.floor((eta - now) / 1000));
                      const minutes = Math.floor(remaining / 60);
                      const seconds = remaining % 60;
                      
                      return (
                        <div className="text-sm text-white mt-2 font-mono">
                          {remaining > 0 ? (
                            <span className="text-blue-400">⏱ {minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`} remaining</span>
                          ) : (
                            <span className="text-green-400 animate-pulse">✓ Ready to collect!</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="bg-neutral-900 rounded-lg p-8 text-center text-neutral-400">
            {isLoading ? 'Loading blueprints...' : 'Select a blueprint to begin manufacturing'}
          </div>
        )}

        {/* Active Jobs Panel */}
        <div className="bg-neutral-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold">Active Manufacturing Jobs</h3>
            <button
              onClick={() => pollJobs(true)}
              className="text-xs px-2 py-1 border border-neutral-700 rounded hover:border-neutral-600"
            >
              Refresh
            </button>
          </div>
          {jobs.length === 0 ? (
            <div className="text-sm text-neutral-500">No active jobs.</div>
          ) : (
            <div className="space-y-2">
              {jobs.map(job => {
                const eta = job.estimatedCompletion ? new Date(job.estimatedCompletion).getTime() : null;
                const remaining = eta ? Math.max(0, Math.floor((eta - now) / 1000)) : 0;
                const minutes = Math.floor(remaining / 60);
                const seconds = remaining % 60;
                
                return (
                  <div key={job.id} className="p-2 bg-neutral-800 rounded border border-neutral-700 text-sm flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{job.blueprintName || job.blueprintId}</div>
                      <div className="text-xs text-neutral-400">Batch: {job.batchSize || 1} • Status: {job.status}</div>
                    </div>
                    <div className="text-right">
                      {job.status === 'completed' ? (
                        <div className="text-xs text-green-400 font-bold">✓ Completed</div>
                      ) : remaining > 0 ? (
                        <div className="text-xs font-mono text-blue-400">
                          {minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}
                        </div>
                      ) : (
                        <div className="text-xs text-yellow-400 animate-pulse">Finalizing...</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
