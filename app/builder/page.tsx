"use client";
import { useFittingStore } from "@/store/useFittingStore";
import ModulePalette from "@/components/builder/ModulePalette";
import GridCanvas from "@/components/builder/GridCanvas";
import StatsPanel from "@/components/builder/StatsPanel";
import { useRouter } from "next/navigation";
import Toolbar from "@/components/common/Toolbar";
import { useEffect } from "react";

export default function BuilderPage() {
  const grid = useFittingStore((s) => s.grid);
  const undo = useFittingStore((s) => s.undo);
  const redo = useFittingStore((s) => s.redo);
  const resetWizard = useFittingStore((s) => s.resetWizard);
  const selectedHullId = useFittingStore((s) => s.selectedHullId);
  const selectedPrimaryId = useFittingStore((s) => s.selectedPrimaryId);
  const selectedSecondaryIds = useFittingStore((s) => s.selectedSecondaryIds);
  const hulls = useFittingStore((s) => s.hulls);
  const primaries = useFittingStore((s) => s.primaries);
  const secondaries = useFittingStore((s) => s.secondaries);
  const router = useRouter();
  
  const hull = hulls.find(h => h.id === selectedHullId);
  const primary = primaries.find(p => p.id === selectedPrimaryId);
  const selectedSecondaries = secondaries.filter(s => selectedSecondaryIds.includes(s.id));
  
  useEffect(() => {
    if (!grid) {
      router.replace("/");
    }
  }, [grid, router]);
  
  if (!grid) return null;
  
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">Module Fitting</h1>
              <div className="text-neutral-400">
                <span className="text-xl font-semibold text-white">{hull?.name}</span>
                {hull?.description && (
                  <p className="text-sm mt-1">{hull.description}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                resetWizard();
                router.push("/");
              }}
              className="px-6 py-2 rounded font-medium bg-neutral-700 hover:bg-neutral-600 text-white transition-all"
            >
              ← New Configuration
            </button>
          </div>
          
          {/* Loadout Summary */}
          <div className="mt-4 p-4 bg-neutral-900 rounded-lg">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <span className="text-xs text-neutral-500 uppercase tracking-wider">Primary Weapon</span>
                <p className="text-lg font-medium mt-1">{primary?.name}</p>
              </div>
              <div>
                <span className="text-xs text-neutral-500 uppercase tracking-wider">Secondary Systems</span>
                <p className="text-lg font-medium mt-1">
                  {selectedSecondaries.length > 0 
                    ? selectedSecondaries.map(s => s.name).join(", ")
                    : "None"
                  }
                </p>
              </div>
              <div>
                <span className="text-xs text-neutral-500 uppercase tracking-wider">Hull Class</span>
                <p className="text-lg font-medium mt-1">{hull?.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-[320px_1fr_320px] gap-6">
          {/* Left Panel - Module Palette */}
          <div className="space-y-4">
            <div className="bg-neutral-900 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Actions</h2>
              <div className="flex gap-2">
                <button 
                  className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
                  onClick={undo}
                >
                  Undo
                </button>
                <button 
                  className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
                  onClick={redo}
                >
                  Redo
                </button>
              </div>
            </div>
            
            <div className="bg-neutral-900 rounded-lg p-4 h-fit max-h-[calc(100vh-20rem)] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-3">Available Modules</h2>
              <ModulePalette />
            </div>
            
            <div className="bg-neutral-900 rounded-lg p-4">
              <Toolbar />
            </div>
          </div>

          {/* Center - Grid Canvas */}
          <div className="bg-neutral-900 rounded-lg p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Ship Grid</h2>
              <p className="text-sm text-neutral-500">Drag modules from the palette to place them. Press R to rotate.</p>
            </div>
            <GridCanvas />
          </div>

          {/* Right Panel - Stats */}
          <div className="bg-neutral-900 rounded-lg p-4 h-fit sticky top-8">
            <h2 className="text-lg font-semibold mb-3">Ship Statistics</h2>
            <StatsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}