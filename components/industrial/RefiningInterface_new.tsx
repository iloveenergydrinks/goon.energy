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
  
  // Group player materials
  const availableMaterials = useMemo(() => {
    return playerMaterials.map(pm => ({
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
  }, [playerMaterials]);
  
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
  
  const handleStartRefining = async () => {
    if (!selectedMaterial || !selectedFacility) return;
    
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
      
      // Notify parent to refresh materials
      if (onRefiningComplete) {
        onRefiningComplete();
      }
    } catch (error) {
      console.error('Refining error:', error);
      alert(`Refining failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRefining(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Explainer */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-400 mb-2">⚗️ Refining Process</h3>
        <p className="text-sm text-neutral-300">
          Refining improves material purity through repeated cycles. Each cycle:
        </p>
        <ul className="text-sm text-neutral-400 mt-2 space-y-1 list-disc list-inside">
          <li><span className="text-red-400">Loses 20% quantity</span> (material sink)</li>
          <li><span className="text-green-400">Improves purity</span> by 30% of the gap to 100%</li>
          <li>Diminishing returns - harder to improve as purity approaches 100%</li>
          <li>First refine converts <span className="text-orange-400">🪨 Raw Ore</span> → <span className="text-blue-400">✨ Refined Mineral</span></li>
        </ul>
      </div>
      
      {/* Material Selection */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Select Material to Refine</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableMaterials.map(material => {
            const isSelected = selectedMaterial?.id === material.id;
            const tierColor = getTierColor(material.tier);
            const qualityInfo = getQualityGrade(material.purity);
            
            return (
              <button
                key={material.id}
                onClick={() => {
                  setSelectedMaterial(material);
                  setRefiningQuantity(Math.min(1000, material.quantity));
                }}
                disabled={isRefining}
                className={`
                  p-3 rounded-lg border text-left transition-all
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : 'border-neutral-800 hover:border-neutral-600 bg-neutral-900/50'
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
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        material.isRefined === false
                          ? 'bg-orange-900/30 text-orange-400 border border-orange-700'
                          : 'bg-blue-900/30 text-blue-400 border border-blue-700'
                      }`}>
                        {material.isRefined === false ? '🪨 ORE' : '✨ REFINED'}
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
      
      {/* Refining Configuration */}
      {selectedMaterial && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white">Configure Refining</h3>
          
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
        </div>
      )}
      
      {/* Simulation Results */}
      {simulation.length > 0 && selectedMaterial && (
        <div className="space-y-4">
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
              <div className="grid grid-cols-3 gap-4">
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
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleStartRefining}
              disabled={isRefining || !selectedFacility}
              className={`
                flex-1 py-3 rounded font-medium transition-colors
                ${isRefining || !selectedFacility
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                }
              `}
            >
              {isRefining ? 'Refining...' : `Start Refining (${plannedCycles} cycle${plannedCycles > 1 ? 's' : ''})`}
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
      )}
      
      {/* Refining Result */}
      {refiningResult && (
        <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
          <h3 className="text-sm font-semibold text-green-300 mb-2">Refining Job Queued</h3>
          <div className="text-xs text-neutral-400 mb-2">
            ETA: {refiningResult.estimatedCompletion ? new Date(refiningResult.estimatedCompletion).toLocaleTimeString() : '...'}
          </div>
          {refiningResult.preview && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-neutral-400">Output Quantity</div>
                <div className="text-lg font-bold text-white">
                  {formatIndustrialNumber(parseInt(refiningResult.preview.outputQuantity))}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-400">Final Purity</div>
                <div className="text-lg font-bold text-green-400">
                  {(refiningResult.preview.outputPurity * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

