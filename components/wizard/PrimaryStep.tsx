"use client";
import { useFittingStore } from "@/store/useFittingStore";

export default function PrimaryStep() {
  const primaries = useFittingStore((s) => s.primaries);
  const selectedPrimaryId = useFittingStore((s) => s.selectedPrimaryId);
  const selectPrimary = useFittingStore((s) => s.selectPrimary);
  const nextStep = useFittingStore((s) => s.nextStep);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Step 1: Choose Primary Weapon System</h2>
        <p className="text-neutral-500">Select your main weapon system. This will determine compatible hull options.</p>
      </div>

      <div className="grid gap-3">
        {primaries.map((primary) => (
          <button
            key={primary.id}
            onClick={() => selectPrimary(primary.id)}
            className={`
              p-4 rounded-lg border-2 text-left transition-all
              ${selectedPrimaryId === primary.id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-neutral-700 hover:border-neutral-500'
              }
            `}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{primary.name}</h3>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded">
                  Power: {primary.powerDraw}
                </span>
              </div>
            </div>
            <p className="text-sm text-neutral-400 mb-3">{primary.description}</p>
            
            <div className="grid grid-cols-4 gap-2 text-xs">
              {primary.baseStats && Object.entries(primary.baseStats).map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <span className="text-neutral-500 capitalize">{key}:</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-1 mt-3">
              {primary.tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-1 bg-neutral-800 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={nextStep}
          disabled={!selectedPrimaryId}
          className={`
            px-6 py-2 rounded font-medium transition-all
            ${selectedPrimaryId
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
            }
          `}
        >
          Next: Choose Secondary Weapons →
        </button>
      </div>
    </div>
  );
}
