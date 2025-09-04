"use client";
import { useFittingStore } from "@/store/useFittingStore";
import PrimaryStep from "@/components/wizard/PrimaryStep";
import SecondaryStep from "@/components/wizard/SecondaryStep";
import HullStep from "@/components/wizard/HullStep";
import { useEffect } from "react";

export default function Home() {
  const wizardStep = useFittingStore((s) => s.wizardStep);
  const resetWizard = useFittingStore((s) => s.resetWizard);

  // Reset wizard when returning to home
  useEffect(() => {
    return () => {
      // Optional: Reset wizard when leaving the page
      // resetWizard();
    };
  }, []);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Ship Configuration Wizard</h1>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center font-medium
                ${wizardStep >= 1 ? 'bg-blue-600 text-white' : 'bg-neutral-700 text-neutral-400'}
              `}>
                1
              </div>
              <span className={wizardStep >= 1 ? 'text-white' : 'text-neutral-500'}>
                Primary
              </span>
            </div>
            
            <div className={`flex-1 h-0.5 ${wizardStep >= 2 ? 'bg-blue-600' : 'bg-neutral-700'}`} />
            
            <div className="flex items-center gap-2">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center font-medium
                ${wizardStep >= 2 ? 'bg-blue-600 text-white' : 'bg-neutral-700 text-neutral-400'}
              `}>
                2
              </div>
              <span className={wizardStep >= 2 ? 'text-white' : 'text-neutral-500'}>
                Secondary
              </span>
            </div>
            
            <div className={`flex-1 h-0.5 ${wizardStep >= 3 ? 'bg-blue-600' : 'bg-neutral-700'}`} />
            
            <div className="flex items-center gap-2">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center font-medium
                ${wizardStep >= 3 ? 'bg-blue-600 text-white' : 'bg-neutral-700 text-neutral-400'}
              `}>
                3
              </div>
              <span className={wizardStep >= 3 ? 'text-white' : 'text-neutral-500'}>
                Hull
              </span>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-lg p-6">
          {wizardStep === 1 && <PrimaryStep />}
          {wizardStep === 2 && <SecondaryStep />}
          {wizardStep === 3 && <HullStep />}
        </div>

        {wizardStep > 1 && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={resetWizard}
              className="text-sm text-neutral-500 hover:text-neutral-400 transition-colors"
            >
              Start Over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}