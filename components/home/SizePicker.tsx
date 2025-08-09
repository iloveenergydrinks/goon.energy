"use client";
import { useFittingStore } from "@/store/useFittingStore";

export default function SizePicker() {
  const sizes = useFittingStore((s) => s.sizes);
  const sizeId = useFittingStore((s) => s.sizeId);
  const setSize = useFittingStore((s) => s.setSize);
  return (
    <div className="space-y-2">
      <div className="font-medium">Ship Size</div>
      <div className="grid grid-cols-2 gap-2">
        {sizes.map((sz) => (
          <button
            key={sz.id}
            className={`border rounded px-3 py-2 text-left ${
              sizeId === sz.id ? "border-blue-600 bg-blue-600 text-white" : "border-neutral-300"
            }`}
            onClick={() => setSize(sz.id)}
          >
            <div className="font-semibold">{sz.id}</div>
            <div className={`text-xs ${sizeId === sz.id ? 'text-white/80' : 'text-neutral-600'}`}>{sz.rows}×{sz.cols}</div>
            {sz.description && <div className={`text-xs mt-1 ${sizeId === sz.id ? 'text-white/70' : 'text-neutral-500'}`}>{sz.description}</div>}
          </button>
        ))}
      </div>
    </div>
  );
}

