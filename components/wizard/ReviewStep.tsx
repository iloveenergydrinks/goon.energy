"use client";

import { useRouter } from "next/navigation";
import { useFittingStore } from "@/store/useFittingStore";

export default function ReviewStep() {
  const router = useRouter();
  const hulls = useFittingStore((s) => s.hulls);
  const primaries = useFittingStore((s) => s.primaries);
  const secondaries = useFittingStore((s) => s.secondaries);
  const selectedHullId = useFittingStore((s) => s.selectedHullId);
  const selectedPrimaryId = useFittingStore((s) => s.selectedPrimaryId);
  const selectedSecondaryIds = useFittingStore((s) => s.selectedSecondaryIds);
  const generateFromHull = useFittingStore((s) => s.generateFromHull);
  const resetWizard = useFittingStore((s) => s.resetWizard);
  const prevStep = useFittingStore((s) => s.prevStep);

  const hull = hulls.find((h) => h.id === selectedHullId);
  const primary = primaries.find((p) => p.id === selectedPrimaryId);
  const selectedSecondaries = secondaries.filter((s) => selectedSecondaryIds.includes(s.id));

  const handleFinalize = () => {
    if (!selectedHullId) return;
    generateFromHull();
    router.push("/builder");
  };

  const handleRestart = () => {
    resetWizard();
  };

  if (!hull) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-2">Step 4: Review Loadout</h2>
        <p className="text-neutral-400">Select a hull to continue.</p>
        <div className="flex gap-3">
          <button
            onClick={handleRestart}
            className="px-6 py-2 rounded font-medium bg-neutral-700 hover:bg-neutral-600 text-white transition-all"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  const totalPower = (primary?.powerDraw || 0) +
    selectedSecondaries.reduce((sum, s) => sum + s.powerDraw, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Step 4: Review Loadout</h2>
        <p className="text-neutral-500">
          Confirm your selections before entering the fitting bay.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="p-4 rounded-lg border border-neutral-700 bg-neutral-950/40">
          <h3 className="text-lg font-semibold text-white">Hull</h3>
          <p className="text-sm text-neutral-400">{hull.name}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
            <div>
              <span className="text-neutral-500">Power Capacity</span>
              <p className="font-medium text-white">{hull.powerCapacity}</p>
            </div>
            <div>
              <span className="text-neutral-500">Bandwidth Limit</span>
              <p className="font-medium text-white">{hull.bandwidthLimit}</p>
            </div>
            {hull.baseStats && Object.entries(hull.baseStats).slice(0, 2).map(([key, value]) => (
              <div key={key}>
                <span className="text-neutral-500 capitalize">{key}</span>
                <p className="font-medium text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-lg border border-neutral-700 bg-neutral-950/40">
          <h3 className="text-lg font-semibold text-white">Primary System</h3>
          {primary ? (
            <div className="mt-2 text-sm text-neutral-300">
              <p className="font-medium text-white">{primary.name}</p>
              <p className="text-neutral-500 mt-1">{primary.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {primary.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-1 bg-neutral-800 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-neutral-500">No primary selected.</p>
          )}
        </div>

        <div className="p-4 rounded-lg border border-neutral-700 bg-neutral-950/40">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Secondary Systems</h3>
            <span className="text-xs text-neutral-500">{selectedSecondaryIds.length}/2 selected</span>
          </div>
          {selectedSecondaries.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-neutral-300">
              {selectedSecondaries.map((secondary) => (
                <li key={secondary.id} className="border border-neutral-800 rounded p-3">
                  <p className="font-medium text-white">{secondary.name}</p>
                  <p className="text-neutral-500 text-xs mt-1">{secondary.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {secondary.tags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-1 bg-neutral-800 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-neutral-500 mt-2">No secondary systems selected.</p>
          )}
        </div>
      </div>

      <div className="p-4 rounded-lg border border-neutral-700 bg-neutral-950/40">
        <h3 className="text-lg font-semibold text-white">Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 text-sm">
          <div>
            <span className="text-neutral-500">Power Draw</span>
            <p className="font-medium text-white">{totalPower} / {hull.powerCapacity}</p>
          </div>
          <div>
            <span className="text-neutral-500">Bandwidth Limit</span>
            <p className="font-medium text-white">{hull.bandwidthLimit}</p>
          </div>
          <div>
            <span className="text-neutral-500">Selected Secondaries</span>
            <p className="font-medium text-white">{selectedSecondaries.length}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-between">
        <div className="flex gap-3">
          <button
            onClick={handleRestart}
            className="px-6 py-2 rounded font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-all"
          >
            Start Over
          </button>
          <button
            onClick={prevStep}
            className="px-6 py-2 rounded font-medium bg-neutral-700 hover:bg-neutral-600 text-white transition-all"
          >
            ← Back: Secondary Systems
          </button>
        </div>
        <button
          onClick={handleFinalize}
          className="px-6 py-2 rounded font-medium bg-green-600 hover:bg-green-700 text-white transition-all"
        >
          Finalize & Enter Builder →
        </button>
      </div>
    </div>
  );
}

