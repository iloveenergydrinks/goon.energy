"use client";
import { useState } from "react";
import { useFittingStore } from "@/store/useFittingStore";

export default function HullStep() {
  const catalogReady = useFittingStore((s) => s.catalogReady);
  const compatibleHulls = useFittingStore((s) => s.compatibleHulls);
  const selectedHullId = useFittingStore((s) => s.selectedHullId);
  const selectHull = useFittingStore((s) => s.selectHull);
  const selectedPrimaryId = useFittingStore((s) => s.selectedPrimaryId);
  const selectedSecondaryIds = useFittingStore((s) => s.selectedSecondaryIds);
  const primaries = useFittingStore((s) => s.primaries);
  const secondaries = useFittingStore((s) => s.secondaries);

  const primary = primaries.find(p => p.id === selectedPrimaryId);
  const selectedSecondaries = secondaries.filter(s => selectedSecondaryIds.includes(s.id));

  // State for filters
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [expandedHullId, setExpandedHullId] = useState<string | null>(null);

  // Do not auto-select a hull; allow user to choose hull or primary first.

  const selectedHullCompatible = selectedHullId
    ? compatibleHulls.some((hull) => hull.id === selectedHullId)
    : true;

  // Calculate totals for display
  const totalPower = (primary?.powerDraw || 0) + 
    selectedSecondaries.reduce((sum, s) => sum + s.powerDraw, 0);

  // Get unique archetypes and sizes
  const archetypes = Array.from(new Set(compatibleHulls.map(h => h.archetype).filter(Boolean))).sort() as string[];
  const sizes = ["Frigate", "Destroyer", "Cruiser"];

  // Filter hulls based on selected filters
  const filteredHulls = compatibleHulls.filter(hull => {
    if (selectedArchetype && hull.archetype !== selectedArchetype) return false;
    if (selectedSize && hull.sizeId !== selectedSize) return false;
    return true;
  });

  if (!catalogReady) {
    return (
      <div className="text-xs text-neutral-500 uppercase tracking-[0.4em] border border-neutral-800/60 rounded-md px-3 py-4 text-center">
        Loading hulls…
      </div>
    );
  }
  if (compatibleHulls.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Step 1: Choose Hull</h2>
          <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg mt-4">
            <p className="text-red-400 font-medium">No Compatible Hulls Found</p>
            <p className="text-sm text-neutral-400 mt-2">
              The selected weapon combination requires:
            </p>
            <ul className="text-sm text-neutral-500 mt-2 list-disc list-inside">
              <li>Power Capacity: {totalPower}</li>
            </ul>
            <p className="text-sm text-neutral-400 mt-3">
              Try selecting different secondary weapons or a different primary weapon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <p className="text-sm text-neutral-400">
          {filteredHulls.length} of {compatibleHulls.length} hulls shown
        </p>
        {(selectedPrimaryId || selectedSecondaries.length > 0) && (
          <div className="flex gap-4 mt-1 text-xs">
            <span className="text-neutral-500">Power Demand: <span className="text-amber-400">{totalPower}</span></span>
          </div>
        )}
        {!selectedHullCompatible && (
          <div className="mt-2 p-2 rounded border border-amber-500/40 bg-amber-500/10 text-xs text-amber-300">
            Selected hull incompatible with weapons. Choose a different hull.
          </div>
        )}
      </div>

      {/* Archetype Tabs */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setSelectedArchetype(null)}
          className={`px-3 py-1.5 text-xs rounded border transition-colors ${
            !selectedArchetype 
              ? 'border-blue-500 bg-blue-500/20 text-blue-300' 
              : 'border-neutral-700 hover:border-neutral-600 text-neutral-400'
          }`}
        >
          All ({compatibleHulls.length})
        </button>
        {archetypes.map(arch => {
          const count = compatibleHulls.filter(h => h.archetype === arch).length;
          return (
            <button
              key={arch}
              onClick={() => setSelectedArchetype(arch === selectedArchetype ? null : arch)}
              className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                selectedArchetype === arch 
                  ? 'border-blue-500 bg-blue-500/20 text-blue-300' 
                  : 'border-neutral-700 hover:border-neutral-600 text-neutral-400'
              }`}
            >
              {arch} ({count})
            </button>
          );
        })}
      </div>

      {/* Size Filter */}
      <div className="flex gap-1">
        <button
          onClick={() => setSelectedSize(null)}
          className={`px-3 py-1 text-xs rounded border transition-colors ${
            !selectedSize 
              ? 'border-green-500 bg-green-500/20 text-green-300' 
              : 'border-neutral-700 hover:border-neutral-600 text-neutral-400'
          }`}
        >
          All Sizes
        </button>
        {sizes.map(size => (
          <button
            key={size}
            onClick={() => setSelectedSize(size === selectedSize ? null : size)}
            className={`px-3 py-1 text-xs rounded border transition-colors ${
              selectedSize === size 
                ? 'border-green-500 bg-green-500/20 text-green-300' 
                : 'border-neutral-700 hover:border-neutral-600 text-neutral-400'
            }`}
          >
            {size}
          </button>
        ))}
      </div>

      {/* Hull Grid */}
      <div className="grid grid-cols-2 gap-2">
        {filteredHulls.map((hull) => {
          const powerSlots = hull.grid.slots.filter(s => s.type === "Power").length;
          const ammoSlots = hull.grid.slots.filter(s => s.type === "Ammo").length;
          const utilitySlots = hull.grid.slots.filter(s => s.type === "Utility").length;
          const isSelected = selectedHullId === hull.id;
          const isExpanded = expandedHullId === hull.id;

          return (
            <div
              key={hull.id}
              className={`border rounded-md transition-all overflow-hidden ${
                isSelected
                  ? selectedHullCompatible
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-amber-500 bg-amber-500/10'
                  : 'border-neutral-700 hover:border-neutral-600 bg-neutral-900/50'
              }`}
            >
              {/* Compact View */}
              <button
                onClick={() => selectHull(isSelected ? null : hull.id)}
                className="w-full p-3 text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-white/90 truncate">{hull.name}</div>
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 whitespace-nowrap">
                        {hull.sizeId.substring(0, 3).toUpperCase()}
                      </span>
                      {hull.archetype && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 whitespace-nowrap">
                          {hull.archetype.substring(0, 3).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="text-xs text-blue-400 flex-shrink-0">✓</div>
                  )}
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-neutral-500">PWR</span>
                    <span className={`ml-1 ${totalPower > hull.powerCapacity ? 'text-red-400' : 'text-neutral-300'}`}>
                      {hull.powerCapacity}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">BW</span>
                    <span className="ml-1 text-neutral-300">{hull.bandwidthLimit}</span>
                  </div>
                </div>

                <div className="mt-2 text-xs text-neutral-400">
                  P:{powerSlots} A:{ammoSlots} U:{utilitySlots}
                </div>

                {/* Base Stats Preview */}
                {hull.baseStats && (
                  <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                    <div className="text-neutral-500">
                      HP <span className="text-neutral-400">{hull.baseStats.hull}</span>
                    </div>
                    <div className="text-neutral-500">
                      SPD <span className="text-neutral-400">{hull.baseStats.speed}</span>
                    </div>
                  </div>
                )}
              </button>

              {/* Expand/Collapse Button */}
              <button
                onClick={() => setExpandedHullId(isExpanded ? null : hull.id)}
                className="w-full px-3 pb-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                {isExpanded ? '▲ Less' : '▼ More'}
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-3 pb-3 border-t border-neutral-700 pt-2">
                  {hull.description && (
                    <p className="text-xs text-neutral-400 mb-2">{hull.description}</p>
                  )}
                  
                  {/* Grid visualization */}
                  <div
                    className="inline-grid gap-[1px] p-1 rounded border border-neutral-800 bg-neutral-950"
                    style={{ gridTemplateColumns: `repeat(${hull.grid.cols}, 0.9rem)` }}
                  >
                    {Array.from({ length: hull.grid.rows * hull.grid.cols }).map((_, idx) => {
                      const r = Math.floor(idx / hull.grid.cols);
                      const c = idx % hull.grid.cols;
                      const slot = hull.grid.slots.find((s) => s.r === r && s.c === c);
                      const color = slot?.type === "Power" ? "bg-blue-900" : 
                                   slot?.type === "Ammo" ? "bg-orange-900" : 
                                   slot?.type === "Utility" ? "bg-green-900" : "bg-neutral-800";
                      return (
                        <div
                          key={idx}
                          className={`w-3 h-3 ${color} border border-neutral-700`}
                        />
                      );
                    })}
                  </div>

                  {/* Full Stats */}
                  {hull.baseStats && (
                    <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                      <div className="text-neutral-500">
                        Hull <span className="text-neutral-300">{hull.baseStats.hull}</span>
                      </div>
                      <div className="text-neutral-500">
                        Armor <span className="text-neutral-300">{hull.baseStats.armor}</span>
                      </div>
                      <div className="text-neutral-500">
                        Speed <span className="text-neutral-300">{hull.baseStats.speed}</span>
                      </div>
                      <div className="text-neutral-500">
                        Evasion <span className="text-neutral-300">{hull.baseStats.evasion}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredHulls.length === 0 && (
        <div className="text-center py-8 text-sm text-neutral-500">
          No hulls match the selected filters
        </div>
      )}
    </div>
  );
}
