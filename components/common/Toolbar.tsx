"use client";
import { useFittingStore } from "@/store/useFittingStore";

export default function Toolbar() {
  const placed = useFittingStore((s) => s.placed);
  const modules = useFittingStore((s) => s.modules);

  // Count modules by slot type
  const moduleCounts = placed.reduce((acc, p) => {
    const mod = modules.find(m => m.id === p.moduleId);
    if (mod) {
      acc[mod.slot] = (acc[mod.slot] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-neutral-400">Module Summary</div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-500">Power Modules:</span>
          <span className="font-medium text-yellow-400">{moduleCounts.Power || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Ammo Modules:</span>
          <span className="font-medium text-red-400">{moduleCounts.Ammo || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Utility Modules:</span>
          <span className="font-medium text-blue-400">{moduleCounts.Utility || 0}</span>
        </div>
        <div className="flex justify-between font-medium pt-2 border-t border-neutral-800">
          <span className="text-neutral-400">Total Placed:</span>
          <span className="text-white">{placed.length}</span>
        </div>
      </div>
    </div>
  );
}