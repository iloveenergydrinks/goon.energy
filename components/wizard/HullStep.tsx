"use client";
import { useEffect } from "react";
import { useFittingStore } from "@/store/useFittingStore";
import type { Hull, PrimaryArchetype, SecondaryDef } from "@/types/fitting";

function hullSupportsPrimary(
  hull: Hull,
  primary: PrimaryArchetype,
  secondaries: SecondaryDef[]
): boolean {
  if (!hull || !primary) return false;

  const totalPower = primary.powerDraw + secondaries.reduce((sum, s) => sum + s.powerDraw, 0);
  if (totalPower > hull.powerCapacity) return false;

  const powerSlots = hull.grid.slots.filter((s) => s.type === "Power").length;
  const ammoSlots = hull.grid.slots.filter((s) => s.type === "Ammo").length;
  const utilitySlots = hull.grid.slots.filter((s) => s.type === "Utility").length;

  const requiredPower = primary.minPowerSlots + secondaries.reduce((sum, s) => sum + s.deltaPowerSlots, 0);
  const requiredAmmo = (primary.minAmmoSlots ?? 0) + secondaries.reduce((sum, s) => sum + s.deltaAmmoSlots, 0);
  const requiredUtility = secondaries.reduce((sum, s) => sum + s.deltaUtilitySlots, 0);

  if (powerSlots < requiredPower) return false;
  if (ammoSlots < requiredAmmo) return false;
  if (utilitySlots < requiredUtility) return false;

  const combinedTags = [
    ...primary.tags,
    ...secondaries.flatMap((s) => s.tags),
  ];

  if (hull.incompatibleTags?.some((tag) => combinedTags.includes(tag))) {
    return false;
  }

  return true;
}

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

  useEffect(() => {
    if (!selectedHullId && compatibleHulls.length > 0) {
      selectHull(compatibleHulls[0].id);
    }
  }, [selectedHullId, compatibleHulls, selectHull]);

  const selectedHullCompatible = selectedHullId
    ? compatibleHulls.some((hull) => hull.id === selectedHullId)
    : true;

  // Calculate totals for display
  const totalPower = (primary?.powerDraw || 0) + 
    selectedSecondaries.reduce((sum, s) => sum + s.powerDraw, 0);

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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Step 1: Choose Hull</h2>
        <p className="text-neutral-500">
          Start with your platform. Pick a hull, then we’ll layer weapons on top.
        </p>
        {(selectedPrimaryId || selectedSecondaries.length > 0) && (
          <div className="flex gap-4 mt-2 text-sm">
            <span className="text-neutral-400">Current Loadout Power Demand: <span className="text-red-400">{totalPower}</span></span>
          </div>
        )}
        {!selectedHullCompatible && (
          <div className="mt-3 p-3 rounded border border-amber-500/40 bg-amber-500/10 text-sm text-amber-300">
            The selected hull can no longer support your weapon choices. Pick a different hull to proceed.
          </div>
        )}
      </div>

      <div className="grid gap-3">
        {compatibleHulls.map((hull) => {
          const powerSlots = hull.grid.slots.filter(s => s.type === "Power").length;
          const ammoSlots = hull.grid.slots.filter(s => s.type === "Ammo").length;
          const utilitySlots = hull.grid.slots.filter(s => s.type === "Utility").length;

          const primariesThatFit = primaries
            .filter((p) => hullSupportsPrimary(hull, p, selectedSecondaries))
            .map((p) => p.name);

          const archetypeTagline = [
            hull.archetype ? hull.archetype.toUpperCase() : null,
            ...(hull.compatibleTags ?? []),
          ].filter(Boolean);

          const isSelected = selectedHullId === hull.id;

          return (
            <button
              key={hull.id}
              onClick={() => selectHull(hull.id)}
              className={`
                w-full text-left border border-neutral-800 rounded-md px-4 py-3 transition-colors
                ${isSelected
                  ? selectedHullCompatible
                    ? 'border-white/60 bg-neutral-950 text-white'
                    : 'border-amber-500 bg-neutral-950 text-amber-200'
                  : 'text-neutral-200 hover:border-neutral-600 hover:bg-neutral-900/40'}
              `}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-base font-semibold text-white/90">{hull.name}</span>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <span>{hull.grid.rows}×{hull.grid.cols}</span>
                  <span className="px-2 py-0.5 rounded-sm border border-neutral-700/60 bg-neutral-900/60 text-neutral-300 tracking-[0.3em] uppercase">
                    {hull.sizeId}
                  </span>
                </div>
              </div>

              {hull.description && (
                <p className="text-xs text-neutral-500 mt-2 leading-relaxed">{hull.description}</p>
              )}

              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-neutral-500 uppercase tracking-wide">power / bw</span>
                  <div className="mt-1 text-sm text-neutral-200">
                    {totalPower} → {hull.powerCapacity} / {hull.bandwidthLimit}
                  </div>
                </div>
                <div>
                  <span className="text-neutral-500 uppercase tracking-wide">slots P/A/U</span>
                  <div className="mt-1 text-sm text-neutral-200">
                    {powerSlots}/{ammoSlots}/{utilitySlots}
                  </div>
                </div>
              </div>

              <div
                className="mt-3 inline-grid gap-[1px] p-1 rounded border border-neutral-800 bg-neutral-950"
                style={{ gridTemplateColumns: `repeat(${hull.grid.cols}, 1.1rem)` }}
              >
                {Array.from({ length: hull.grid.rows * hull.grid.cols }).map((_, idx) => {
                  const r = Math.floor(idx / hull.grid.cols);
                  const c = idx % hull.grid.cols;
                  const slot = hull.grid.slots.find((s) => s.r === r && s.c === c);
                  const label = slot?.type === "Power" ? "P" : slot?.type === "Ammo" ? "A" : slot?.type === "Utility" ? "U" : "·";
                  return (
                    <div
                      key={idx}
                      className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[0.55rem] sm:text-[0.65rem] text-neutral-500 border border-neutral-800 bg-neutral-900"
                    >
                      {label}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 text-xs text-neutral-400">
                <span className="uppercase tracking-wide text-neutral-500">primaries</span>
                <div className="mt-1 text-neutral-200">
                  {primariesThatFit.length > 0 ? primariesThatFit.join(", ") : "None"}
                </div>
              </div>

              {(archetypeTagline.length > 0 || hull.archetype) && (
                <div className="mt-2 text-xs text-neutral-400">
                  <span className="uppercase tracking-wide text-neutral-500">tags</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {hull.archetype && (
                      <span className="px-2 py-0.5 border border-blue-500/40 text-blue-300/90 rounded-sm tracking-[0.35em] uppercase">
                        {hull.archetype}
                      </span>
                    )}
                    {archetypeTagline.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 border border-neutral-800 rounded text-neutral-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="text-xs text-neutral-500 border-t border-neutral-800 pt-3">
        Hull choice filters the primary, secondary, and module lists automatically.
      </div>
    </div>
  );
}
