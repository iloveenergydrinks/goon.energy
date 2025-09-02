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
    <div className="p-4 grid grid-cols-[360px_1fr_280px] gap-4">
      <div className="space-y-2 p-12 sticky top-4 h-fit max-h-[calc(100vh-2rem)] overflow-y-auto">
        <div className="flex gap-2">
          <button className="px-3 py-1 border rounded" onClick={undo}>Undo</button>
          <button className="px-3 py-1 border rounded" onClick={redo}>Redo</button>
        </div>
        <ModulePalette />
        <Toolbar />
      </div>
      <GridCanvas />
      <div className="sticky top-4 h-fit max-h-[calc(100vh-2rem)]">
        <StatsPanel />
      </div>
    </div>
  );
}

