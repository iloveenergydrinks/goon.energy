"use client";

import { useState, useMemo } from "react";

interface ShapeBuilderProps {
  fieldName: string;
  initialShape?: { r: number; c: number }[];
}

export function ShapeBuilder({ fieldName, initialShape = [{ r: 0, c: 0 }] }: ShapeBuilderProps) {
  // Ensure initialShape is always an array
  const normalizedShape = Array.isArray(initialShape) ? initialShape : [{ r: 0, c: 0 }];
  
  const [cells, setCells] = useState<Set<string>>(
    new Set(normalizedShape.map(cell => `${cell.r},${cell.c}`))
  );

  const bounds = useMemo(() => {
    if (cells.size === 0) return { minR: 0, maxR: 2, minC: 0, maxC: 2 };
    
    const coords = Array.from(cells).map(key => {
      const [r, c] = key.split(",").map(Number);
      return { r, c };
    });
    
    const rows = coords.map(coord => coord.r);
    const cols = coords.map(coord => coord.c);
    
    return {
      minR: Math.min(...rows) - 1,
      maxR: Math.max(...rows) + 1,
      minC: Math.min(...cols) - 1,
      maxC: Math.max(...cols) + 1,
    };
  }, [cells]);

  const toggleCell = (r: number, c: number) => {
    const key = `${r},${c}`;
    setCells(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        // Don't allow removing the last cell
        if (next.size > 1) {
          next.delete(key);
        }
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const shapeValue = useMemo(() => {
    return Array.from(cells).sort().join("|");
  }, [cells]);

  const shapeSize = useMemo(() => {
    const sizeMap: Record<number, string> = {
      1: "S",
      2: "S",
      3: "M",
      4: "M",
      5: "L",
      6: "L",
      7: "XL",
      8: "XL",
      9: "XL"
    };
    return sizeMap[cells.size] || "XL";
  }, [cells]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-400">
          Click cells to toggle module shape. Size: {shapeSize} ({cells.size} cells)
        </p>
        <button
          type="button"
          onClick={() => setCells(new Set(["0,0"]))}
          className="text-xs px-2 py-1 rounded bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
        >
          Reset
        </button>
      </div>

      <div 
        className="inline-grid gap-1 border border-neutral-800 rounded bg-neutral-900/70 p-3"
        style={{ 
          gridTemplateColumns: `repeat(${bounds.maxC - bounds.minC + 1}, 2.5rem)` 
        }}
      >
        {Array.from({ length: bounds.maxR - bounds.minR + 1 }, (_, rIdx) => {
          const r = bounds.minR + rIdx;
          return Array.from({ length: bounds.maxC - bounds.minC + 1 }, (_, cIdx) => {
            const c = bounds.minC + cIdx;
            const key = `${r},${c}`;
            const isActive = cells.has(key);
            
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleCell(r, c)}
                className={`h-10 text-xs border rounded transition-colors ${
                  isActive
                    ? "bg-blue-600/30 border-blue-500 text-blue-200"
                    : "bg-neutral-900 border-neutral-700 text-neutral-600 hover:bg-neutral-800"
                }`}
              >
                {isActive ? "■" : "□"}
              </button>
            );
          });
        }).flat()}
      </div>

      <input type="hidden" name={fieldName} value={shapeValue} />
    </div>
  );
}
