"use client";
import { useFittingStore } from "@/store/useFittingStore";
import { getSlotColor } from "@/lib/colors";
import { getSlotDisplayName, getSlotAcceptedTypes, canModuleFitInSlot } from "@/lib/slots";
import { useEffect } from "react";
import { rotateOffsets } from "@/lib/shapes";
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
  
  const cellSize = 52;
  
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "r") rotateGhost();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
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
  
  // Get ghost cells for hover preview
  const ghostCells = new Set<number>();
  if (draggingModule && hoverCell) {
    const rotated = rotateOffsets(draggingModule.shape.cells, ghostRotation);
    for (const { dr, dc } of rotated) {
      const r = hoverCell.r + dr;
      const c = hoverCell.c + dc;
      if (r >= 0 && c >= 0 && r < grid.rows && c < grid.cols) {
        ghostCells.add(r * grid.cols + c);
      }
    }
  }
  
  return (
    <div className="flex flex-col items-center">
      <div 
        className="relative rounded-lg overflow-hidden" 
        style={{ width: grid.cols * cellSize, height: grid.rows * cellSize }}
      >
        <div
          className="grid bg-neutral-950"
          style={{ gridTemplateColumns: `repeat(${grid.cols}, ${cellSize}px)` }}
          onWheel={(e) => {
            if (draggingModuleId) {
              e.preventDefault();
              rotateGhost();
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            rotateGhost();
          }}
          onMouseLeave={() => setHoverCell(null)}
        >
          {grid.cells.map((cell, idx) => {
            const r = Math.floor(idx / grid.cols);
            const c = idx % grid.cols;
            const hasModule = occupiedCells.has(idx);
            const moduleId = cellModuleMap.get(idx);
            const mod = moduleId ? modulesById[moduleId] : null;
            const isGhost = ghostCells.has(idx);
            const slotType = cell.slot;
            const slotColor = slotType ? getSlotColor(slotType) : null;
            const isHole = cell.hole;
            
            // Check if this slot can accept the dragging module
            const canAcceptModule = draggingModule && slotType 
              ? canModuleFitInSlot(draggingModule.slot, slotType, cell.slotCompatibility)
              : false;
            
            // Determine cell background
            let cellBg = "bg-neutral-900";
            let borderColor = "border-neutral-800";
            
            if (isHole) {
              cellBg = "bg-black";
              borderColor = "border-black";
            } else if (hasModule && mod) {
              cellBg = "";
              borderColor = "";
            } else if (isGhost) {
              if (isValidPlacement) {
                cellBg = "bg-green-500/30";
                borderColor = "border-green-500";
              } else {
                cellBg = "bg-red-500/30";
                borderColor = "border-red-500";
              }
            } else if (draggingModule && slotType === draggingModule.slot) {
              // Highlight matching slots when dragging
              cellBg = "bg-blue-500/10";
              borderColor = "border-blue-500/30";
            }
            
            return (
              <div
                key={idx}
                className={`
                  ${cellBg} 
                  border ${borderColor}
                  transition-all duration-75
                  relative
                  ${!isHole && !hasModule ? 'hover:border-neutral-600' : ''}
                  ${draggingModuleId && !isHole ? 'cursor-pointer' : ''}
                `}
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: hasModule && mod 
                    ? `${getSlotColor(mod.slot)}30`
                    : undefined,
                  borderColor: hasModule && mod
                    ? `${getSlotColor(mod.slot)}60`
                    : undefined
                }}
                onMouseEnter={() => {
                  if (draggingModuleId && !isHole) {
                    setHoverCell({ r, c });
                  }
                }}
                onClick={() => {
                  if (draggingModuleId && hoverCell && r === hoverCell.r && c === hoverCell.c && isValidPlacement) {
                    commitPlacement({
                      type: "add",
                      placement: {
                        moduleId: draggingModuleId,
                        anchor: { r, c },
                        rotation: ghostRotation,
                      },
                    });
                  }
                }}
              >
                {/* Slot Type Indicator */}
                {!hasModule && slotType && !isGhost && (
                  <div
                    className={`absolute inset-0 m-1 rounded transition-opacity ${
                      draggingModule 
                        ? canAcceptModule 
                          ? 'opacity-40 animate-pulse' 
                          : 'opacity-10'
                        : 'opacity-20'
                    }`}
                    style={{ backgroundColor: slotColor || undefined }}
                    title={`${getSlotDisplayName(slotType)} slot${
                      cell.slotCompatibility 
                        ? ` - Accepts: ${getSlotAcceptedTypes(slotType, cell.slotCompatibility).join(", ")}`
                        : ""
                    }`}
                  />
                )}
                
                {/* Module Label */}
                {hasModule && moduleId && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-white/60 truncate px-1">
                      {moduleId.slice(0, 3).toUpperCase()}
                    </span>
                  </div>
                )}
                
                {/* Ghost Preview */}
                {isGhost && draggingModule && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-xs font-medium ${isValidPlacement ? 'text-green-400' : 'text-red-400'}`}>
                      {draggingModule.id.slice(0, 3).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {draggingModuleId && (
        <div className="mt-3 text-sm text-neutral-400 text-center">
          <span className="font-medium">{draggingModuleId}</span> selected • 
          Press <kbd className="px-1.5 py-0.5 mx-1 bg-neutral-800 rounded text-xs">R</kbd> to rotate • 
          <span className={isValidPlacement ? "text-green-400" : "text-red-400"}>
            {isValidPlacement ? "Click to place" : "Invalid placement"}
          </span>
        </div>
      )}
    </div>
  );
}