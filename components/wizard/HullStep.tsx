"use client";
import { useFittingStore } from "@/store/useFittingStore";
import { useRouter } from "next/navigation";
import { SLOT_COLORS } from "@/lib/colors";

export default function HullStep() {
  const compatibleHulls = useFittingStore((s) => s.compatibleHulls);
  const selectedHullId = useFittingStore((s) => s.selectedHullId);
  const selectHull = useFittingStore((s) => s.selectHull);
  const generateFromHull = useFittingStore((s) => s.generateFromHull);
  const prevStep = useFittingStore((s) => s.prevStep);
  const selectedPrimaryId = useFittingStore((s) => s.selectedPrimaryId);
  const selectedSecondaryIds = useFittingStore((s) => s.selectedSecondaryIds);
  const primaries = useFittingStore((s) => s.primaries);
  const secondaries = useFittingStore((s) => s.secondaries);
  const router = useRouter();

  const primary = primaries.find(p => p.id === selectedPrimaryId);
  const selectedSecondaries = secondaries.filter(s => selectedSecondaryIds.includes(s.id));

  const handleGenerate = () => {
    if (selectedHullId) {
      generateFromHull();
      router.push("/builder");
    }
  };

  // Calculate totals for display
  const totalPower = (primary?.powerDraw || 0) + 
    selectedSecondaries.reduce((sum, s) => sum + s.powerDraw, 0);

  if (compatibleHulls.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Step 3: Choose Hull</h2>
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
        <div className="flex justify-start">
          <button
            onClick={prevStep}
            className="px-6 py-2 rounded font-medium bg-neutral-700 hover:bg-neutral-600 text-white transition-all"
          >
            ← Back: Secondary Weapons
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Step 3: Choose Hull</h2>
        <p className="text-neutral-500">
          Select a hull that can support your {primary?.name} 
          {selectedSecondaries.length > 0 && ` with ${selectedSecondaries.map(s => s.name).join(' and ')}`}.
        </p>
        <div className="flex gap-4 mt-2 text-sm">
          <span className="text-neutral-400">Total Power Required: <span className="text-red-400">{totalPower}</span></span>
        </div>
      </div>

      <div className="grid gap-4">
        {compatibleHulls.map((hull) => {
          const powerSlots = hull.grid.slots.filter(s => s.type === "Power").length;
          const ammoSlots = hull.grid.slots.filter(s => s.type === "Ammo").length;
          const utilitySlots = hull.grid.slots.filter(s => s.type === "Utility").length;
          
          return (
            <button
              key={hull.id}
              onClick={() => selectHull(hull.id)}
              className={`
                p-4 rounded-lg border-2 text-left transition-all
                ${selectedHullId === hull.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-neutral-700 hover:border-neutral-500'
                }
              `}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{hull.name}</h3>
                  <p className="text-sm text-neutral-400">{hull.description}</p>
                </div>
                <div className="text-xs text-neutral-500">
                  {hull.grid.rows}×{hull.grid.cols} Grid
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Power Capacity:</span>
                    <span className={totalPower <= hull.powerCapacity ? 'text-green-400' : 'text-red-400'}>
                      {hull.powerCapacity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Bandwidth:</span>
                    <span>{hull.bandwidthLimit}</span>
                  </div>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Power Slots:</span>
                    <span className="text-yellow-400">{powerSlots}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Ammo Slots:</span>
                    <span className="text-red-400">{ammoSlots}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Utility Slots:</span>
                    <span className="text-blue-400">{utilitySlots}</span>
                  </div>
                </div>
              </div>

              {/* Grid Preview */}
              <div className="p-2 bg-neutral-900 rounded">
                <div 
                  className="grid gap-0.5"
                  style={{ gridTemplateColumns: `repeat(${hull.grid.cols}, 1fr)` }}
                >
                  {Array.from({ length: hull.grid.rows * hull.grid.cols }).map((_, idx) => {
                    const r = Math.floor(idx / hull.grid.cols);
                    const c = idx % hull.grid.cols;
                    const slot = hull.grid.slots.find(s => s.r === r && s.c === c);
                    return (
                      <div
                        key={idx}
                        className="aspect-square rounded-sm"
                        style={{
                          backgroundColor: slot 
                            ? SLOT_COLORS[slot.type] + '40'
                            : 'transparent',
                          border: slot ? `1px solid ${SLOT_COLORS[slot.type]}60` : '1px solid #333'
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {hull.baseStats && Object.keys(hull.baseStats).length > 0 && (
                <div className="grid grid-cols-4 gap-2 text-xs mt-3">
                  {Object.entries(hull.baseStats).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-neutral-500 capitalize">{key}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex justify-between">
        <button
          onClick={prevStep}
          className="px-6 py-2 rounded font-medium bg-neutral-700 hover:bg-neutral-600 text-white transition-all"
        >
          ← Back: Secondary Weapons
        </button>
        <button
          onClick={handleGenerate}
          disabled={!selectedHullId}
          className={`
            px-6 py-2 rounded font-medium transition-all
            ${selectedHullId
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
            }
          `}
        >
          Generate Ship →
        </button>
      </div>
    </div>
  );
}
