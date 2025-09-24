import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PrimaryForm } from "@/components/admin/PrimaryForm";

// Force dynamic rendering - don't try to generate static pages at build time
export const dynamic = 'force-dynamic';

export default async function PrimaryAdminPage() {
  const primaries = await prisma.primarySystem.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="space-y-3">
          <h1 className="text-2xl font-bold tracking-[0.35em] uppercase text-[color:rgb(220,230,255)]">
            Primary Systems Catalog
          </h1>
          <p className="text-sm text-neutral-500">
            Main weapon systems that define your ship&apos;s combat role
          </p>
        </header>

        {/* Create New Primary */}
        <section className="border border-neutral-800 rounded-md bg-neutral-900/70 px-6 py-6">
          <h2 className="text-lg font-semibold text-white mb-4">Create New Primary System</h2>
          <PrimaryForm mode="create" />
        </section>

        {/* Existing Primaries */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Existing Primary Systems ({primaries.length})</h2>
          <div className="space-y-3">
            {primaries.map((primary) => {
              const hasPower = primary.powerDraw != null && primary.powerDraw > 0;
              const hasArchetype = !!primary.archetypeFocus;
              const hasStats = primary.baseStats && typeof primary.baseStats === 'object' && primary.baseStats !== null && Object.keys(primary.baseStats).length > 0;
              const hasBadges = hasPower || hasArchetype || hasStats;
              
              return (
                <details key={primary.id} className="border border-neutral-800 rounded-md bg-neutral-900/70 px-6 py-4">
                  <summary className="cursor-pointer flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h3 className="text-white font-semibold">{primary.name}</h3>
                      {hasBadges && (
                        <div className="flex gap-2">
                        {hasPower && (
                          <span className="px-2 py-0.5 text-xs rounded bg-neutral-800 text-neutral-400">
                            Power: {primary.powerDraw}
                          </span>
                        )}
                          {hasArchetype && (
                            <span className="px-2 py-0.5 text-xs rounded bg-blue-600/20 text-blue-400">
                              {primary.archetypeFocus}
                            </span>
                          )}
                          {hasStats && primary.baseStats && typeof primary.baseStats === 'object' && primary.baseStats !== null && Object.entries(primary.baseStats).slice(0, 2).map(([key, value]) => (
                            <span key={key} className="px-2 py-0.5 text-xs rounded bg-neutral-800 text-neutral-400">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-neutral-500">Click to edit</span>
                  </summary>
                <div className="mt-6">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <PrimaryForm primary={primary as any} mode="edit" />
                </div>
                </details>
              );
            })}
          </div>
          {primaries.length === 0 && (
            <p className="text-center text-neutral-500 py-8 border border-neutral-800 rounded-md bg-neutral-900/50">
              No primary systems in the catalog yet. Create your first primary system above.
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