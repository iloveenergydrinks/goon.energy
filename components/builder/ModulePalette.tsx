"use client";
import { useState } from "react";
import { useFittingStore } from "@/store/useFittingStore";
import type { SlotType } from "@/types/fitting";
import { SLOT_COLORS } from "@/lib/colors";

export default function ModulePalette() {
  const modules = useFittingStore((s) => s.modules);
  const [slotFilter, setSlotFilter] = useState<SlotType | "All">("All");
  const filtered = modules.filter((m) => slotFilter === "All" || m.slot === slotFilter);
  const startDrag = useFittingStore((s) => s.startDrag);
  const draggingModuleId = useFittingStore((s) => s.draggingModuleId);
  const placed = useFittingStore((s) => s.placed);
  const placedCount = new Map<string, number>();
  for (const p of placed) placedCount.set(p.moduleId, (placedCount.get(p.moduleId) || 0) + 1);
  return (
    <div className="space-y-2">
      <div className="font-semibold">Modules</div>
      <div className="flex gap-2 text-sm">
        {(["All", "Power", "Ammo", "Utility"] as const).map((k: "All" | SlotType) => {
          const isActive = slotFilter === k;
          return (
            <button
              key={k}
              onClick={() => setSlotFilter(k)}
              className={`px-2 py-1 border rounded ${
                isActive ? "bg-blue-600 text-white border-blue-600" : "border-neutral-300"
              }`}
            >
              {k}
            </button>
          );
        })}
      </div>
      <div className="grid gap-2">
        {filtered.map((m) => {
          const slotColor = SLOT_COLORS[m.slot as SlotType];
          return (
            <button
              key={m.id}
              className={`border rounded p-2 text-sm text-left hover:bg-neutral-50 relative overflow-hidden ${
                draggingModuleId === m.id ? "border-blue-600 bg-blue-50 text-black" : "border-neutral-300"
              }`}
              onClick={() => startDrag(m.id)}
            >
              <div 
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: slotColor }}
              />
              <div className="pl-3">
                <div className="font-medium flex items-center gap-2">
                  <span>{m.id}</span>
                  {placedCount.get(m.id) ? (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-200">x{placedCount.get(m.id)}</span>
                  ) : null}
                  {draggingModuleId === m.id && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-blue-600 text-white">Selected</span>
                  )}
                </div>
                <div className="text-xs text-neutral-600 flex items-center gap-2">
                  <span 
                    className="px-1.5 py-0.5 rounded text-white font-medium"
                    style={{ backgroundColor: slotColor }}
                  >
                    {m.slot}
                  </span>
                  <span>{m.shape.sizeClass}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="text-xs text-neutral-500 space-y-2">
        <div className="space-y-1">
          <div className="font-semibold">Slot Types:</div>
          <div className="flex gap-2">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: SLOT_COLORS.Power }}></span>
              Power
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: SLOT_COLORS.Ammo }}></span>
              Ammo
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: SLOT_COLORS.Utility }}></span>
              Utility
            </span>
          </div>
        </div>
        <div className="space-y-0.5">
          <div className="font-semibold">How to place:</div>
          <div>1. Click a module to select it</div>
          <div>2. Matching color cells show valid slots</div>
          <div>3. Hover to preview (green=valid, red=invalid)</div>
          <div>4. Scroll wheel or R to rotate</div>
          <div>5. Click to place</div>
        </div>
      </div>
    </div>
  );
}

