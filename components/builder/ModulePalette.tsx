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
      
      <div className="grid gap-2">
        {filtered.map((m) => {
          const slotColor = SLOT_COLORS[m.slot as SlotType];
          return (
            <button
              key={m.id}
              className={`relative rounded-lg p-3 text-sm text-left overflow-hidden transition-all ${
                draggingModuleId === m.id 
                  ? "bg-blue-600/20 border-2 border-blue-600" 
                  : "bg-neutral-800 hover:bg-neutral-700 border-2 border-transparent"
              }`}
              onClick={() => startDrag(m.id)}
            >
              <div 
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: slotColor }}
              />
              <div className="pl-2">
                <div className="font-medium flex items-center justify-between gap-2">
                  <span className="text-white">{m.id}</span>
                  <div className="flex items-center gap-1">
                    {placedCount.get(m.id) ? (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-700">
                        x{placedCount.get(m.id)}
                      </span>
                    ) : null}
                    {draggingModuleId === m.id && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-600 text-white">
                        Active
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-neutral-400 flex items-center gap-2 mt-1">
                  <span 
                    className="px-1.5 py-0.5 rounded font-medium"
                    style={{ 
                      backgroundColor: slotColor + '30',
                      color: slotColor,
                      border: `1px solid ${slotColor}40`
                    }}
                  >
                    {m.slot}
                  </span>
                  <span className="text-neutral-500">Size: {m.shape.sizeClass}</span>
                </div>
                {m.description && (
                  <div className="text-xs text-neutral-500 mt-1">{m.description}</div>
                )}
              </div>
            </button>
          );
        })}
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