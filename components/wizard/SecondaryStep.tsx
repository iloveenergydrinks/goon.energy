"use client";
import { useEffect, useMemo } from "react";
import { useFittingStore } from "@/store/useFittingStore";

export default function SecondaryStep() {
  const catalogReady = useFittingStore((s) => s.catalogReady);
  const secondaries = useFittingStore((s) => s.secondaries);
  const selectedSecondaryIds = useFittingStore((s) => s.selectedSecondaryIds);
  const toggleSecondary = useFittingStore((s) => s.toggleSecondary);
  const selectedHullId = useFittingStore((s) => s.selectedHullId);
  const hulls = useFittingStore((s) => s.hulls);
  const selectedPrimaryId = useFittingStore((s) => s.selectedPrimaryId);
  const primaries = useFittingStore((s) => s.primaries);

  const primary = primaries.find((p) => p.id === selectedPrimaryId);
  const selectedHull = hulls.find((h) => h.id === selectedHullId);

  const filteredSecondaries = useMemo(() => {
    if (!selectedHull || !primary) return [] as typeof secondaries;

    const currentlySelected = selectedSecondaryIds
      .map((id) => secondaries.find((s) => s?.id === id))
      .filter((s): s is (typeof secondaries)[number] => Boolean(s));

    const base = secondaries.filter((secondary) => {
      const isAlreadySelected = selectedSecondaryIds.includes(secondary.id);

      const totalPower =
        primary.powerDraw +
        currentlySelected.reduce((sum, s) => sum + s.powerDraw, 0) +
        (isAlreadySelected ? 0 : secondary.powerDraw);
      if (totalPower > selectedHull.powerCapacity) return false;

      const powerSlots = selectedHull.grid.slots.filter((s) => s.type === "Power").length;
      const ammoSlots = selectedHull.grid.slots.filter((s) => s.type === "Ammo").length;
      const utilitySlots = selectedHull.grid.slots.filter((s) => s.type === "Utility").length;

      const requiredPower =
        primary.minPowerSlots +
        currentlySelected.reduce((sum, s) => sum + s.deltaPowerSlots, 0) +
        (isAlreadySelected ? 0 : secondary.deltaPowerSlots);
      const requiredAmmo =
        (primary.minAmmoSlots ?? 0) +
        currentlySelected.reduce((sum, s) => sum + s.deltaAmmoSlots, 0) +
        (isAlreadySelected ? 0 : secondary.deltaAmmoSlots);
      const requiredUtility =
        currentlySelected.reduce((sum, s) => sum + s.deltaUtilitySlots, 0) +
        (isAlreadySelected ? 0 : secondary.deltaUtilitySlots);

      if (powerSlots < requiredPower) return false;
      if (ammoSlots < requiredAmmo) return false;
      if (utilitySlots < requiredUtility) return false;

      return true;
    });

    if (selectedHull?.compatibleTags?.length) {
      const comp = selectedHull.compatibleTags;
      return [...base].sort((a, b) => {
        const aMatch = a.tags.some((t) => comp.includes(t)) ? 1 : 0;
        const bMatch = b.tags.some((t) => comp.includes(t)) ? 1 : 0;
        return bMatch - aMatch;
      });
    }

    return base;
  }, [primary, selectedHull, secondaries, selectedSecondaryIds]);

  const visibleSecondaryIds = useMemo(
    () => new Set(filteredSecondaries.map((s) => s.id)),
    [filteredSecondaries]
  );

  const sanitizedSelected = useMemo(
    () => selectedSecondaryIds.filter((id) => visibleSecondaryIds.has(id)),
    [selectedSecondaryIds, visibleSecondaryIds]
  );

  const extraSelected = useMemo(
    () => selectedSecondaryIds.filter((id) => !visibleSecondaryIds.has(id)),
    [selectedSecondaryIds, visibleSecondaryIds]
  );

  useEffect(() => {
    if (extraSelected.length === 0) return;
    extraSelected.forEach((id) => toggleSecondary(id));
  }, [extraSelected, toggleSecondary]);

  if (!catalogReady) {
    return (
      <div className="text-xs text-neutral-500 uppercase tracking-[0.4em] border border-neutral-800/60 rounded-md px-3 py-4 text-center">
        Loading secondary systems…
      </div>
    );
  }
  if (!selectedHull || !primary) {
    return (
      <div className="text-sm text-neutral-500">
        Select a hull or a primary first to view compatible secondary systems.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-neutral-500">
          Select up to 2 secondary systems to complement your {primary.name}.
        </p>
        <p className="text-sm text-neutral-600 mt-1">
          Selected: {sanitizedSelected.length}/2
        </p>
        <p className="text-sm text-neutral-400 mt-2">
          Current Hull: <span className="text-white font-medium">{selectedHull.name}</span>
          <span className="ml-2 px-2 py-0.5 bg-neutral-900/80 border border-neutral-700/60 rounded-sm uppercase tracking-[0.35em] text-neutral-300 text-xs">
            {selectedHull.sizeId}
          </span>
        </p>
      </div>

      <div className="grid gap-2">
        {filteredSecondaries.length === 0 && (
          <div className="text-sm text-neutral-500">
            No compatible secondary systems available with the current configuration.
          </div>
        )}

        {filteredSecondaries.map((secondary) => {
          const isSelected = sanitizedSelected.includes(secondary.id);
          const isDisabled = !isSelected && sanitizedSelected.length >= 2;

          return (
            <details key={secondary.id} className={`rounded-md border transition-colors ${isSelected ? 'border-blue-500/80 bg-blue-500/5' : 'border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900/40'}`}>
              <summary className="cursor-pointer list-none p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-semibold text-sm text-white/90 truncate">{secondary.name}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded ${secondary.category === 'Offensive' ? 'bg-red-500/20 text-red-400' : secondary.category === 'Defensive' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>{secondary.category}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-red-500/20 text-red-400">Pwr {secondary.powerDraw}</span>
                  {(secondary.deltaPowerSlots !== 0 || secondary.deltaAmmoSlots !== 0 || secondary.deltaUtilitySlots !== 0) && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">ΔP/A/U {secondary.deltaPowerSlots}/{secondary.deltaAmmoSlots}/{secondary.deltaUtilitySlots}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${isSelected ? 'border-blue-500 text-blue-400' : isDisabled ? 'border-neutral-800 text-neutral-600 cursor-not-allowed' : 'border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:text-white'}`}
                    disabled={isDisabled}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!isDisabled) toggleSecondary(secondary.id); }}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </button>
                  <span className="text-xs text-neutral-500">More</span>
                </div>
              </summary>
              <div className="px-3 pb-3 space-y-3">
                <p className="text-sm text-neutral-400">{secondary.description}</p>
                <div className="flex gap-1 flex-wrap">
                  {secondary.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-1 bg-neutral-800 rounded">{tag}</span>
                  ))}
                  <span className="text-xs px-2 py-1 border border-neutral-700/70 rounded-sm text-neutral-300 uppercase tracking-[0.35em]">Scales to {selectedHull.sizeId}</span>
                </div>
              </div>
            </details>
          );
        })}
      </div>

      <div className="text-xs text-neutral-500 border-t border-neutral-800 pt-3">
        Secondary choices further constrain available modules.
      </div>
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: number }) {
  const positive = value >= 0;
  return (
    <div className="flex items-center gap-1">
      <span className="text-neutral-500">{label}:</span>
      <span className={positive ? 'text-green-400' : 'text-red-400'}>
        {positive ? '+' : ''}{value}
      </span>
    </div>
  );
}
