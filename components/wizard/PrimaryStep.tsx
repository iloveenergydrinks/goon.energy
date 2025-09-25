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
    // First apply hard constraints (power, slots, incompatible tags). Do NOT hard-gate by compatible tags.
    const base = primaries.filter((primary) => {
      if (!selectedHull) return true;

      const totalPower = primary.powerDraw + selectedSecondaries.reduce((sum, s) => sum + s.powerDraw, 0);
      if (totalPower > selectedHull.powerCapacity) return false;

      const powerSlots = selectedHull.grid.slots.filter((s) => s.type === "Power").length;
      const ammoSlots = selectedHull.grid.slots.filter((s) => s.type === "Ammo").length;

      const requiredPower = primary.minPowerSlots + selectedSecondaries.reduce((sum, s) => sum + s.deltaPowerSlots, 0);
      const requiredAmmo = (primary.minAmmoSlots ?? 0) + selectedSecondaries.reduce((sum, s) => sum + s.deltaAmmoSlots, 0);

      if (powerSlots < requiredPower) return false;
      if (ammoSlots < requiredAmmo) return false;

      return true;
    });

    // If the hull advertises compatible tags, prefer those results first (soft class system)
    if (selectedHull?.compatibleTags?.length) {
      const comp = selectedHull.compatibleTags;
      return [...base].sort((a, b) => {
        const aMatch = a.tags.some((t) => comp.includes(t)) ? 1 : 0;
        const bMatch = b.tags.some((t) => comp.includes(t)) ? 1 : 0;
        return bMatch - aMatch;
      });
    }

    return base;
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
        {!selectedHull && (
          <p className="text-sm text-neutral-500 mt-2">Tip: You can pick a primary first; compatible hulls will filter automatically.</p>
        )}
      </div>

      <div className="grid gap-2">
        {filteredPrimaries.map((primary) => {
          const topStats = primary.baseStats ? Object.entries(primary.baseStats).slice(0, 2) : [];
          const isSelected = selectedPrimaryId === primary.id;
          return (
            <details key={primary.id} className={`rounded-md border transition-colors ${isSelected ? 'border-blue-500/80 bg-blue-500/5' : 'border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900/40'}`}>
              <summary className="cursor-pointer list-none p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-semibold text-sm text-white/90 truncate">{primary.name}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 shrink-0">Pwr {primary.powerDraw}</span>
                  {primary.archetypeFocus && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 uppercase tracking-[0.25em] shrink-0">{String(primary.archetypeFocus)}</span>
                  )}
                  {topStats.map(([k, v]) => (
                    <span key={k} className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 shrink-0">
                      {k}: {String(v)}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${isSelected ? 'border-blue-500 text-blue-400' : 'border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:text-white'}`}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); selectPrimary(isSelected ? null : primary.id); }}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </button>
                  <span className="text-xs text-neutral-500">More</span>
                </div>
              </summary>
              <div className="px-3 pb-3 space-y-3">
                <p className="text-sm text-neutral-400">{primary.description}</p>
                {primary.baseStats && (
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {Object.entries(primary.baseStats).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-1">
                        <span className="text-neutral-500 capitalize">{key}:</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-1 flex-wrap">
                  {primary.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-1 bg-neutral-800 rounded">{tag}</span>
                  ))}
                  {selectedHull?.sizeId && (
                    <span className="text-xs px-2 py-1 border border-neutral-700/70 rounded-sm text-neutral-300 uppercase tracking-[0.35em]">Scales to {selectedHull.sizeId}</span>
                  )}
                </div>
              </div>
            </details>
          );
        })}
      </div>

      <div className="text-xs text-neutral-500 border-t border-neutral-800 pt-3">
        Selecting a primary will automatically filter viable secondaries and modules.
      </div>
    </div>
  );
}
