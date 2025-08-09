"use client";
import { useFittingStore } from "@/store/useFittingStore";

export default function SecondaryPicker() {
  const secondaries = useFittingStore((s) => s.secondaries);
  const selected = useFittingStore((s) => s.secondaryIds);
  const toggle = useFittingStore((s) => s.toggleSecondary);
  return (
    <div className="space-y-2">
      <div className="font-medium">Secondaries (up to 2)</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {secondaries.map((sec) => {
          const isOn = selected.includes(sec.id);
          return (
            <button
              key={sec.id}
              className={`border rounded px-3 py-2 text-left ${
                isOn ? "border-blue-600 bg-blue-600 text-white" : "border-neutral-300"
              }`}
              onClick={() => toggle(sec.id)}
            >
              <div className="font-semibold">{sec.id}</div>
              <div className={`text-xs ${isOn ? 'text-white/80' : 'text-neutral-600'}`}>{sec.category}</div>
              {sec.description && <div className={`text-xs mt-1 ${isOn ? 'text-white/70' : 'text-neutral-500'}`}>{sec.description}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

