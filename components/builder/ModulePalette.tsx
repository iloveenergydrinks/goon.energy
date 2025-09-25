"use client";
import { useMemo, useState } from "react";
import { useFittingStore } from "@/store/useFittingStore";
import type { ModuleDef, SlotType } from "@/types/fitting";
import { selectVariantForHull } from "@/lib/catalog/variants/resolveModuleVariants";
import { SLOT_COLORS } from "@/lib/colors";

function formatModuleTitle(module: ModuleDef): string {
  const name = module.familyName ?? module.id;
  if (module.variantTier) {
    return `${name} — ${formatTier(module.variantTier)}`;
  }
  return name;
}

function formatTier(tier: string): string {
  switch (tier) {
    case "frigate":
      return "Mk.I";
    case "destroyer":
      return "Mk.II";
    case "cruiser":
      return "Mk.III";
    case "capital":
      return "Mk.IV";
    default:
      return tier;
  }
}

function ModuleMeta({ module }: { module: ModuleDef }) {
  if (!module.minHullSize && !module.variantTier) return null;
  return (
    <div className="mt-2 text-[10px] uppercase tracking-[0.4em] text-neutral-600 flex flex-wrap gap-2">
      {module.minHullSize && (
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
          {module.minHullSize}
        </span>
      )}
      {module.variantTier && (
        <span className="flex items-center gap-1 text-neutral-500">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600/60" />
          {formatTier(module.variantTier)}
        </span>
      )}
    </div>
  );
}

export default function ModulePalette() {
  const modules = useFittingStore((s) => s.modules);
  const hulls = useFittingStore((s) => s.hulls);
  const selectedHullId = useFittingStore((s) => s.selectedHullId);
  const [slotFilter, setSlotFilter] = useState<SlotType | "All">("All");
  const selectedHull = hulls.find((h) => h.id === selectedHullId);
  const resolvedModules = useMemo(() => {
    return modules.map((module) => selectVariantForHull(module, selectedHull));
  }, [modules, selectedHull]);

  const filtered = resolvedModules.filter((m) => slotFilter === "All" || m.slot === slotFilter);
  const groupedBySlot = useMemo(() => {
    const grouped: Record<string, ModuleDef[]> = {};
    for (const entry of filtered) {
      if (!grouped[entry.slot]) grouped[entry.slot] = [];
      grouped[entry.slot].push(entry);
    }
    return grouped;
  }, [filtered]);

  const startDrag = useFittingStore((s) => s.startDrag);
  const draggingModuleId = useFittingStore((s) => s.draggingModuleId);
  const placed = useFittingStore((s) => s.placed);
  const placedCount = new Map<string, number>();
  for (const p of placed) placedCount.set(p.moduleId, (placedCount.get(p.moduleId) || 0) + 1);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["All", "Power", "Ammo", "Utility"] as const).map((k: "All" | SlotType) => {
          const isActive = slotFilter === k;
          return (
            <button
              key={k}
              onClick={() => setSlotFilter(k)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white"
              }`}
            >
              {k}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-neutral-500 leading-relaxed">
        Modules auto-scale to the selected hull. Look for the size badge and mark (Mk.I–Mk.IV) to see which variant you’re fitting.
      </p>

      <div className="grid gap-2">
        {Object.entries(groupedBySlot).map(([slotType, moduleList]) => (
          <div key={slotType} className="space-y-2">
            <div className="text-xs uppercase tracking-[0.35em] text-neutral-500 border-b border-neutral-800 pb-1">
              {slotType}
            </div>
            {moduleList.map((entry) => {
              const slotColor = SLOT_COLORS[entry.slot as SlotType];
              const topStats = entry.stats ? Object.entries(entry.stats).slice(0, 2) : [];
              return (
                <details key={entry.id} className={`rounded-md border transition-colors ${
                  draggingModuleId === entry.id
                    ? "border-blue-600 bg-blue-600/5"
                    : "border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900/40"
                }`}>
                  <summary
                    onClick={(e) => {
                      startDrag(entry.id);
                      e.preventDefault();
                    }}
                    className="cursor-pointer list-none p-3 flex items-center justify-between gap-2"
                  >
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <span className="text-white font-medium truncate">{formatModuleTitle(entry)}</span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[11px] font-medium"
                        style={{ backgroundColor: `${slotColor}30`, color: slotColor, border: `1px solid ${slotColor}40` }}
                      >
                        {entry.slot}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">{entry.shape.sizeClass}</span>
                      {entry.baseBW && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">BW {entry.baseBW}</span>
                      )}
                      {topStats.map(([k, v]) => (
                        <span key={k} className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">{k}: {String(v)}</span>
                      ))}
                      {placedCount.get(entry.id) ? (
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-neutral-700">x{placedCount.get(entry.id)}</span>
                      ) : null}
                    </div>
                    <span className="text-xs text-neutral-500 shrink-0">More</span>
                  </summary>
                  <div className="px-3 pb-3 text-xs space-y-2">
                    {entry.description && (
                      <div className="text-neutral-400 leading-relaxed">{entry.description}</div>
                    )}
                    <ModuleMeta module={entry} />
                  </div>
                </details>
              );
            })}
          </div>
        ))}
      </div>

      <div className="text-xs space-y-2 border-t border-neutral-800 pt-3">
        <div className="space-y-1">
          <div className="font-medium text-neutral-400">Slot Types:</div>
          <div className="flex gap-3">
            <span className="flex items-center gap-1.5 text-neutral-500">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: SLOT_COLORS.Power }}></span>
              Power
            </span>
            <span className="flex items-center gap-1.5 text-neutral-500">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: SLOT_COLORS.Ammo }}></span>
              Ammo
            </span>
            <span className="flex items-center gap-1.5 text-neutral-500">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: SLOT_COLORS.Utility }}></span>
              Utility
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="font-medium text-neutral-400">Instructions:</div>
          <ul className="space-y-0.5 text-neutral-500">
            <li>• Click module to select</li>
            <li>• Press R or scroll to rotate</li>
            <li>• Click grid to place</li>
            <li>• Green = valid placement</li>
            <li>• Red = invalid placement</li>
          </ul>
        </div>
      </div>
    </div>
  );
}