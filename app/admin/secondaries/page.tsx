import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SecondaryForm } from "@/components/admin/SecondaryForm";

// Force dynamic rendering - don't try to generate static pages at build time
export const dynamic = 'force-dynamic';

export default async function SecondaryAdminPage() {
  const secondaries = await prisma.secondarySystem.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="space-y-3">
          <h1 className="text-2xl font-bold tracking-[0.35em] uppercase text-[color:rgb(220,230,255)]">
            Secondary Systems Catalog
          </h1>
          <p className="text-sm text-neutral-500">
            Support systems that modify your ship&apos;s slot configuration and capabilities
          </p>
        </header>

        {/* Create New Secondary */}
        <section className="border border-neutral-800 rounded-md bg-neutral-900/70 px-6 py-6">
          <h2 className="text-lg font-semibold text-white mb-4">Create New Secondary System</h2>
          <SecondaryForm mode="create" />
        </section>

        {/* Existing Secondaries */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Existing Secondary Systems ({secondaries.length})</h2>
          <div className="space-y-3">
            {secondaries.map((secondary) => {
              const slotChanges = {
                Power: secondary.deltaPowerSlots || 0,
                Ammo: secondary.deltaAmmoSlots || 0,
                Utility: secondary.deltaUtilitySlots || 0
              };
              const hasSlotChanges = Object.values(slotChanges).some(v => v !== 0);
              
              return (
                <details key={secondary.id} className="border border-neutral-800 rounded-md bg-neutral-900/70 px-6 py-4">
                  <summary className="cursor-pointer flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h3 className="text-white font-semibold">{secondary.name}</h3>
                      <div className="flex gap-2">
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          secondary.category === "Offensive" ? "bg-red-600/20 text-red-400" :
                          secondary.category === "Defensive" ? "bg-blue-600/20 text-blue-400" :
                          "bg-emerald-600/20 text-emerald-400"
                        }`}>
                          {secondary.category}
                        </span>
                    <span className="px-2 py-0.5 text-xs rounded bg-neutral-800 text-neutral-400">
                      Power: {secondary.powerDraw}
                    </span>
                        {secondary.archetypeFocus && (
                          <span className="px-2 py-0.5 text-xs rounded bg-blue-600/20 text-blue-400">
                            {secondary.archetypeFocus}
                          </span>
                        )}
                        {hasSlotChanges && (
                          <>
                            {slotChanges.Power !== 0 && (
                              <span className="px-2 py-0.5 text-xs rounded bg-blue-600/20 text-blue-300">
                                P: {slotChanges.Power > 0 ? '+' : ''}{slotChanges.Power}
                              </span>
                            )}
                            {slotChanges.Ammo !== 0 && (
                              <span className="px-2 py-0.5 text-xs rounded bg-red-600/20 text-red-300">
                                A: {slotChanges.Ammo > 0 ? '+' : ''}{slotChanges.Ammo}
                              </span>
                            )}
                            {slotChanges.Utility !== 0 && (
                              <span className="px-2 py-0.5 text-xs rounded bg-emerald-600/20 text-emerald-300">
                                U: {slotChanges.Utility > 0 ? '+' : ''}{slotChanges.Utility}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-neutral-500">Click to edit</span>
                  </summary>
                  <div className="mt-6">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <SecondaryForm secondary={secondary as any} mode="edit" />
                  </div>
                </details>
              );
            })}
          </div>
          {secondaries.length === 0 && (
            <p className="text-center text-neutral-500 py-8 border border-neutral-800 rounded-md bg-neutral-900/50">
              No secondary systems in the catalog yet. Create your first secondary system above.
            </p>
          )}
        </section>

        <footer className="pt-8 border-t border-neutral-800">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-md border border-neutral-700/70 text-neutral-400 hover:border-neutral-500 hover:text-white transition-colors"
          >
            ← Back to Admin Dashboard
          </Link>
        </footer>
      </div>
    </div>
  );
}