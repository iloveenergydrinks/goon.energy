"use client";

import { useEffect, useMemo, useState } from "react";
import type { SlotType } from "@/types/fitting";

type GridCell = {
  r: number;
  c: number;
  type: SlotType | "Empty";
};

interface GridBuilderProps {
  fieldName: string;
  initialRows: number;
  initialCols: number;
  initialSlots?: { r: number; c: number; type: SlotType }[];
  allowResize?: boolean;
}

const SLOT_SEQUENCE: (SlotType | "Empty")[] = ["Empty", "Power", "Ammo", "Utility"];

function buildCells(
  rows: number,
  cols: number,
  slots?: { r: number; c: number; type: SlotType | "Empty" }[]
): GridCell[] {
  const base: GridCell[] = Array.from({ length: rows * cols }).map((_, idx) => ({
    r: Math.floor(idx / cols),
    c: idx % cols,
    type: "Empty" as const,
  }));

  if (!slots) return base;

  const slotMap = new Map(slots.map((slot) => [`${slot.r}:${slot.c}`, slot.type]));
  return base.map((cell) => {
    const key = `${cell.r}:${cell.c}`;
    const type = slotMap.get(key);
    return type ? { ...cell, type: type as SlotType | "Empty" } : cell;
  });
}

function serializeGrid(cells: GridCell[], rows: number, cols: number) {
  const slots = cells
    .filter((cell) => cell.type !== "Empty")
    .map((cell) => ({ r: cell.r, c: cell.c, type: cell.type as SlotType }));
  return JSON.stringify({ rows, cols, slots });
}

export function GridBuilder({
  fieldName,
  initialRows,
  initialCols,
  initialSlots,
  allowResize = true,
}: GridBuilderProps) {
  const [rows, setRows] = useState(initialRows);
  const [cols, setCols] = useState(initialCols);
  const [cells, setCells] = useState<GridCell[]>(() =>
    buildCells(initialRows, initialCols, initialSlots)
  );

  useEffect(() => {
    setCells((prev) =>
      buildCells(rows, cols, prev.map((cell) => cell.type === "Empty" ? null : cell).filter(Boolean) as GridCell[])
    );
  }, [rows, cols]);

  const gridValue = useMemo(() => serializeGrid(cells, rows, cols), [cells, rows, cols]);

  const cycleCell = (target: GridCell) => {
    setCells((prev) =>
      prev.map((cell) => {
        if (cell.r === target.r && cell.c === target.c) {
          const nextType = SLOT_SEQUENCE[(SLOT_SEQUENCE.indexOf(cell.type) + 1) % SLOT_SEQUENCE.length];
          return { ...cell, type: nextType };
        }
        return cell;
      })
    );
  };

  return (
    <div className="space-y-3">
      {allowResize && (
        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <label className="flex items-center gap-2">
            Rows
            <input
              type="number"
              min={1}
              max={10}
              value={rows}
              onChange={(event) => {
                const next = Number(event.target.value) || 1;
                setRows(next);
              }}
              className="w-16 rounded bg-neutral-800 border border-neutral-700 px-2 py-1 text-sm text-white"
            />
          </label>
          <label className="flex items-center gap-2">
            Columns
            <input
              type="number"
              min={1}
              max={10}
              value={cols}
              onChange={(event) => {
                const next = Number(event.target.value) || 1;
                setCols(next);
              }}
              className="w-16 rounded bg-neutral-800 border border-neutral-700 px-2 py-1 text-sm text-white"
            />
          </label>
        </div>
      )}

      <div
        className="inline-grid gap-1 border border-neutral-800 rounded bg-neutral-900/70 p-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(2.5rem, 1fr))` }}
      >
        {cells.map((cell) => (
          <button
            key={`${cell.r}-${cell.c}`}
            type="button"
            onClick={() => cycleCell(cell)}
            className={`h-10 text-xs border border-neutral-700 rounded transition-colors ${
              cell.type === "Power"
                ? "bg-blue-600/30 text-blue-200"
                : cell.type === "Ammo"
                ? "bg-red-600/30 text-red-200"
                : cell.type === "Utility"
                ? "bg-emerald-600/30 text-emerald-200"
                : "bg-neutral-900 text-neutral-500"
            }`}
          >
            {cell.type === "Empty" ? "–" : cell.type.charAt(0)}
          </button>
        ))}
      </div>

      <input type="hidden" name={fieldName} value={gridValue} readOnly />
    </div>
  );
}

