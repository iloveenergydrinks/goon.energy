"use client";

import React, { useState, useMemo } from 'react';
import { getTierColor, getMaterialGrade, formatIndustrialNumber } from '@/lib/industrial/calculations';
import { getQualityGrade } from '@/lib/industrial/quality';
import { getMaterialDisplayName } from '@/lib/industrial/materialStats';
import type { RefiningFacility } from '@/types/industrial';

interface RefiningCrucibleProps {
  playerMaterials: any[];
  facilities: RefiningFacility[];
  onRefiningComplete?: () => void;
}

export function RefiningCrucible({ playerMaterials, facilities, onRefiningComplete }: RefiningCrucibleProps) {
  const [crucible, setCrucible] = useState<string[]>([]); // Array of material IDs in crucible
  const [selectedFacility, setSelectedFacility] = useState<RefiningFacility | null>(null);
  const [plannedCycles, setPlannedCycles] = useState(1);
  const [isRefining, setIsRefining] = useState(false);
  const [captainId, setCaptainId] = useState<string>('none');
  const [now, setNow] = useState<number>(Date.now());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [completionMessage, setCompletionMessage] = useState<any>(null);
  const [prevCompletedCount, setPrevCompletedCount] = useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Poll for completed jobs and show notification
  React.useEffect(() => {
    async function checkCompletions() {
      try {
        const res = await fetch('/api/refining');
        if (res.ok) {
          const data = await res.json();
          const jobs = Array.isArray(data) ? data : [];
          const completed = jobs.filter((j: any) => j.status === 'completed');
          
          // New completion detected
          if (completed.length > prevCompletedCount) {
            const latest = completed[completed.length - 1];
            
            // Find the material name from the job
            const material = await fetch(`/api/player/materials`).then(r => r.ok ? r.json() : null);
            const materialName = material?.materials?.find((m: any) => m.materialId === latest.materialId)?.material?.name || 'Material';
            
            setCompletionMessage({
              materialName,
              quantity: latest.outputQuantity,
              purity: latest.outputPurity,
              tier: latest.outputTier,
              isRefined: true // Refining always produces refined
            });
            
            setTimeout(() => setCompletionMessage(null), 15000); // 15 seconds
            if (onRefiningComplete) onRefiningComplete();
          }
          
          setPrevCompletedCount(completed.length);
        }
      } catch (e) {
        console.error('Failed to poll refining', e);
      }
    }
    
    const interval = setInterval(checkCompletions, 2000);
    return () => clearInterval(interval);
  }, [prevCompletedCount, onRefiningComplete]);

  // Group materials by name+tier for draggable list
  const materialGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    // If crucible has items, filter to only compatible materials
    let filteredMaterials = playerMaterials;
    if (crucible.length > 0) {
      const firstInCrucible = playerMaterials.find(pm => pm.id === crucible[0]);
      if (firstInCrucible) {
        // Only show same material name, tier, AND refining state (ore vs mineral)
        filteredMaterials = playerMaterials.filter(pm => 
          pm.material?.name === firstInCrucible.material?.name && 
          pm.tier === firstInCrucible.tier &&
          (pm.isRefined ?? true) === (firstInCrucible.isRefined ?? true)
        );
      }
    }
    
    filteredMaterials.forEach(pm => {
      const key = `${pm.material?.name || 'Unknown'}_T${pm.tier}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push({
        id: pm.id,
        name: pm.material?.name || 'Unknown',
        tier: pm.tier,
        purity: pm.purity,
        quantity: parseInt(pm.quantity),
        isRefined: pm.isRefined ?? true,
        materialId: pm.materialId
      });
    });
    return groups;
  }, [playerMaterials, crucible]);

  // Calculate crucible stats (weighted average)
  const crucibleStats = useMemo(() => {
    if (crucible.length === 0) return null;
    
    const materialsInCrucible = crucible.map(id => 
      playerMaterials.find(pm => pm.id === id)
    ).filter(Boolean);
    
    if (materialsInCrucible.length === 0) return null;
    
    // Check all same material type, tier, AND refining state
    const firstMat = materialsInCrucible[0];
    const sameMaterial = materialsInCrucible.every(m => 
      m.material?.name === firstMat.material?.name && 
      m.tier === firstMat.tier &&
      (m.isRefined ?? true) === (firstMat.isRefined ?? true)
    );
    
    if (!sameMaterial) {
      return { error: 'All materials must be same type, tier, and state (ore/mineral)!' };
    }
    
    const totalQuantity = materialsInCrucible.reduce((sum, m) => sum + parseInt(m.quantity), 0);
    const weightedPurity = materialsInCrucible.reduce((sum, m) => 
      sum + (m.purity * parseInt(m.quantity)), 0
    ) / totalQuantity;
    
    return {
      materialName: firstMat.material?.name,
      tier: firstMat.tier,
      isRefined: firstMat.isRefined,
      totalQuantity,
      averagePurity: weightedPurity,
      stackCount: materialsInCrucible.length
    };
  }, [crucible, playerMaterials]);

  // Simulate refining
  const simulation = useMemo(() => {
    if (!crucibleStats || crucibleStats.error) return null;
    
    const cycles = [];
    let currentQuantity = crucibleStats.totalQuantity;
    let currentPurity = crucibleStats.averagePurity * 100;
    
    for (let i = 1; i <= plannedCycles; i++) {
      const purityGain = (100 - currentPurity) * 0.3;
      const outputPurity = Math.min(100, currentPurity + purityGain);
      const outputQuantity = Math.floor(currentQuantity * 0.8);
      
      cycles.push({
        cycle: i,
        inputQty: currentQuantity,
        inputPurity: currentPurity,
        outputQty: outputQuantity,
        outputPurity,
        loss: currentQuantity - outputQuantity,
        gain: outputPurity - currentPurity
      });
      
      currentQuantity = outputQuantity;
      currentPurity = outputPurity;
      if (currentQuantity < 1) break;
    }
    
    return cycles;
  }, [crucibleStats, plannedCycles]);

  const handleAddToCrucible = (materialId: string) => {
    if (!crucible.includes(materialId)) {
      setCrucible([...crucible, materialId]);
    }
  };

  const handleRemoveFromCrucible = (materialId: string) => {
    setCrucible(crucible.filter(id => id !== materialId));
  };

  const handleRefine = async () => {
    if (!crucibleStats || crucibleStats.error || !selectedFacility) return;
    
    setIsRefining(true);
    try {
      // Call batch refining endpoint (you'll need to create this)
      const response = await fetch('/api/refining/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialIds: crucible,
          cycles: plannedCycles,
          facilityType: selectedFacility.type,
          captainId
        })
      });
      
      if (response.ok) {
        setCrucible([]);
        if (onRefiningComplete) onRefiningComplete();
      } else {
        const error = await response.json();
        alert(error.error || 'Refining failed');
      }
    } catch (error) {
      console.error('Refining error:', error);
      alert('Refining failed');
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Completion Notification */}
      {completionMessage && (
        <div className="border-2 border-green-600 bg-green-950/20 p-4 relative overflow-hidden shadow-lg shadow-green-600/30">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #22c55e 10px, #22c55e 20px)'
          }} />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-black tracking-wider text-green-400 uppercase">✓ REFINING COMPLETE</div>
              <button
                onClick={() => setCompletionMessage(null)}
                className="text-neutral-500 hover:text-white text-xl font-bold"
              >
                ×
              </button>
            </div>
            
            {/* Material Name */}
            <div className="mb-3 pb-3 border-b border-green-800">
              <div className="text-xs text-neutral-500 uppercase">Produced:</div>
              <div className="text-xl font-black text-cyan-400 uppercase tracking-wider">
                ✨ {completionMessage.materialName}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <div className="text-neutral-500 uppercase">Quantity:</div>
                <div className="text-white font-bold text-2xl tabular-nums">{completionMessage.quantity}</div>
              </div>
              <div>
                <div className="text-neutral-500 uppercase">Purity:</div>
                <div className="text-green-400 font-bold text-2xl tabular-nums">{(completionMessage.purity * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-neutral-500 uppercase">Tier:</div>
                <div className="text-cyan-400 font-bold text-2xl tabular-nums">T{completionMessage.tier}</div>
              </div>
            </div>
            <div className="text-xs text-neutral-500 mt-3 font-mono uppercase tracking-wider">
              → ADDED TO CARGO BAY
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-12 gap-4">
        {/* Left: Available Materials */}
        <div className="col-span-4 space-y-3">
        <div className="border-2 border-blue-600 bg-black p-3">
          <h3 className="text-xs font-black tracking-widest text-blue-500 uppercase">
            AVAILABLE STOCK
            {crucible.length > 0 && <span className="text-orange-400 ml-2">({Object.keys(materialGroups).length} COMPATIBLE)</span>}
          </h3>
        </div>
        
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {Object.keys(materialGroups).length === 0 && crucible.length > 0 && (
            <div className="text-center py-8 text-neutral-600 text-xs font-mono border-2 border-dashed border-neutral-800 bg-neutral-950">
              ALL COMPATIBLE STACKS<br/>ADDED TO CRUCIBLE
            </div>
          )}
          {Object.entries(materialGroups).map(([key, stacks]) => {
            // Calculate group totals for header
            const totalQty = stacks.reduce((sum, s) => sum + s.quantity, 0);
            const avgPurity = stacks.reduce((sum, s) => sum + (s.purity * s.quantity), 0) / totalQty;
            const isOre = stacks[0]?.isRefined === false;
            const isExpanded = expandedGroups.has(key);
            
            return (
              <div key={key} className="space-y-1">
                {/* Material Group Header - Clickable */}
                <button
                  onClick={() => {
                    const newExpanded = new Set(expandedGroups);
                    if (isExpanded) {
                      newExpanded.delete(key);
                    } else {
                      newExpanded.add(key);
                    }
                    setExpandedGroups(newExpanded);
                  }}
                  className={`w-full border-2 p-2 text-left transition-all ${
                    isOre ? 'border-orange-700 bg-orange-950/10 hover:bg-orange-950/20' : 'border-blue-700 bg-blue-950/10 hover:bg-blue-950/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 text-xs">{isExpanded ? '▼' : '▶'}</span>
                      <div className="text-xs font-black uppercase tracking-wider">
                        <span className={isOre ? 'text-orange-400' : 'text-blue-400'}>{key}</span>
                      </div>
                    </div>
                    <div className="text-xs font-mono">
                      <span className="text-neutral-500">{stacks.length}</span>
                      <span className="mx-2 text-neutral-700">|</span>
                      <span className="text-white font-bold">{formatIndustrialNumber(totalQty)}</span>
                      <span className="mx-2 text-neutral-700">|</span>
                      <span className={`font-bold ${isOre ? 'text-orange-400' : 'text-blue-400'}`}>
                        {(avgPurity * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </button>
                
                {/* Stacks within group - Collapsible */}
                {isExpanded && (
                  <div className="space-y-1 pl-2">
                  {stacks.map((mat: any) => {
                    const inCrucible = crucible.includes(mat.id);
                    const qualityInfo = getQualityGrade(mat.purity);
                    
                    return (
                      <button
                        key={mat.id}
                        onClick={() => inCrucible ? handleRemoveFromCrucible(mat.id) : handleAddToCrucible(mat.id)}
                        disabled={isRefining}
                        className={`w-full p-2 border transition-all flex items-center justify-between ${
                          inCrucible
                            ? 'border-orange-500 bg-orange-600/20 opacity-60'
                            : 'border-neutral-800 bg-neutral-950 hover:border-orange-600 hover:bg-orange-950/10'
                        }`}
                      >
                        <div className="flex items-center gap-3 text-xs">
                          <div className={`w-2 h-2 ${
                            qualityInfo.grade === 'QT' || qualityInfo.grade === 'PS' ? 'bg-yellow-500' :
                            qualityInfo.grade === 'PR' ? 'bg-purple-500' :
                            qualityInfo.grade === 'RF' ? 'bg-blue-500' :
                            qualityInfo.grade === 'ST' ? 'bg-green-500' :
                            'bg-neutral-600'
                          }`} />
                          <div>
                            <div className="text-neutral-400 font-mono">{qualityInfo.shortName}</div>
                            <div className="text-white font-bold tabular-nums">{(mat.purity * 100).toFixed(1)}%</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-white font-bold tabular-nums">{mat.quantity}</div>
                          {inCrucible && <div className="text-xs text-orange-400 font-mono">✓</div>}
                        </div>
                      </button>
                    );
                  })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Center: Crucible - Dynamic styling based on content */}
      <div className="col-span-4 space-y-3">
        <div className={`border-2 p-3 relative overflow-hidden ${
          crucibleStats?.isRefined === false
            ? 'border-orange-600 bg-black'
            : crucibleStats?.isRefined === true
            ? 'border-cyan-600 bg-black'
            : 'border-neutral-700 bg-black'
        }`}>
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: crucibleStats?.isRefined === false
              ? 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ff6b00 10px, #ff6b00 20px)'
              : 'repeating-linear-gradient(0deg, transparent, transparent 2px, #06b6d4 2px, #06b6d4 4px)'
          }} />
          <h3 className={`text-xs font-black tracking-widest uppercase relative z-10 ${
            crucibleStats?.isRefined === false
              ? 'text-orange-500'
              : crucibleStats?.isRefined === true
              ? 'text-cyan-500'
              : 'text-neutral-500'
          }`}>
            {crucibleStats?.isRefined === false ? '🔥 SMELTING CRUCIBLE' : 
             crucibleStats?.isRefined === true ? '💎 PRECISION REFINERY' : 
             '⚗️ CRUCIBLE'}
          </h3>
          {crucibleStats && (
            <div className={`text-xs font-mono relative z-10 mt-1 ${
              crucibleStats.isRefined === false ? 'text-orange-400' : 'text-cyan-400'
            }`}>
              // {crucibleStats.isRefined === false ? 'INDUSTRIAL PROCESSING' : 'MOLECULAR PURIFICATION'}
            </div>
          )}
        </div>
        
        {/* Crucible Visualization - Different for ore vs mineral */}
        <div className={`border-4 p-6 min-h-[400px] relative ${
          crucibleStats?.isRefined === false
            ? 'border-orange-600 bg-gradient-to-b from-orange-950/30 via-black to-black'
            : crucibleStats?.isRefined === true
            ? 'border-cyan-600 bg-gradient-to-b from-cyan-950/20 via-black to-black'
            : 'border-neutral-700 bg-gradient-to-b from-neutral-950 to-black'
        }`}>
          {crucible.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="text-6xl mb-4 opacity-20">⚗️</div>
              <div className="text-sm text-neutral-600 font-mono uppercase">
                Drag materials here
              </div>
              <div className="text-xs text-neutral-700 font-mono mt-2">
                // BATCH REFINING
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {crucible.map(id => {
                const mat = playerMaterials.find(pm => pm.id === id);
                if (!mat) return null;
                const isOre = (mat.isRefined ?? true) === false;
                
                return (
                  <div key={id} className={`border p-2 flex items-center justify-between ${
                    isOre 
                      ? 'border-orange-700 bg-orange-950/20'
                      : 'border-cyan-700 bg-cyan-950/20'
                  }`}>
                    <div className="text-xs">
                      <div className={`font-bold ${isOre ? 'text-orange-400' : 'text-cyan-400'}`}>
                        {mat.material?.name}
                      </div>
                      <div className="text-neutral-500 font-mono">{(mat.purity * 100).toFixed(1)}%</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-white font-bold tabular-nums">{parseInt(mat.quantity)}</div>
                      <button
                        onClick={() => handleRemoveFromCrucible(id)}
                        className="text-red-400 hover:text-red-300 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {/* Weighted Average Display - Styled by type */}
              {crucibleStats && !crucibleStats.error && (
                <div className={`mt-4 border-2 p-3 relative overflow-hidden ${
                  crucibleStats.isRefined === false
                    ? 'border-orange-500 bg-orange-950/10'
                    : 'border-cyan-500 bg-cyan-950/10'
                }`}>
                  {crucibleStats.isRefined === false && (
                    <div className="absolute inset-0 opacity-10" style={{
                      backgroundImage: 'radial-gradient(circle, #ff6b00 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                    }} />
                  )}
                  <div className={`text-xs font-black tracking-wider uppercase mb-2 relative z-10 ${
                    crucibleStats.isRefined === false ? 'text-orange-400' : 'text-cyan-400'
                  }`}>
                    {crucibleStats.isRefined === false ? '🔥 SMELTER INPUT' : '💎 REFINERY INPUT'}
                  </div>
                  <div className="space-y-1 text-xs font-mono relative z-10">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Total Mass:</span>
                      <span className="text-white font-bold tabular-nums">{crucibleStats.totalQuantity} UNITS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Avg Purity:</span>
                      <span className={`font-bold tabular-nums ${crucibleStats.isRefined === false ? 'text-orange-400' : 'text-cyan-400'}`}>
                        {(crucibleStats.averagePurity * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Batches:</span>
                      <span className="text-white font-bold">{crucibleStats.stackCount}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {crucibleStats?.error && (
                <div className="mt-4 border-2 border-red-600 bg-red-950/20 p-3 text-xs text-red-400 font-mono animate-pulse">
                  ⚠️ {crucibleStats.error}
                </div>
              )}
            </div>
          )}
        </div>
        
        <button
          onClick={() => setCrucible([])}
          disabled={crucible.length === 0}
          className="w-full py-2 border-2 border-neutral-800 bg-black text-neutral-500 text-xs font-black uppercase tracking-wider hover:border-red-600 hover:text-red-400 transition-all disabled:opacity-30"
        >
          × EMPTY CRUCIBLE
        </button>
      </div>

      {/* Right: Config & Preview */}
      <div className="col-span-4 space-y-3">
        {crucibleStats && !crucibleStats.error ? (
          <>
            {/* Config */}
            <div className="border-2 border-green-600 bg-black p-4">
              <h3 className="text-xs font-black tracking-widest text-green-500 uppercase mb-3">REFINERY CONFIG</h3>
              
              {/* Facility */}
              <div className="mb-3">
                <div className="text-xs text-neutral-500 font-bold uppercase mb-2">
                  {!selectedFacility && <span className="text-orange-500 animate-pulse">⚠ </span>}
                  Facility
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {facilities.slice(0, 3).map(fac => (
                    <button
                      key={fac.id}
                      onClick={() => setSelectedFacility(fac)}
                      className={`p-2 border-2 text-xs font-black uppercase ${
                        selectedFacility?.id === fac.id
                          ? 'bg-green-600 text-black border-green-400'
                          : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:border-green-700'
                      }`}
                    >
                      {fac.type}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Cycles */}
              <div>
                <div className="text-xs text-neutral-500 font-bold uppercase mb-2">Cycles</div>
                <div className="grid grid-cols-5 gap-1">
                  {[1, 2, 3, 5, 10].map(c => (
                    <button
                      key={c}
                      onClick={() => setPlannedCycles(c)}
                      className={`py-3 border-2 font-black text-xs ${
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
              
              {/* Captain */}
              <div className="mt-3">
                <div className="text-xs text-neutral-500 font-bold uppercase mb-2">Officer</div>
                <select
                  value={captainId}
                  onChange={(e) => setCaptainId(e.target.value)}
                  className="w-full bg-neutral-950 border-2 border-neutral-700 px-3 py-2 text-xs font-bold uppercase"
                >
                  <option value="none">// NONE</option>
                  <option value="refiner_ace">REFINER ACE</option>
                  <option value="balanced_veteran">BALANCED VET</option>
                </select>
              </div>
            </div>
            
            {/* Preview */}
            {simulation && simulation.length > 0 && (
              <div className="border-2 border-blue-600 bg-black p-4">
                <h3 className="text-xs font-black tracking-widest text-blue-500 uppercase mb-3">OUTPUT PREVIEW</h3>
                
                <div className="space-y-2 text-xs font-mono">
                  {simulation.map((cycle, i) => (
                    <div key={i} className="border border-neutral-800 bg-neutral-950 p-2">
                      <div className="flex justify-between text-neutral-500 mb-1">
                        <span>CYCLE {cycle.cycle}</span>
                        <span className="text-red-400">-{cycle.loss}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white tabular-nums">{cycle.outputQty} units</span>
                        <span className="text-green-400 font-bold tabular-nums">{cycle.outputPurity.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-2 border-green-600 bg-green-950/20 p-3 mt-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-neutral-500 uppercase text-xs">Final Output</div>
                        <div className="text-white font-bold text-lg tabular-nums">
                          {simulation[simulation.length - 1].outputQty}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-neutral-500 uppercase text-xs">Purity</div>
                        <div className="text-green-400 font-black text-lg tabular-nums">
                          {simulation[simulation.length - 1].outputPurity.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Refine Button */}
            <button
              onClick={handleRefine}
              disabled={!selectedFacility || !simulation || simulation[simulation.length - 1]?.outputQty < 1 || isRefining}
              className={`w-full py-4 border-2 font-black uppercase tracking-widest text-sm transition-all ${
                selectedFacility && simulation && simulation[simulation.length - 1]?.outputQty >= 1 && !isRefining
                  ? 'bg-blue-600 text-black border-blue-400 hover:bg-blue-500'
                  : 'bg-neutral-900 text-neutral-700 border-neutral-800 cursor-not-allowed'
              }`}
            >
              {isRefining ? '▶ PROCESSING...' : `▶ REFINE BATCH [${plannedCycles}×]`}
            </button>
          </>
        ) : (
          <div className="border-2 border-neutral-700 bg-black p-8 text-center">
            <div className="text-4xl mb-3 opacity-20">⚗️</div>
            <div className="text-sm text-neutral-600 font-mono uppercase">
              Add materials to crucible
            </div>
            <div className="text-xs text-neutral-700 mt-2 font-mono">
              // CLICK MATERIALS ON LEFT
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

