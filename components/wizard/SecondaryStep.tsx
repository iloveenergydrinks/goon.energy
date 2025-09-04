"use client";
import { useFittingStore } from "@/store/useFittingStore";

export default function SecondaryStep() {
  const secondaries = useFittingStore((s) => s.secondaries);
  const selectedSecondaryIds = useFittingStore((s) => s.selectedSecondaryIds);
  const toggleSecondary = useFittingStore((s) => s.toggleSecondary);
  const nextStep = useFittingStore((s) => s.nextStep);
  const prevStep = useFittingStore((s) => s.prevStep);
  const selectedPrimaryId = useFittingStore((s) => s.selectedPrimaryId);
  const primaries = useFittingStore((s) => s.primaries);
  
  const primary = primaries.find(p => p.id === selectedPrimaryId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Step 2: Choose Secondary Weapon Systems</h2>
        <p className="text-neutral-500">Select up to 2 secondary systems to complement your {primary?.name}.</p>
        <p className="text-sm text-neutral-600 mt-1">Selected: {selectedSecondaryIds.length}/2</p>
      </div>

      <div className="grid gap-3">
        {secondaries.map((secondary) => {
          const isSelected = selectedSecondaryIds.includes(secondary.id);
          const isDisabled = !isSelected && selectedSecondaryIds.length >= 2;
          
          return (
            <button
              key={secondary.id}
              onClick={() => toggleSecondary(secondary.id)}
              disabled={isDisabled}
              className={`
                p-4 rounded-lg border-2 text-left transition-all
                ${isSelected
                  ? 'border-blue-500 bg-blue-500/10'
                  : isDisabled
                  ? 'border-neutral-800 opacity-50 cursor-not-allowed'
                  : 'border-neutral-700 hover:border-neutral-500'
                }
              `}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{secondary.name}</h3>
                  <span className={`
                    text-xs px-2 py-1 rounded inline-block mt-1
                    ${secondary.category === 'Offensive' 
                      ? 'bg-red-500/20 text-red-400'
                      : secondary.category === 'Defensive'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-blue-500/20 text-blue-400'
                    }
                  `}>
                    {secondary.category}
                  </span>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded">
                    Power: {secondary.powerDraw}
                  </span>
                  <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded">
                    Heat: {secondary.heatGeneration}
                  </span>
                </div>
              </div>
              <p className="text-sm text-neutral-400 mb-3">{secondary.description}</p>
              
              <div className="flex gap-4 text-xs mb-3">
                <div className="flex items-center gap-1">
                  <span className="text-neutral-500">Power Slots:</span>
                  <span className={secondary.deltaPowerSlots >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {secondary.deltaPowerSlots >= 0 ? '+' : ''}{secondary.deltaPowerSlots}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-neutral-500">Ammo Slots:</span>
                  <span className={secondary.deltaAmmoSlots >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {secondary.deltaAmmoSlots >= 0 ? '+' : ''}{secondary.deltaAmmoSlots}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-neutral-500">Utility Slots:</span>
                  <span className={secondary.deltaUtilitySlots >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {secondary.deltaUtilitySlots >= 0 ? '+' : ''}{secondary.deltaUtilitySlots}
                  </span>
                </div>
              </div>

              <div className="flex gap-1">
                {secondary.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-1 bg-neutral-800 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between">
        <button
          onClick={prevStep}
          className="px-6 py-2 rounded font-medium bg-neutral-700 hover:bg-neutral-600 text-white transition-all"
        >
          ← Back: Primary Weapon
        </button>
        <button
          onClick={nextStep}
          className="px-6 py-2 rounded font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all"
        >
          Next: Choose Hull →
        </button>
      </div>
    </div>
  );
}
