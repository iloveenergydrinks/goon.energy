"use client";

import React, { useState, useMemo } from 'react';
import type { Material, RefiningFacility } from '@/types/industrial';
import { 
  getTierColor, 
  getMaterialGrade,
  formatIndustrialNumber 
} from '@/lib/industrial/calculations';
import { getQualityGrade } from '@/lib/industrial/quality';
import { getMaterialDisplayName } from '@/lib/industrial/materialStats';

interface RefiningInterfaceProps {
  materials: Material[];
  facilities: RefiningFacility[];
  playerMaterials?: any[];
  onRefiningComplete?: () => void;
}

interface RefiningCyclePreview {
  cycleNumber: number;
  inputQuantity: number;
  inputPurity: number;
  outputQuantity: number;
  outputPurity: number;
  quantityLoss: number;
  purityGain: number;
}

export function RefiningInterface({ materials, facilities, playerMaterials = [], onRefiningComplete }: RefiningInterfaceProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [selectedFacility, setSelectedFacility] = useState<RefiningFacility | null>(null);
  const [plannedCycles, setPlannedCycles] = useState(1);
  const [refiningQuantity, setRefiningQuantity] = useState(100);
  const [isRefining, setIsRefining] = useState(false);
  const [refiningResult, setRefiningResult] = useState<any>(null);
  const [captainId, setCaptainId] = useState<string>('none');
  const [now, setNow] = useState<number>(Date.now());
  const [filterType, setFilterType] = useState<'all' | 'ore' | 'refined'>('ore'); // Default to ore
  const [sortBy, setSortBy] = useState<'tier' | 'purity' | 'quantity'>('tier');
  const [jobs, setJobs] = useState<any[]>([]);

  // Update current time every second for live countdown
  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Poll refining jobs and auto-refresh materials
  React.useEffect(() => {
    async function pollJobs() {
      try {
        const res = await fetch('/api/refining');
        if (res.ok) {
          const data = await res.json();
          const normalized = Array.isArray(data) ? data : [];
          const prevCompleted = jobs.filter(j => j.status === 'completed').length;
          setJobs(normalized);
          
          // Auto-refresh if new completions
          const nowCompleted = normalized.filter((j: any) => j.status === 'completed').length;
          if (nowCompleted > prevCompleted && onRefiningComplete) {
            onRefiningComplete();
          }
        }
      } catch (e) {
        console.error('Failed to poll refining jobs', e);
      }
    }
    
    pollJobs();
    const interval = setInterval(pollJobs, 2000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Filter and sort player materials
  const availableMaterials = useMemo(() => {
    let filtered = playerMaterials.map(pm => ({
      id: pm.id,
      name: pm.material?.name || 'Unknown',
      category: pm.material?.category || 'unknown',
      tier: pm.tier,
      purity: pm.purity,
      quantity: parseInt(pm.quantity),
      isRefined: pm.isRefined ?? true,
      baseValue: pm.material?.baseValue || 100,
      attributes: pm.attributes || {}
    }));
    
    // Apply filter
    if (filterType === 'ore') {
      filtered = filtered.filter(m => m.isRefined === false);
    } else if (filterType === 'refined') {
      filtered = filtered.filter(m => m.isRefined !== false);
    }
    
    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'tier') return b.tier - a.tier;
      if (sortBy === 'purity') return b.purity - a.purity;
      if (sortBy === 'quantity') return b.quantity - a.quantity;
      return 0;
    });
    
    return filtered;
  }, [playerMaterials, filterType, sortBy]);
  
  // Simulate refining cycles with diminishing returns
  const simulation = useMemo<RefiningCyclePreview[]>(() => {
    if (!selectedMaterial || refiningQuantity <= 0) return [];
    
    const cycles: RefiningCyclePreview[] = [];
    let currentQuantity = refiningQuantity;
    let currentPurity = selectedMaterial.purity * 100; // 0-100 scale
    
    const lossRate = 0.2; // 20% per cycle
    const improvementRate = 0.3; // 30% of gap to 100
    
    for (let i = 1; i <= plannedCycles; i++) {
      const purityGain = (100 - currentPurity) * improvementRate;
      const outputPurity = Math.min(100, currentPurity + purityGain);
      const outputQuantity = Math.floor(currentQuantity * (1 - lossRate));
      const quantityLoss = currentQuantity - outputQuantity;
      
      cycles.push({
        cycleNumber: i,
        inputQuantity: currentQuantity,
        inputPurity: currentPurity,
        outputQuantity,
        outputPurity,
        quantityLoss,
        purityGain
      });
      
      currentQuantity = outputQuantity;
      currentPurity = outputPurity;
      
      if (currentQuantity <= 0) break;
    }
    
    return cycles;
  }, [selectedMaterial, plannedCycles, refiningQuantity]);

  // Calculate ISK cost preview
  const iskCost = useMemo(() => {
    if (!selectedMaterial || refiningQuantity <= 0) return 0;
    
    const basePerUnit = 10;
    const tierMultiplier = Math.pow(1.5, selectedMaterial.tier - 1);
    const currentPurity = selectedMaterial.purity * 100;
    const purityMultiplier = currentPurity < 90 
      ? 1.0 
      : Math.pow(10, (currentPurity - 90) / 10);
    const cycleMultiplier = Math.pow(1.5, plannedCycles - 1);
    
    return Math.floor(refiningQuantity * basePerUnit * tierMultiplier * purityMultiplier * cycleMultiplier);
  }, [selectedMaterial, refiningQuantity, plannedCycles]);
  
  const handleStartRefining = async () => {
    if (!selectedMaterial || !selectedFacility) return;
    
    // Check if final output would be too small
    if (simulation.length > 0 && simulation[simulation.length - 1].outputQuantity < 1) {
      alert(`Cannot refine: final output would be ${simulation[simulation.length - 1].outputQuantity.toFixed(1)} units. Reduce cycles or increase input quantity.`);
      return;
    }
    
    setIsRefining(true);
    setRefiningResult(null);
    
    try {
      const response = await fetch('/api/refining', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId: selectedMaterial.id,
          quantity: refiningQuantity,
          cycles: plannedCycles,
          facilityType: selectedFacility.type,
          captainId
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start refining');
      }
      
      const result = await response.json();
      setRefiningResult(result);
      
      // Clear selection and reset form
      setTimeout(() => {
        setRefiningResult(null);
        setSelectedMaterial(null);
      }, 3000);
    } catch (error) {
      console.error('Refining error:', error);
      alert(`Refining failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRefining(false);
    }
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Material Selection */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-400 mb-2">⚗️ Refining</h3>
          <p className="text-xs text-neutral-300">
            Each cycle: <span className="text-red-400">-20% quantity</span>, <span className="text-green-400">+purity</span> (diminishing returns)
          </p>
        </div>
        
        {/* Filters */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-3">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('ore')}
                className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
                  filterType === 'ore'
                    ? 'bg-orange-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                🪨 Ore Only
              </button>
              <button
                onClick={() => setFilterType('refined')}
                className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
                  filterType === 'refined'
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                ✨ Minerals Only
              </button>
              <button
                onClick={() => setFilterType('all')}
                className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                All
              </button>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-neutral-800 rounded text-xs text-white border border-neutral-700"
            >
              <option value="tier">Sort by Tier</option>
              <option value="purity">Sort by Purity</option>
              <option value="quantity">Sort by Quantity</option>
            </select>
          </div>
        </div>
      
        {/* Material List */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {availableMaterials.length === 0 && (
            <div className="text-center py-8 text-neutral-500 text-sm">
              {filterType === 'ore' ? 'No ore available. Go mine some!' : 'No refined minerals. Refine some ore first!'}
            </div>
          )}
          {availableMaterials.map(material => {
            const isSelected = selectedMaterial?.id === material.id;
            const tierColor = getTierColor(material.tier);
            const qualityInfo = getQualityGrade(material.purity);
            
            // Determine if this is ore or refined
            const isOre = material.isRefined === false;
            
            return (
              <button
                key={material.id}
                onClick={() => {
                  setSelectedMaterial(material);
                  setRefiningQuantity(Math.min(1000, material.quantity));
                }}
                disabled={isRefining}
                className={`
                  p-3 rounded-lg border-2 text-left transition-all relative
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-500/10 shadow-lg' 
                    : isOre
                      ? 'border-orange-700/50 bg-orange-900/10 hover:border-orange-600'
                      : 'border-blue-700/50 bg-blue-900/10 hover:border-blue-600'
                  }
                  ${isRefining ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-white">
                        {getMaterialDisplayName(material.name, material.isRefined)}
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        material.isRefined === false
                          ? 'bg-orange-600 text-white'
                          : 'bg-blue-600 text-white'
                      }`}>
                        {material.isRefined === false ? '🪨 ORE' : '✨ MINERAL'}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500">{material.category}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">
                      {formatIndustrialNumber(material.quantity)} units
                    </span>
                    <span
                      className="px-2 py-1 rounded text-xs font-bold"
                      style={{ color: tierColor }}
                    >
                      T{material.tier}
                    </span>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${material.purity * 100}%`,
                        backgroundColor: tierColor
                      }}
                    />
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {qualityInfo.name} • {(material.purity * 100).toFixed(1)}%
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Right Column: Refining Configuration and Preview */}
      <div className="lg:col-span-2 space-y-4">
      {selectedMaterial ? (
        <>
          <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Configure Refining</h3>
          
          {/* Quantity Input */}
          <div>
            <label className="text-xs text-neutral-400">Quantity to Refine</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                min={1}
                max={selectedMaterial.quantity}
                value={refiningQuantity}
                onChange={(e) => setRefiningQuantity(Math.min(
                  selectedMaterial.quantity,
                  Math.max(1, parseInt(e.target.value) || 0)
                ))}
                disabled={isRefining}
                className="px-3 py-2 bg-neutral-800 rounded text-sm text-white border border-neutral-700 focus:border-blue-500 focus:outline-none"
              />
              <span className="text-xs text-neutral-500">
                / {formatIndustrialNumber(selectedMaterial.quantity)} available
              </span>
            </div>
          </div>
          
          {/* Facility Selection */}
          <div>
            <label className="text-xs text-neutral-400">Select Refining Facility</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
              {facilities.map(facility => {
                const isSelected = selectedFacility?.id === facility.id;
                
                return (
                  <button
                    key={facility.id}
                    onClick={() => setSelectedFacility(facility)}
                    disabled={isRefining}
                    className={`
                      p-3 rounded border text-left transition-all
                      ${isSelected 
                        ? 'border-green-500 bg-green-500/10' 
                        : 'border-neutral-800 hover:border-neutral-600'
                      }
                      ${isRefining ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <div className="text-xs font-medium text-white capitalize">{facility.type}</div>
                    <div className="text-xs text-neutral-500 mt-1">
                      Efficiency: {(facility.efficiency * 100).toFixed(0)}%
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Cycles Configuration */}
          <div>
            <label className="text-xs text-neutral-400">Number of Refining Cycles</label>
            <div className="flex items-center gap-4 mt-1">
              <input
                type="range"
                min={1}
                max={10}
                value={plannedCycles}
                onChange={(e) => setPlannedCycles(parseInt(e.target.value))}
                disabled={isRefining}
                className="flex-1"
              />
              <span className="text-sm font-medium text-white w-8">{plannedCycles}</span>
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              More cycles = higher purity but more material loss (diminishing returns)
            </div>
          </div>

          {/* Captain Selection */}
          <div>
            <label className="text-xs text-neutral-400">Assign Captain</label>
            <select
              value={captainId}
              onChange={(e) => setCaptainId(e.target.value)}
              className="bg-neutral-800 rounded px-3 py-2 text-sm mt-1"
              disabled={isRefining}
            >
              <option value="none">No Captain</option>
              <option value="refiner_ace">Refiner Ace (+yield/purity, faster)</option>
              <option value="balanced_veteran">Balanced Veteran (small bonuses)</option>
            </select>
          </div>
          
          {/* Simulation Results */}
          {simulation.length > 0 && (
            <div className="space-y-4 mt-4">
          <h3 className="text-sm font-semibold text-white">Refining Simulation</h3>
          
          {/* Cycle Details */}
          <div className="space-y-2">
            {simulation.map((cycle) => {
              const inputColor = getTierColor(selectedMaterial.tier);
              
              return (
                <div key={cycle.cycleNumber} className="p-3 bg-neutral-900/50 rounded-lg border border-neutral-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-neutral-400">Cycle {cycle.cycleNumber}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-red-400">
                        -{formatIndustrialNumber(cycle.quantityLoss)} lost
                      </span>
                      <span className="text-xs text-green-400">
                        +{cycle.purityGain.toFixed(1)}% purity
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-neutral-500 mb-1">Input</div>
                      <div className="text-sm text-white">
                        {formatIndustrialNumber(cycle.inputQuantity)} units
                      </div>
                      <div className="text-xs text-neutral-400 mt-1">
                        {cycle.inputPurity.toFixed(1)}% pure
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-neutral-500 mb-1">Output</div>
                      <div className="text-sm text-white">
                        {formatIndustrialNumber(cycle.outputQuantity)} units
                      </div>
                      <div className="text-xs text-neutral-400 mt-1">
                        {cycle.outputPurity.toFixed(1)}% pure
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Summary */}
          {simulation.length > 0 && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-blue-300">Final Output</div>
                  <div className="text-lg font-bold text-white">
                    {formatIndustrialNumber(simulation[simulation.length - 1].outputQuantity)}
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">
                    {simulation[simulation.length - 1].outputPurity.toFixed(1)}% pure
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-red-300">Total Loss</div>
                  <div className="text-lg font-bold text-white">
                    {formatIndustrialNumber(refiningQuantity - simulation[simulation.length - 1].outputQuantity)}
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">
                    {(((refiningQuantity - simulation[simulation.length - 1].outputQuantity) / refiningQuantity) * 100).toFixed(1)}%
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-green-300">Purity Gain</div>
                  <div className="text-lg font-bold text-white">
                    +{(simulation[simulation.length - 1].outputPurity - (selectedMaterial.purity * 100)).toFixed(1)}%
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">
                    {selectedMaterial.isRefined ? 'Further refined' : 'Ore → Mineral'}
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-yellow-300">ISK Cost</div>
                  <div className="text-lg font-bold text-amber-400">
                    {formatIndustrialNumber(iskCost)}
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">
                    {selectedMaterial.purity > 0.9 ? 'Expensive!' : 'Affordable'}
                  </div>
                </div>
              </div>
            </div>
          )}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleStartRefining}
              disabled={isRefining || !selectedFacility || (simulation.length > 0 && simulation[simulation.length - 1].outputQuantity < 1)}
              className={`
                flex-1 py-3 rounded font-medium transition-colors
                ${isRefining || !selectedFacility || (simulation.length > 0 && simulation[simulation.length - 1].outputQuantity < 1)
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                }
              `}
            >
              {isRefining ? 'Refining...' : 
               simulation.length > 0 && simulation[simulation.length - 1].outputQuantity < 1 ? 'Output too small!' :
               `Start Refining (${plannedCycles} cycle${plannedCycles > 1 ? 's' : ''})`}
            </button>
            
            <button
              onClick={() => {
                setSelectedMaterial(null);
                setSelectedFacility(null);
                setRefiningResult(null);
              }}
              disabled={isRefining}
              className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
          </div>
        </>
      ) : null}
      
      {/* Active Refining Jobs */}
      <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4">
        <h3 className="text-lg font-bold mb-3">Active Refining Jobs</h3>
        {jobs.length === 0 ? (
          <div className="text-sm text-neutral-500">No active refining jobs.</div>
        ) : (
          <div className="space-y-2">
            {jobs.slice(0, 5).map((job: any) => {
              const eta = job.estimatedCompletion ? new Date(job.estimatedCompletion).getTime() : null;
              const remaining = eta ? Math.max(0, Math.floor((eta - now) / 1000)) : 0;
              const minutes = Math.floor(remaining / 60);
              const seconds = remaining % 60;
              
              return (
                <div key={job.id} className="p-2 bg-neutral-800 rounded border border-neutral-700 text-sm flex items-center justify-between">
                  <div>
                    <div className="text-neutral-300">Cycles: {job.cycleNumber} • {job.facilityType}</div>
                    <div className="text-xs text-neutral-500">Input: {job.inputQuantity} @ {(job.inputPurity * 100).toFixed(0)}%</div>
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

      {/* Latest Job Result */}
      {refiningResult && (
        <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
          <h3 className="text-sm font-semibold text-green-300 mb-2">Job Queued Successfully</h3>
          <div className="text-xs text-neutral-400 mb-2">
            Cost: {formatIndustrialNumber(parseInt(refiningResult.iskCost || '0'))} ORE
          </div>
          {refiningResult.preview && (
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-neutral-400">Expected Output</div>
                <div className="font-bold text-white">
                  {formatIndustrialNumber(parseInt(refiningResult.preview.outputQuantity))} @ {(refiningResult.preview.outputPurity * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Empty state when nothing selected */}
      {!selectedMaterial && (
        <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-8 text-center">
          <div className="text-4xl mb-3">⚗️</div>
          <h3 className="text-lg font-semibold text-white mb-2">Select Material</h3>
          <p className="text-sm text-neutral-400">
            Choose a material from the left to begin refining
          </p>
          <div className="mt-4 text-xs text-neutral-500 space-y-1">
            <p>💡 Refine <span className="text-orange-400">🪨 Ore</span> to get <span className="text-blue-400">✨ Minerals</span></p>
            <p>💡 Keep refining to improve purity (diminishing returns)</p>
            <p>💡 Higher purity = stronger crafted modules</p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

