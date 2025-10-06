"use client";

import React from 'react';

export function OverviewTab() {
  // Sample refining cycle data for graph
  const refiningCycles = [
    { cycle: 0, quantity: 1000, purity: 40 },
    { cycle: 1, quantity: 800, purity: 58 },
    { cycle: 2, quantity: 640, purity: 70.6 },
    { cycle: 3, quantity: 512, purity: 79.4 },
    { cycle: 4, quantity: 410, purity: 85.6 },
    { cycle: 5, quantity: 328, purity: 90.0 },
    { cycle: 7, quantity: 210, purity: 95.1 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="border-2 border-orange-600 bg-black p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ff6b00 10px, #ff6b00 20px)'
        }} />
        <div className="relative z-10">
          <h2 className="text-2xl font-black tracking-widest text-orange-500 uppercase mb-2">INDUSTRIAL SYSTEM OVERVIEW</h2>
          <p className="text-sm text-neutral-400 font-mono">
            // ATTRIBUTE-BASED MATERIAL CRAFTING PIPELINE
          </p>
        </div>
      </div>

      {/* System Flow */}
      <div className="grid grid-cols-3 gap-2">
        <div className="border-2 border-orange-600 bg-black p-4">
          <div className="text-xs font-black tracking-widest text-orange-500 uppercase mb-2">01 // MINING</div>
          <div className="text-xs text-neutral-400 font-mono">Extract raw ore from nodes</div>
          <div className="mt-2 text-xs">
            <div className="text-neutral-600">Output:</div>
            <div className="text-orange-400 font-bold">🪨 Raw Ore (20-60% purity)</div>
          </div>
        </div>
        
        <div className="border-2 border-blue-600 bg-black p-4">
          <div className="text-xs font-black tracking-widest text-blue-500 uppercase mb-2">02 // REFINING</div>
          <div className="text-xs text-neutral-400 font-mono">Process ore into minerals</div>
          <div className="mt-2 text-xs">
            <div className="text-neutral-600">Output:</div>
            <div className="text-blue-400 font-bold">✨ Refined Minerals</div>
          </div>
        </div>
        
        <div className="border-2 border-green-600 bg-black p-4">
          <div className="text-xs font-black tracking-widest text-green-500 uppercase mb-2">03 // MANUFACTURING</div>
          <div className="text-xs text-neutral-400 font-mono">Fabricate modules</div>
          <div className="mt-2 text-xs">
            <div className="text-neutral-600">Output:</div>
            <div className="text-green-400 font-bold">🏭 Crafted Modules</div>
          </div>
        </div>
      </div>

      {/* Mining */}
      <div className="border-2 border-orange-600 bg-black p-4">
        <h3 className="text-sm font-black tracking-widest text-orange-500 uppercase mb-3">🪨 MINING</h3>
        
        <div className="p-3 bg-yellow-900/20 border-l-4 border-yellow-600 mb-3 text-xs text-yellow-300 font-mono">
          ⚠️ PLACEHOLDER: Click-to-mine for development. Real game uses ship-fitted mining lasers.
        </div>
        
        <div className="space-y-2 text-xs font-mono">
          <div className="grid grid-cols-2 gap-2">
            <div className="border border-neutral-700 bg-neutral-950 p-2">
              <div className="text-neutral-500 uppercase text-xs">Output</div>
              <div className="text-white font-bold">Raw Ore + Random Purity</div>
            </div>
            <div className="border border-neutral-700 bg-neutral-950 p-2">
              <div className="text-neutral-500 uppercase text-xs">Tier Variance</div>
              <div className="text-white font-bold">T4 Node → T3/T4/T5 Ore</div>
            </div>
          </div>
        
        </div>
      </div>

      {/* Refining with Graph */}
      <div className="border-2 border-blue-600 bg-black p-4">
        <h3 className="text-sm font-black tracking-widest text-blue-500 uppercase mb-3">⚗️ REFINING</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Formula */}
          <div className="space-y-2">
            <div className="text-xs text-neutral-500 uppercase font-bold">Formula (per cycle)</div>
            <div className="border border-neutral-700 bg-neutral-950 p-3 font-mono text-xs space-y-2">
              <div>
                <div className="text-neutral-600">Quantity:</div>
                <div className="text-white">output = input × <span className="text-red-400">0.8</span></div>
                <div className="text-neutral-600 text-xs">// 20% loss</div>
              </div>
              <div>
                <div className="text-neutral-600">Purity:</div>
                <div className="text-white">new = (100 - cur) × <span className="text-green-400">0.3</span> + cur</div>
                <div className="text-neutral-600 text-xs">// 30% toward 100%</div>
              </div>
              <div>
                <div className="text-neutral-600">ISK Cost:</div>
                <div className="text-white">10 × qty × tier × purity^3</div>
                <div className="text-neutral-600 text-xs">{'// Exponential >90%'}</div>
              </div>
            </div>
          </div>
          
          {/* Diminishing Returns Graph */}
          <div>
            <div className="text-xs text-neutral-500 uppercase font-bold mb-2">Diminishing Returns</div>
            <div className="border border-neutral-700 bg-neutral-950 p-3">
              {refiningCycles.map((c, i) => (
                <div key={i} className="flex items-center gap-2 mb-1">
                  <div className="text-xs text-neutral-600 w-16 tabular-nums">C{c.cycle}:</div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="h-3 bg-red-900 border-r-2 border-red-500" style={{ width: `${c.quantity / 10}px` }} />
                    <span className="text-xs text-neutral-500 tabular-nums">{c.quantity}</span>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="h-3 bg-green-900 border-r-2 border-green-500" style={{ width: `${c.purity}px` }} />
                    <span className="text-xs text-green-400 tabular-nums font-bold">{c.purity.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
              <div className="text-xs text-neutral-600 mt-2 font-mono">
                // RED: QUANTITY | GREEN: PURITY
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tier vs Purity Explanation */}
      <div className="border-2 border-yellow-600 bg-black p-4">
        <h3 className="text-sm font-black tracking-widest text-yellow-500 uppercase mb-3">⚠️ TIER VS PURITY</h3>
        
        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          {/* Tier */}
          <div className="border border-neutral-700 bg-neutral-950 p-3">
            <div className="text-yellow-400 font-black uppercase mb-2">TIER (T1-T5)</div>
            <div className="space-y-2 text-neutral-400">
              <div><span className="text-white">What:</span> Material quality grade</div>
              <div><span className="text-white">Determines:</span> Base attribute values</div>
              <div><span className="text-white">Source:</span> Mining drop (node tier)</div>
              <div><span className="text-white">Changeable:</span> <span className="text-red-400">NO - Permanent</span></div>
              <div className="border-t border-neutral-800 pt-2 mt-2">
                <div className="text-neutral-600">Example:</div>
                <div>T1: 200 strength (×1.0)</div>
                <div>T3: 400 strength (×2.0)</div>
                <div>T5: 600 strength (×3.0)</div>
              </div>
            </div>
          </div>
          
          {/* Purity */}
          <div className="border border-neutral-700 bg-neutral-950 p-3">
            <div className="text-cyan-400 font-black uppercase mb-2">PURITY (0-100%)</div>
            <div className="space-y-2 text-neutral-400">
              <div><span className="text-white">What:</span> Contamination level</div>
              <div><span className="text-white">Determines:</span> Final stat multiplier</div>
              <div><span className="text-white">Source:</span> Random on mining</div>
              <div><span className="text-white">Changeable:</span> <span className="text-green-400">YES - Refining</span></div>
              <div className="border-t border-neutral-800 pt-2 mt-2">
                <div className="text-neutral-600">Example:</div>
                <div>40% purity → ×0.4 mult</div>
                <div>70% purity → ×0.7 mult</div>
                <div>100% purity → ×1.0 mult</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-3 border border-orange-600 bg-orange-950/10 p-3 text-xs font-mono">
          <div className="text-orange-400 font-bold mb-1">⚠️ CRUCIBLE RESTRICTION:</div>
          <div className="text-neutral-400">
            Can only mix materials with:<br/>
            • Same name (Titanium + Titanium only)<br/>
            • Same tier (T3 + T3 only)<br/>
            • Same state (🪨 ore OR ✨ mineral, not both)<br/>
            <br/>
            <span className="text-white">Different purities CAN be mixed</span> → weighted average
          </div>
        </div>
      </div>

      {/* Material Properties */}
      <div className="border-2 border-purple-600 bg-black p-4">
        <h3 className="text-sm font-black tracking-widest text-purple-500 uppercase mb-3">📊 MATERIAL ATTRIBUTES</h3>
        
        <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
          {/* Structural */}
          <div className="border border-neutral-700 bg-neutral-950 p-3">
            <div className="text-blue-400 font-black uppercase mb-2">Structural</div>
            <div className="space-y-1 text-neutral-400">
              <div><span className="text-white">Titanium:</span> HP, Armor</div>
              <div><span className="text-white">Iron:</span> Armor, Heavy</div>
              <div><span className="text-white">Aluminum:</span> Light, Weak</div>
            </div>
          </div>
          
          {/* Energy */}
          <div className="border border-neutral-700 bg-neutral-950 p-3">
            <div className="text-purple-400 font-black uppercase mb-2">Energy</div>
            <div className="space-y-1 text-neutral-400">
              <div><span className="text-white">Plasma:</span> Recharge, Power</div>
              <div><span className="text-white">Quantum:</span> Exotic, Fast</div>
              <div><span className="text-white">Dark matter:</span> Unstable, High</div>
            </div>
          </div>
          
          {/* Electronics */}
          <div className="border border-neutral-700 bg-neutral-950 p-3">
            <div className="text-yellow-400 font-black uppercase mb-2">Electronics</div>
            <div className="space-y-1 text-neutral-400">
              <div><span className="text-white">Silicon:</span> Sensors, Tracking</div>
              <div><span className="text-white">Copper:</span> Conductivity</div>
              <div><span className="text-white">Gold:</span> Premium Conduct</div>
            </div>
          </div>
        </div>
        
        <div className="border border-neutral-700 bg-neutral-950 p-3 text-xs font-mono">
          <div className="text-neutral-500 uppercase mb-1">Attribute System</div>
          <div className="space-y-1 text-neutral-400">
            <div>• <span className="text-white">6 Attributes:</span> strength, conductivity, density, reactivity, stability, elasticity</div>
            <div>• <span className="text-white">Tier Scaling:</span> T1=1.0×, T2=1.5×, T3=2.0×, T4=2.5×, T5=3.0×</div>
            <div>• <span className="text-white">View all:</span> /admin/materials</div>
          </div>
        </div>
      </div>

      {/* Manufacturing */}
      <div className="border-2 border-green-600 bg-black p-4">
        <h3 className="text-sm font-black tracking-widest text-green-500 uppercase mb-3">🏭 MANUFACTURING</h3>
        
        <div className="space-y-3">
          {/* Formula */}
          <div className="border border-neutral-700 bg-neutral-950 p-3">
            <div className="text-xs text-neutral-500 uppercase font-bold mb-2">Core Formula</div>
            <div className="font-mono text-sm text-white bg-black border border-neutral-800 p-2">
              finalStat = baseStat × (materialAttribute / 100) × purity
            </div>
          </div>
          
          {/* Example Calculation */}
          <div className="border border-green-700 bg-green-950/20 p-3">
            <div className="text-xs text-green-400 uppercase font-bold mb-2">Example: Shield Generator</div>
            <div className="space-y-2 text-xs font-mono">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-neutral-500">Base shieldHP:</div>
                <div className="text-white col-span-2">100</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-neutral-500">Material:</div>
                <div className="text-white col-span-2">T3 Titanium (strength: 400)</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-neutral-500">Purity:</div>
                <div className="text-white col-span-2">60%</div>
              </div>
              <div className="border-t border-green-800 pt-2 grid grid-cols-3 gap-2">
                <div className="text-green-400 font-bold">Result:</div>
                <div className="text-green-400 font-bold col-span-2">100 × (400/100) × 0.6 = 240 HP</div>
              </div>
            </div>
          </div>
          
          {/* Blueprint Mapping */}
          <div className="border border-neutral-700 bg-neutral-950 p-3 text-xs font-mono">
            <div className="text-neutral-500 uppercase mb-2">Material → Stat Mapping</div>
            <div className="space-y-1 text-neutral-400">
              <div>• Blueprints define which materials affect which stats</div>
              <div>• Example: <span className="text-white">Titanium</span> → shieldHP, armor</div>
              <div>• Example: <span className="text-white">Plasma</span> → rechargeRate, powerDraw</div>
              <div>• Different materials = asymmetric module outputs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Example Walkthrough */}
      <div className="border-2 border-yellow-600 bg-black p-4">
        <h3 className="text-sm font-black tracking-widest text-yellow-500 uppercase mb-3">⚡ FULL PIPELINE EXAMPLE</h3>
        
        <div className="space-y-3 text-xs font-mono">
          <div className="border-l-4 border-orange-600 bg-orange-950/10 p-3">
            <div className="text-orange-400 font-bold mb-1">STEP 1: Mine 1000 Titanium Ore @ 40% purity</div>
            <div className="text-neutral-500">Click Titanium Asteroid → Cargo Hold</div>
          </div>
          
          <div className="border-l-4 border-blue-600 bg-blue-950/10 p-3">
            <div className="text-blue-400 font-bold mb-1">STEP 2: Refine 3 cycles</div>
            <div className="text-neutral-400 space-y-1">
              <div>Cycle 1: 1000 @ 40% → 800 @ 58% (-200 units)</div>
              <div>Cycle 2: 800 @ 58% → 640 @ 70.6%</div>
              <div>Cycle 3: 640 @ 70.6% → 512 @ 79.4%</div>
            </div>
            <div className="text-green-400 mt-2">Result: 512 Titanium @ 79.4% purity</div>
          </div>
          
          <div className="border-l-4 border-green-600 bg-green-950/10 p-3">
            <div className="text-green-400 font-bold mb-1">STEP 3: Craft Shield Generator Mk1</div>
            <div className="text-neutral-400 space-y-1">
              <div>Blueprint requires: 50× Titanium</div>
              <div>Using T3 Titanium @ 79.4% purity</div>
              <div>T3 strength attribute: 400 (= 200 base × 2.0 tier mult)</div>
              <div className="text-white mt-2">Calculation:</div>
              <div>shieldHP = 100 × (400/100) × 0.794</div>
              <div className="text-green-400 font-bold">= 317.6 HP (3.17× base!)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Reference */}
      <div className="grid grid-cols-2 gap-2">
        <div className="border border-neutral-700 bg-neutral-950 p-3 text-xs">
          <div className="text-orange-500 font-black uppercase mb-2">Refining Costs</div>
          <div className="font-mono space-y-1 text-neutral-400">
            <div>40% → 58%: ~1K ORE</div>
            <div>70% → 80%: ~5K ORE</div>
            <div>90% → 95%: ~50K ORE (exponential!)</div>
            <div>95% → 99%: ~1M ORE (whale tier)</div>
          </div>
        </div>
        
        <div className="border border-neutral-700 bg-neutral-950 p-3 text-xs">
          <div className="text-green-500 font-black uppercase mb-2">Power Curve</div>
          <div className="font-mono space-y-1 text-neutral-400">
            <div>T1 @ 50% purity: 1.0× base stats</div>
            <div>T3 @ 70% purity: 2.8× base stats</div>
            <div>T5 @ 95% purity: 5.7× base stats</div>
            <div>T5 @ 100% purity: 6.0× base stats (cap)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

