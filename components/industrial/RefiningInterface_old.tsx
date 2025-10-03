"use client";

import React, { useState, useMemo } from 'react';
import type { Material, RefiningFacility } from '@/types/industrial';
import { 
  calculateRefiningOutput, 
  getTierColor, 
  getMaterialGrade,
  formatIndustrialNumber 
} from '@/lib/industrial/calculations';

interface RefiningInterfaceProps {
  materials: Material[];
  facilities: RefiningFacility[];
  playerMaterials?: any[];
  onRefiningComplete?: () => void;
}

interface RefiningSimulation {
  cycles: {
    cycleNumber: number;
    input: { quantity: number; purity: number; tier: number };
    output: { quantity: number; purity: number; tier: number; waste: number };
  }[];
  finalOutput: { quantity: number; purity: number; tier: number };
  totalWaste: number;
  efficiency: number;
}

export function RefiningInterface({ materials, facilities, playerMaterials = [], onRefiningComplete }: RefiningInterfaceProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedStack, setSelectedStack] = useState<any>(null);
  const [selectedFacility, setSelectedFacility] = useState<RefiningFacility | null>(null);
  const [plannedCycles, setPlannedCycles] = useState(1);
  const [refiningQuantity, setRefiningQuantity] = useState(100);
  const [isRefining, setIsRefining] = useState(false);
  const [refiningResult, setRefiningResult] = useState<any>(null);
  
  // Group player materials by name, tier, and purity band for cleaner UI
  const availableMaterials = React.useMemo(() => {
    if (playerMaterials.length > 0) {
      const grouped: Record<string, any> = {};
      
      playerMaterials.forEach(pm => {
        // Group by name, tier, and purity band (10% increments)
        const purityBand = Math.floor(pm.purity * 10) / 10;
        const key = `${pm.material?.name}-T${pm.tier}-${purityBand}`;
        
        if (!grouped[key]) {
          grouped[key] = {
            id: pm.id, // Use first stack's ID
            ids: [pm.id], // Track all stack IDs in this group
            name: pm.material?.name || 'Unknown',
            category: pm.material?.category || 'unknown',
            tier: pm.tier,
            purity: pm.purity,
            minPurity: pm.purity,
            maxPurity: pm.purity,
            quantity: 0,
            baseValue: pm.material?.baseValue || 100,
            attributes: pm.attributes || {},
            stackCount: 0
          };
        } else {
          grouped[key].ids.push(pm.id);
        }
        grouped[key].quantity += parseInt(pm.quantity);
        grouped[key].minPurity = Math.min(grouped[key].minPurity, pm.purity);
        grouped[key].maxPurity = Math.max(grouped[key].maxPurity, pm.purity);
        grouped[key].purity = (grouped[key].purity * grouped[key].stackCount + pm.purity) / (grouped[key].stackCount + 1);
        grouped[key].stackCount++;
      });
      
      return Object.values(grouped);
    }
    return materials;
  }, [playerMaterials, materials]);
  
  // Simulate refining process
  const simulation = useMemo<RefiningSimulation | null>(() => {
    if (!selectedMaterial || !selectedFacility || refiningQuantity <= 0) return null;
    
    const cycles: RefiningSimulation['cycles'] = [];
    let currentQuantity = refiningQuantity;
    let currentPurity = selectedMaterial.purity;
    let currentTier = selectedMaterial.tier;
    let totalWaste = 0;
    
    for (let i = 1; i <= plannedCycles; i++) {
      const output = calculateRefiningOutput(
        currentQuantity,
        currentPurity,
        currentTier,
        selectedFacility.efficiency,
        i
      );
      
      const waste = currentQuantity - output.outputQuantity;
      
      cycles.push({
        cycleNumber: i,
        input: { 
          quantity: currentQuantity, 
          purity: currentPurity, 
          tier: currentTier 
        },
        output: {
          quantity: output.outputQuantity,
          purity: output.outputPurity,
          tier: output.outputTier,
          waste
        }
      });
      
      totalWaste += waste;
      currentQuantity = output.outputQuantity;
      currentPurity = output.outputPurity;
      currentTier = output.outputTier;
      
      // Stop if we run out of material
      if (currentQuantity <= 0) break;
    }
    
    return {
      cycles,
      finalOutput: { 
        quantity: currentQuantity, 
        purity: currentPurity, 
        tier: currentTier 
      },
      totalWaste,
      efficiency: selectedFacility.efficiency
    };
  }, [selectedMaterial, selectedFacility, plannedCycles, refiningQuantity]);
  
  const handleStartRefining = async () => {
    if (!selectedMaterial || !selectedFacility || !simulation) return;
    
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
          facilityType: selectedFacility.type
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start refining');
      }
      
      const result = await response.json();
      setRefiningResult(result);
      
      // Reset selection
      setSelectedMaterial(null);
      setRefiningQuantity(1000);
      
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
      {/* Material Selection */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Select Material to Refine</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableMaterials.map(material => {
            const isSelected = selectedMaterial?.id === material.id;
            const tierColor = getTierColor(material.tier);
            
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
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">{material.name}</div>
                    <div className="text-xs text-neutral-500">{material.category}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">
                      {formatIndustrialNumber(material.quantity)} units
                      {material.stackCount > 1 && ` (${material.stackCount} stacks)`}
                    </span>
                    <span
                      className="px-2 py-1 rounded text-xs font-bold"
                      style={{ color: tierColor }}
                    >
                      T{material.tier}
                    </span>
                    <span className={`
                      px-2 py-1 rounded text-xs font-bold
                      ${getMaterialGrade(material.purity) === 'S' ? 'text-yellow-400' :
                        getMaterialGrade(material.purity) === 'A' ? 'text-purple-400' :
                        'text-neutral-400'
                      }
                    `}>
                      {getMaterialGrade(material.purity)}
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
                    Purity: {material.minPurity !== material.maxPurity ? 
                      `${(material.minPurity * 100).toFixed(0)}-${(material.maxPurity * 100).toFixed(0)}%` :
                      `${(material.purity * 100).toFixed(1)}%`
                    }
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
                    <div className="text-xs text-neutral-500">
                      Max Purity: {(facility.maxPurity * 100).toFixed(0)}%
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
                max={5}
                value={plannedCycles}
                onChange={(e) => setPlannedCycles(parseInt(e.target.value))}
                disabled={isRefining}
                className="flex-1"
              />
              <span className="text-sm font-medium text-white w-8">{plannedCycles}</span>
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              More cycles = higher purity but more material loss
            </div>
          </div>
        </div>
      )}
      
      {/* Simulation Results */}
      {simulation && selectedMaterial && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white">Refining Simulation</h3>
          
          {/* Cycle Details */}
          <div className="space-y-2">
            {simulation.cycles.map((cycle, index) => {
              const inputColor = getTierColor(cycle.input.tier);
              const outputColor = getTierColor(cycle.output.tier);
              
              return (
                <div key={cycle.cycleNumber} className="p-3 bg-neutral-900/50 rounded-lg border border-neutral-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-neutral-400">Cycle {cycle.cycleNumber}</span>
                    <span className="text-xs text-red-400">
                      -{formatIndustrialNumber(cycle.output.waste)} waste
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-neutral-500 mb-1">Input</div>
                      <div className="text-sm text-white">
                        {formatIndustrialNumber(cycle.input.quantity)} units
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs" style={{ color: inputColor }}>
                          T{cycle.input.tier}
                        </span>
                        <span className="text-xs text-neutral-400">
                          {(cycle.input.purity * 100).toFixed(1)}% pure
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-neutral-500 mb-1">Output</div>
                      <div className="text-sm text-white">
                        {formatIndustrialNumber(cycle.output.quantity)} units
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs" style={{ color: outputColor }}>
                          T{cycle.output.tier}
                        </span>
                        <span className="text-xs text-neutral-400">
                          {(cycle.output.purity * 100).toFixed(1)}% pure
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Summary */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-blue-300">Final Output</div>
                <div className="text-lg font-bold text-white">
                  {formatIndustrialNumber(simulation.finalOutput.quantity)}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span 
                    className="text-xs font-bold"
                    style={{ color: getTierColor(simulation.finalOutput.tier) }}
                  >
                    Tier {simulation.finalOutput.tier}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {(simulation.finalOutput.purity * 100).toFixed(1)}% pure
                  </span>
                </div>
              </div>
              
              <div>
                <div className="text-xs text-red-300">Total Waste</div>
                <div className="text-lg font-bold text-white">
                  {formatIndustrialNumber(simulation.totalWaste)}
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                  {((simulation.totalWaste / refiningQuantity) * 100).toFixed(1)}% loss
                </div>
              </div>
              
              <div>
                <div className="text-xs text-green-300">Efficiency</div>
                <div className="text-lg font-bold text-white">
                  {(simulation.efficiency * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                  {selectedFacility?.type} facility
                </div>
              </div>
            </div>
          </div>
          
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
              {isRefining ? 'Refining...' : 'Start Refining'}
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
          <h3 className="text-sm font-semibold text-green-300 mb-3">Refining Complete!</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-neutral-400">Final Quantity</div>
              <div className="text-lg font-bold text-white">
                {formatIndustrialNumber(parseInt(refiningResult.finalQuantity))}
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-400">Final Quality</div>
              <div className="text-lg font-bold" style={{ color: getTierColor(refiningResult.finalTier) }}>
                T{refiningResult.finalTier} - {getMaterialGrade(refiningResult.finalPurity)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}