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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left Column: Material Selection */}
      <div className="lg:col-span-1 space-y-3">
        {/* Industrial Header */}
        <div className="border-2 border-orange-600 bg-black p-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ff6b00 10px, #ff6b00 20px)'
          }} />
          <div className="relative z-10">
            <h3 className="text-sm font-black tracking-widest text-orange-500 uppercase mb-2">⚗️ REFINERY</h3>
            <div className="text-xs text-neutral-400 font-mono">
              <div className="flex items-center gap-2">
                <span className="text-red-500">-20% QTY</span>
                <span className="text-neutral-600">//</span>
                <span className="text-green-500">+PURITY</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters - Industrial */}
        <div className="border-2 border-neutral-700 bg-black p-3">
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => setFilterType('ore')}
                className={`px-2 py-2 text-xs font-black tracking-wider uppercase transition-all border-2 ${
                  filterType === 'ore'
                    ? 'bg-orange-600 text-black border-orange-400'
                    : 'bg-neutral-900 text-neutral-500 border-neutral-700 hover:border-orange-600 hover:text-orange-400'
                }`}
              >
                ORE
              </button>
              <button
                onClick={() => setFilterType('refined')}
                className={`px-2 py-2 text-xs font-black tracking-wider uppercase transition-all border-2 ${
                  filterType === 'refined'
                    ? 'bg-blue-600 text-black border-blue-400'
                    : 'bg-neutral-900 text-neutral-500 border-neutral-700 hover:border-blue-600 hover:text-blue-400'
                }`}
              >
                MINERAL
              </button>
              <button
                onClick={() => setFilterType('all')}
                className={`px-2 py-2 text-xs font-black tracking-wider uppercase transition-all border-2 ${
                  filterType === 'all'
                    ? 'bg-purple-600 text-black border-purple-400'
                    : 'bg-neutral-900 text-neutral-500 border-neutral-700 hover:border-purple-600 hover:text-purple-400'
                }`}
              >
                ALL
              </button>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-neutral-900 border-2 border-neutral-700 text-xs text-white font-bold uppercase tracking-wider"
            >
              <option value="tier">▼ TIER</option>
              <option value="purity">▼ PURITY</option>
              <option value="quantity">▼ QUANTITY</option>
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
                  p-3 border-2 text-left transition-all relative bg-black
                  ${isSelected 
                    ? 'border-orange-500 shadow-lg shadow-orange-600/50' 
                    : isOre
                      ? 'border-orange-900 hover:border-orange-600'
                      : 'border-blue-900 hover:border-blue-600'
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
      <div className="lg:col-span-2 space-y-3">
      {selectedMaterial ? (
        <>
          {/* Config Panel */}
          <div className="border-2 border-blue-600 bg-black p-4">
            <h3 className="text-xs font-black tracking-widest text-blue-500 uppercase mb-4">// REFINERY CONFIG</h3>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Quantity Input */}
            <div>
              <label className="text-xs text-neutral-500 font-bold tracking-wider uppercase">Input Quantity</label>
              <div className="flex items-center gap-2 mt-2">
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
                  className="w-full px-3 py-3 bg-neutral-950 border-2 border-neutral-700 text-sm text-white font-bold tabular-nums focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div className="text-xs text-neutral-600 mt-1 font-mono">
                MAX: {formatIndustrialNumber(selectedMaterial.quantity)}
              </div>
            </div>
          
            {/* Facility Selection - Prominent */}
            <div>
              <label className="text-xs text-neutral-500 font-bold tracking-wider uppercase flex items-center gap-2">
                {!selectedFacility && <span className="text-orange-500 animate-pulse">⚠</span>}
                Facility Required
              </label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {facilities.map(facility => {
                  const isSelected = selectedFacility?.id === facility.id;
                  
                  return (
                    <button
                      key={facility.id}
                      onClick={() => setSelectedFacility(facility)}
                      disabled={isRefining}
                      className={`
                        p-3 border-2 text-left transition-all
                        ${isSelected 
                          ? 'border-green-500 bg-green-600/20 shadow-lg shadow-green-600/30' 
                          : !selectedFacility
                            ? 'border-orange-600 bg-orange-900/10 hover:bg-orange-800/20 animate-pulse'
                            : 'border-neutral-800 bg-black hover:border-neutral-600'
                        }
                        ${isRefining ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <div className="text-xs font-black text-white uppercase tracking-wider">{facility.type}</div>
                      <div className="text-xs text-green-400 mt-1 font-bold">
                        {(facility.efficiency * 100).toFixed(0)}% EFF
                      </div>
                    </button>
                  );
                })}
              </div>
              {!selectedFacility && (
                <div className="text-xs text-orange-400 mt-2 font-mono animate-pulse">
                  ⚠ SELECT FACILITY TO CONTINUE
                </div>
              )}
            </div>
          
            {/* Cycles */}
            <div>
              <label className="text-xs text-neutral-500 font-bold tracking-wider uppercase">Cycles</label>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 flex gap-1">
                  {[1, 2, 3, 5, 10].map(c => (
                    <button
                      key={c}
                      onClick={() => setPlannedCycles(c)}
                      disabled={isRefining}
                      className={`flex-1 px-2 py-3 border-2 font-black text-xs transition-all ${
                        plannedCycles === c
                          ? 'bg-orange-600 text-black border-orange-400'
                          : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:border-orange-700'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-xs text-neutral-600 mt-1 font-mono">
                // DIMINISHING RETURNS
              </div>
            </div>
          </div>

          {/* Captain Selection */}
          <div className="mt-3 pt-3 border-t border-neutral-800">
            <label className="text-xs text-neutral-500 font-bold tracking-wider uppercase">Officer Assignment</label>
            <select
              value={captainId}
              onChange={(e) => setCaptainId(e.target.value)}
              className="w-full mt-2 bg-neutral-950 border-2 border-neutral-700 px-3 py-3 text-xs font-bold uppercase tracking-wider focus:border-blue-500 focus:outline-none"
              disabled={isRefining}
            >
              <option value="none">// NO OFFICER</option>
              <option value="refiner_ace">REFINER ACE (+YIELD/PURITY)</option>
              <option value="balanced_veteran">BALANCED VETERAN</option>
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
          
          {/* Action Buttons - Industrial */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleStartRefining}
              disabled={isRefining || !selectedFacility || (simulation.length > 0 && simulation[simulation.length - 1].outputQuantity < 1)}
              className={`
                flex-1 py-4 border-2 font-black uppercase tracking-widest text-xs transition-all
                ${isRefining || !selectedFacility || (simulation.length > 0 && simulation[simulation.length - 1].outputQuantity < 1)
                  ? 'bg-neutral-900 text-neutral-700 border-neutral-800 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-black border-blue-400'
                }
              `}
            >
              {isRefining ? '▶ PROCESSING...' : 
               simulation.length > 0 && simulation[simulation.length - 1].outputQuantity < 1 ? '⚠ OUTPUT < 1 UNIT' :
               `▶ INITIATE REFINING [${plannedCycles}×]`}
            </button>
            
            <button
              onClick={() => {
                setSelectedMaterial(null);
                setSelectedFacility(null);
                setRefiningResult(null);
              }}
              disabled={isRefining}
              className="px-6 py-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border-2 border-neutral-800 font-black uppercase text-xs tracking-wider transition-all"
            >
              × ABORT
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

