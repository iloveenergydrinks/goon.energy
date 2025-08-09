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
  const router = useRouter();
  useEffect(() => {
    if (!grid) {
      router.replace("/");
    }
  }, [grid, router]);
  if (!grid) return null;
  return (
    <div className="min-h-screen p-4 grid grid-cols-[280px_1fr_320px] gap-4">
      <div className="space-y-2">
        <div className="flex gap-2">
          <button className="px-3 py-1 border rounded" onClick={undo}>Undo</button>
          <button className="px-3 py-1 border rounded" onClick={redo}>Redo</button>
        </div>
        <ModulePalette />
        <Toolbar />
      </div>
      <GridCanvas />
      <StatsPanel />
    </div>
  );
}

