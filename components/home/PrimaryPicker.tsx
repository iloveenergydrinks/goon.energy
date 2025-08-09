"use client";
import { useFittingStore } from "@/store/useFittingStore";

export default function PrimaryPicker() {
  const primaries = useFittingStore((s) => s.primaries);
  const primaryId = useFittingStore((s) => s.primaryId);
  const setPrimary = useFittingStore((s) => s.setPrimary);
  return (
    <div className="space-y-2">
      <div className="font-medium">Primary</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {primaries.map((p) => (
          <button
            key={p.id}
            className={`border rounded px-3 py-2 text-left ${
              primaryId === p.id ? "border-blue-600 bg-blue-600 text-white" : "border-neutral-300"
            }`}
            onClick={() => setPrimary(p.id)}
          >
            <div className="font-semibold">{p.id}</div>
            <div className={`text-xs ${primaryId === p.id ? 'text-white/80' : 'text-neutral-600'}`}>shape: {p.shape}</div>
            {p.description && <div className={`text-xs mt-1 ${primaryId === p.id ? 'text-white/70' : 'text-neutral-500'}`}>{p.description}</div>}
          </button>
        ))}
      </div>
    </div>
  );
}

