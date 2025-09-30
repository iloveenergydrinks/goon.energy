"use client";

import React, { useState, useMemo } from 'react';
import type { Material, RefiningFacility, RefiningCycle } from '@/types/industrial';
import { 
  calculateRefiningOutput, 
  getTierColor, 
  getMaterialGrade,
  formatIndustrialNumber 
} from '@/lib/industrial/calculations';

interface RefiningInterfaceProps {
  materials: Material[];
  facilities: RefiningFacility[];
  onStartRefining: (config: RefiningConfig) => void;
}

interface RefiningConfig {
  materialId: string;
  facilityId: string;
  cycles: number;
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

export function RefiningInterface({ materials, facilities, onStartRefining }: RefiningInterfaceProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<RefiningFacility | null>(null);
  const [plannedCycles, setPlannedCycles] = useState(1);
  
  // Simulate refining process
  const simulation = useMemo<RefiningSimulation | null>(() => {
    if (!selectedMaterial || !selectedFacility) return null;
    
    const cycles: RefiningSimulation['cycles'] = [];
    let currentMaterial = { ...selectedMaterial };
    let totalWaste = 0;
    
    for (let i = 1; i <= plannedCycles; i++) {
      const output = calculateRefiningOutput(currentMaterial, selectedFacility, i);
      
      cycles.push({
        cycleNumber: i,
        input: {
          quantity: currentMaterial.quantity,
          purity: currentMaterial.purity,
          tier: currentMaterial.tier
        },
        output: {
          quantity: output.refinedQuantity,
          purity: output.newPurity,
          tier: output.newTier,
          waste: output.wasteQuantity
        }
      });
      
      totalWaste += output.wasteQuantity;
      
      // Update for next cycle
      currentMaterial = {
        ...currentMaterial,
        quantity: output.refinedQuantity,
        purity: output.newPurity,
        tier: output.newTier
      };
      
      // Stop if we run out of material
      if (output.refinedQuantity <= 0) break;
    }
    
    const finalCycle = cycles[cycles.length - 1];
    const efficiency = (finalCycle.output.quantity / selectedMaterial.quantity) * 100;
    
    return {
      cycles,
      finalOutput: finalCycle.output,
      totalWaste,
      efficiency
    };
  }, [selectedMaterial, selectedFacility, plannedCycles]);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Material Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Select Material</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {materials.map(material => {
            const isSelected = selectedMaterial?.id === material.id;
            const tierColor = getTierColor(material.tier);
            
            return (
              <button
                key={material.id}
                onClick={() => setSelectedMaterial(material)}
                className={`
                  w-full p-3 rounded-lg border text-left transition-all
                  ${isSelected
                    ? 'border-2'
                    : 'border border-neutral-800 hover:border-neutral-700'
                  }
                `}
                style={{
                  borderColor: isSelected ? tierColor : undefined,
                  backgroundColor: isSelected ? `${tierColor}10` : undefined
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">{material.name}</div>
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
                    Purity: {(material.purity * 100).toFixed(1)}%
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Refining Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Refining Setup</h3>
        
        {/* Facility Selection */}
        <div>
          <label className="text-sm text-neutral-400 mb-2 block">Select Facility</label>
          <div className="space-y-2">
            {facilities.map(facility => {
              const isSelected = selectedFacility?.id === facility.id;
              
              return (
                <button
                  key={facility.id}
                  onClick={() => setSelectedFacility(facility)}
                  className={`
                    w-full p-3 rounded-lg border text-left transition-all
                    ${isSelected
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-neutral-800 hover:border-neutral-700'
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">{facility.name}</div>
                      <div className="text-xs text-neutral-500 capitalize">
                        {facility.type} Refinery • Tier {facility.tier}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-green-400">
                        {(facility.efficiency * 100).toFixed(0)}% efficient
                      </div>
                      <div className="text-xs text-neutral-500">
                        Max {(facility.maxPurity * 100).toFixed(0)}% purity
                      </div>
                    </div>
                  </div>
                  {facility.specialization && facility.specialization.length > 0 && (
                    <div className="mt-2 flex gap-1">
                      {facility.specialization.map(spec => (
                        <span
                          key={spec}
                          className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded capitalize"
                        >
                          {spec} +15%
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-neutral-500">Throughput:</span>
                      <span className="text-neutral-300 ml-1">
                        {formatIndustrialNumber(facility.throughput)}/cycle
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Condition:</span>
                      <span className={`ml-1 ${
                        facility.condition > 80 ? 'text-green-400' :
                        facility.condition > 50 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {facility.condition}%
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Cycle Planning */}
        <div>
          <label className="text-sm text-neutral-400 mb-2 block">
            Refining Cycles: {plannedCycles}
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={plannedCycles}
            onChange={(e) => setPlannedCycles(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-neutral-500 mt-1">
            <span>1 cycle</span>
            <span>5 cycles</span>
          </div>
        </div>
        
        {/* Simulation Results */}
        {simulation && (
          <div className="border border-neutral-800 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-white">Refining Simulation</h4>
            
            {/* Cycle Details */}
            <div className="space-y-2">
              {simulation.cycles.map((cycle, idx) => {
                const inputColor = getTierColor(cycle.input.tier as 1 | 2 | 3 | 4 | 5);
                const outputColor = getTierColor(cycle.output.tier as 1 | 2 | 3 | 4 | 5);
                
                return (
                  <div key={idx} className="text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-neutral-500">Cycle {cycle.cycleNumber}</span>
                      <span className="text-red-400">
                        -{formatIndustrialNumber(cycle.output.waste)} waste
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-neutral-900 rounded p-2">
                        <div className="text-neutral-500 mb-1">Input</div>
                        <div className="text-neutral-300">
                          {formatIndustrialNumber(cycle.input.quantity)} units
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span style={{ color: inputColor }}>
                            T{cycle.input.tier}
                          </span>
                          <span className="text-neutral-400">
                            {(cycle.input.purity * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="bg-neutral-900 rounded p-2">
                        <div className="text-neutral-500 mb-1">Output</div>
                        <div className="text-neutral-300">
                          {formatIndustrialNumber(cycle.output.quantity)} units
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span style={{ color: outputColor }}>
                            T{cycle.output.tier}
                          </span>
                          <span className="text-green-400">
                            {(cycle.output.purity * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Final Summary */}
            <div className="border-t border-neutral-800 pt-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-neutral-500">Final Output</span>
                  <div className="text-lg font-semibold text-white mt-1">
                    {formatIndustrialNumber(simulation.finalOutput.quantity)} units
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-bold"
                      style={{
                        backgroundColor: `${getTierColor(simulation.finalOutput.tier as 1 | 2 | 3 | 4 | 5)}20`,
                        color: getTierColor(simulation.finalOutput.tier as 1 | 2 | 3 | 4 | 5)
                      }}
                    >
                      Tier {simulation.finalOutput.tier}
                    </span>
                    <span className="text-green-400">
                      {(simulation.finalOutput.purity * 100).toFixed(1)}% pure
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-neutral-500">Efficiency</span>
                  <div className={`text-lg font-semibold mt-1 ${
                    simulation.efficiency > 70 ? 'text-green-400' :
                    simulation.efficiency > 50 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {simulation.efficiency.toFixed(1)}%
                  </div>
                  <div className="text-red-400 mt-1">
                    {formatIndustrialNumber(simulation.totalWaste)} waste
                  </div>
                </div>
              </div>
            </div>
            
            {/* Start Button */}
            <button
              onClick={() => {
                if (selectedMaterial && selectedFacility) {
                  onStartRefining({
                    materialId: selectedMaterial.id,
                    facilityId: selectedFacility.id,
                    cycles: plannedCycles
                  });
                }
              }}
              disabled={!selectedMaterial || !selectedFacility}
              className={`
                w-full py-2 rounded-lg font-medium transition-colors
                ${selectedMaterial && selectedFacility
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }
              `}
            >
              Start Refining Process
            </button>
          </div>
        )}
      </div>
    </div>
  );
}






