"use client";
import { useFittingStore } from "@/store/useFittingStore";
import { SLOT_COLORS } from "@/lib/colors";
import { useEffect } from "react";
import { useMemo } from "react";
import { getCoveredIndices, rotateOffsets } from "@/lib/shapes";
import type { ModuleDef } from "@/types/fitting";
import { canPlace } from "@/lib/fit/canPlace";

export default function GridCanvas() {
  const grid = useFittingStore((s) => s.grid);
  const setHoverCell = useFittingStore((s) => s.setHoverCell);
  const rotateGhost = useFittingStore((s) => s.rotateGhost);
  const modulesById = useFittingStore((s) => s.modulesById);
  const draggingModuleId = useFittingStore((s) => s.draggingModuleId);
  const ghostRotation = useFittingStore((s) => s.ghostRotation);
  const hoverCell = useFittingStore((s) => s.hoverCell);
  const commitPlacement = useFittingStore((s) => s.commitPlacement);
  const placed = useFittingStore((s) => s.placed);
  
  const cellSize = 40;
  
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "r") rotateGhost();
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      rotateGhost();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
    };
  }, [rotateGhost]);
  
  if (!grid) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-500">
        No grid generated. Please configure your ship first.
      </div>
    );
  }

  // Get the dragging module details
  const draggingModule = draggingModuleId ? modulesById[draggingModuleId] : null;
  
  // Check if current hover position is valid
  const isValidPlacement = draggingModule && hoverCell
    ? canPlace(grid, draggingModule, hoverCell, ghostRotation, placed, modulesById).ok
    : false;

  // Build set of occupied cells from placed modules
  const occupiedCells = new Set<number>();
  const cellModuleMap = new Map<number, string>();
  for (const pm of placed) {
    const mod = modulesById[pm.moduleId];
    if (!mod) continue;
    const rotated = rotateOffsets(mod.shape.cells, pm.rotation);
    for (const { dr, dc } of rotated) {
      const r = pm.anchor.r + dr;
      const c = pm.anchor.c + dc;
      if (r >= 0 && c >= 0 && r < grid.rows && c < grid.cols) {
        const idx = r * grid.cols + c;
        occupiedCells.add(idx);
        cellModuleMap.set(idx, pm.moduleId);
      }
    }
  }
  return (
    <div className="flex items-start justify-center">
      <div className="relative" style={{ width: grid.cols * cellSize, height: grid.rows * cellSize }}>
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${grid.cols}, ${cellSize}px)` }}
          onContextMenu={(e) => {
            e.preventDefault();
            rotateGhost();
          }}
          onMouseUp={() => {
            if (!draggingModuleId || !hoverCell) return;
            const mod: ModuleDef | undefined = modulesById[draggingModuleId];
            if (!mod) return;
            commitPlacement({ type: "add", placement: { moduleId: draggingModuleId, anchor: hoverCell, rotation: ghostRotation } });
          }}
        >
          {grid.cells.map((cell, idx) => {
            const isOccupied = occupiedCells.has(idx);
            const moduleAtCell = cellModuleMap.get(idx);
            return (
              <div
                key={idx}
                className={`border ${isOccupied ? 'border-neutral-600' : 'border-neutral-300'} relative`}
                style={{
                  width: cellSize,
                  height: cellSize,
                  background: cell.hole
                    ? "#111"
                    : isOccupied && cell.slot
                    ? `${SLOT_COLORS[cell.slot]}99`
                    : cell.slot
                    ? `${SLOT_COLORS[cell.slot]}22`
                    : "white",
                }}
                title={`${moduleAtCell || cell.slot || ""} r${cell.r},c${cell.c}`}
                data-slot={cell.slot || ""}
                onMouseEnter={() => setHoverCell({ r: cell.r, c: cell.c })}
                onMouseLeave={() => setHoverCell(null)}
              >
                {isOccupied && moduleAtCell && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-[8px] font-bold text-white bg-black/80 px-0.5 rounded border border-white/20">
                      {moduleAtCell.substring(0, 3).toUpperCase()}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {draggingModule && hoverCell && (
          <GhostOverlay cellSize={cellSize} isValid={isValidPlacement} />
        )}
        {draggingModule && (
          <CompatibleSlots cellSize={cellSize} moduleSlot={draggingModule.slot} />
        )}
      </div>
    </div>
  );
}

function GhostOverlay({ cellSize, isValid }: { cellSize: number; isValid: boolean }) {
  const grid = useFittingStore((s) => s.grid)!;
  const hoverCell = useFittingStore((s) => s.hoverCell)!;
  const rotation = useFittingStore((s) => s.ghostRotation);
  const moduleId = useFittingStore((s) => s.draggingModuleId)!;
  const modulesById = useFittingStore((s) => s.modulesById);
  const mod = modulesById[moduleId];
  const indices = useMemo(() => getCoveredIndices(mod, hoverCell, rotation, grid.cols), [mod, hoverCell, rotation, grid.cols]);
  const sizeDefaultBW: Record<string, number> = { S: 7, M: 12, L: 21 };
  const cells = useMemo(() => {
    return indices
      .map((idx) => ({ idx, r: Math.floor(idx / grid.cols), c: idx % grid.cols }))
      .filter(({ r, c }) => r >= 0 && c >= 0 && r < grid.rows && c < grid.cols)
      .map(({ idx, r, c }) => {
        const cell = grid.cells[idx];
        const mismatch = !!(cell?.slot && mod.slot !== cell.slot);
        return { idx, r, c, mismatch };
      });
  }, [indices, grid, mod]);
  const mismatchFraction = cells.length > 0 ? cells.filter((c) => c.mismatch).length / cells.length : 0;
  const baseBW = (mod.baseBW ?? sizeDefaultBW[mod.shape.sizeClass] ?? 10);
  const bwMult = 1 + mismatchFraction;
  const bwModule = Math.round(baseBW * bwMult);
  const badgeText = `Mismatch: ${Math.round(mismatchFraction * 100)}% → BW ×${bwMult.toFixed(2)} (${bwModule})`;
  const colorFor = (mismatch: boolean) =>
    isValid ? (mismatch ? "bg-amber-500/40 outline-amber-600/60" : "bg-green-500/40 outline-green-600/60") : "bg-red-500/40 outline-red-600/60";
  return (
    <div className="pointer-events-none absolute inset-0">
      {cells.map(({ idx, r, c, mismatch }) => (
        <div
          key={`ghost-${idx}`}
          className={`${colorFor(mismatch)} outline outline-2`}
          style={{ position: "absolute", top: r * cellSize, left: c * cellSize, width: cellSize, height: cellSize }}
        />
      ))}
      <div className="absolute -top-6 left-0">
        <div className="inline-flex items-center gap-1 text-[10px] font-medium text-white bg-black/80 px-2 py-0.5 rounded border border-white/20">
          <span>{badgeText}</span>
        </div>
      </div>
    </div>
  );
}

function CompatibleSlots({ cellSize, moduleSlot }: { cellSize: number; moduleSlot: string }) {
  const grid = useFittingStore((s) => s.grid)!;
  return (
    <div className="pointer-events-none absolute inset-0">
      {grid.cells.map((cell, idx) => {
        if (cell.hole) return null;
        const r = Math.floor(idx / grid.cols);
        const c = idx % grid.cols;
        const match = cell.slot === moduleSlot;
        const cls = match ? "bg-blue-400/10 outline outline-1 outline-blue-400/30" : "bg-amber-400/5 outline outline-1 outline-amber-300/30";
        return <div key={`compat-${idx}`} className={cls} style={{ position: "absolute", top: r * cellSize, left: c * cellSize, width: cellSize, height: cellSize }} />;
      })}
    </div>
  );
}

