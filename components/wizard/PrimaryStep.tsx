"use client";
import { useEffect, useMemo } from "react";
import { useFittingStore } from "@/store/useFittingStore";

export default function PrimaryStep() {
  const catalogReady = useFittingStore((s) => s.catalogReady);
  const hulls = useFittingStore((s) => s.hulls);
  const primaries = useFittingStore((s) => s.primaries);
  const selectedPrimaryId = useFittingStore((s) => s.selectedPrimaryId);
  const selectedHullId = useFittingStore((s) => s.selectedHullId);
  const selectPrimary = useFittingStore((s) => s.selectPrimary);
  const secondaries = useFittingStore((s) => s.secondaries);
  const selectedSecondaryIds = useFittingStore((s) => s.selectedSecondaryIds);

  const selectedHull = hulls.find((h) => h.id === selectedHullId);
  const selectedSecondaries = secondaries.filter((s) => selectedSecondaryIds.includes(s.id));

  const filteredPrimaries = useMemo(() => {
    return primaries.filter((primary) => {
      if (!selectedHull) return true;

      const totalPower = primary.powerDraw + selectedSecondaries.reduce((sum, s) => sum + s.powerDraw, 0);
      if (totalPower > selectedHull.powerCapacity) return false;

      const powerSlots = selectedHull.grid.slots.filter((s) => s.type === "Power").length;
      const ammoSlots = selectedHull.grid.slots.filter((s) => s.type === "Ammo").length;

      const requiredPower = primary.minPowerSlots + selectedSecondaries.reduce((sum, s) => sum + s.deltaPowerSlots, 0);
      const requiredAmmo = (primary.minAmmoSlots ?? 0) + selectedSecondaries.reduce((sum, s) => sum + s.deltaAmmoSlots, 0);

      if (powerSlots < requiredPower) return false;
      if (ammoSlots < requiredAmmo) return false;

      if (selectedHull.incompatibleTags?.some((tag) => primary.tags.includes(tag))) {
        return false;
      }

      if (selectedHull.compatibleTags?.length) {
        const hasCompatibleTag = primary.tags.some((tag) => selectedHull.compatibleTags?.includes(tag));
        if (!hasCompatibleTag) return false;
      }

      return true;
    });
  }, [primaries, selectedHull, selectedSecondaries]);

  useEffect(() => {
    if (!selectedPrimaryId) {
      return;
    }

    const stillValid = filteredPrimaries.some((primary) => primary.id === selectedPrimaryId);
    if (!stillValid) {
      selectPrimary(null);
    }
  }, [filteredPrimaries, selectedPrimaryId, selectPrimary]);

  if (!catalogReady) {
    return (
      <div className="text-xs text-neutral-500 uppercase tracking-[0.4em] border border-neutral-800/60 rounded-md px-3 py-4 text-center">
        Loading primary systems…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-neutral-400 text-sm">Select your main weapon system. Requirements are compared against the selected hull.</p>
        {selectedHull && (
          <p className="text-sm text-neutral-400 mt-2">
            Current Hull: <span className="text-white font-medium">{selectedHull.name}</span> — Power Capacity {selectedHull.powerCapacity}, Bandwidth Limit {selectedHull.bandwidthLimit}
            <span className="ml-2 px-2 py-0.5 bg-neutral-900/80 border border-neutral-700/60 rounded-sm uppercase tracking-[0.35em] text-neutral-300 text-xs">
              {selectedHull.sizeId}
            </span>
          </p>
        )}
      </div>

      <div className="grid gap-3">
        {filteredPrimaries.map((primary) => (
          <button
            key={primary.id}
            onClick={() => selectPrimary(primary.id)}
            className={`
              p-4 rounded-md border border-neutral-800 text-left transition-colors
              ${selectedPrimaryId === primary.id
                ? 'border-blue-500/80 bg-blue-500/10 text-white'
                : 'hover:border-neutral-600 hover:bg-neutral-900'
              }
            `}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{primary.name}</h3>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded">
                  Power: {primary.powerDraw}
                </span>
              </div>
            </div>
            <p className="text-sm text-neutral-400 mb-3">{primary.description}</p>
            
            <div className="grid grid-cols-4 gap-2 text-xs">
              {primary.baseStats && Object.entries(primary.baseStats).map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <span className="text-neutral-500 capitalize">{key}:</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-1 mt-3">
              {primary.tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-1 bg-neutral-800 rounded">
                  {tag}
                </span>
              ))}
              {selectedHull?.sizeId && (
                <span className="text-xs px-2 py-1 border border-neutral-700/70 rounded-sm text-neutral-300 uppercase tracking-[0.35em]">
                  Scales to {selectedHull.sizeId}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="text-xs text-neutral-500 border-t border-neutral-800 pt-3">
        Selecting a primary will automatically filter viable secondaries and modules.
      </div>
    </div>
  );
}
