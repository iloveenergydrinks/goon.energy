import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { HullForm } from "@/components/admin/HullForm";

export default async function HullAdminPage() {
  const hulls = await prisma.hull.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="space-y-3">
          <h1 className="text-2xl font-bold tracking-[0.35em] uppercase text-[color:rgb(220,230,255)]">
            Hull Catalog
          </h1>
          <p className="text-sm text-neutral-500">
            Visual hull designer with automatic ID generation. Click grid cells to place slots.
          </p>
        </header>

        {/* Create New Hull */}
        <section className="border border-neutral-800 rounded-md bg-neutral-900/70 px-6 py-6">
          <h2 className="text-lg font-semibold text-white mb-4">Create New Hull</h2>
          <HullForm mode="create" />
        </section>

        {/* Existing Hulls */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Existing Hulls ({hulls.length})</h2>
          <div className="space-y-3">
            {hulls.map((hull) => (
              <details key={hull.id} className="border border-neutral-800 rounded-md bg-neutral-900/70 px-6 py-4">
                <summary className="cursor-pointer flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="text-white font-semibold">{hull.name}</h3>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 text-xs rounded bg-neutral-800 text-neutral-400">
                        {hull.sizeId}
                      </span>
                      {hull.archetype && (
                        <span className="px-2 py-0.5 text-xs rounded bg-blue-600/20 text-blue-400">
                          {hull.archetype}
                        </span>
                      )}
                      <span className="px-2 py-0.5 text-xs rounded bg-neutral-800 text-neutral-400">
                        Power: {hull.powerCapacity}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded bg-neutral-800 text-neutral-400">
                        BW: {hull.bandwidthLimit}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-neutral-500">Click to edit</span>
                </summary>
                <div className="mt-6">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <HullForm hull={hull as any} mode="edit" />
                </div>
              </details>
            ))}
          </div>
          {hulls.length === 0 && (
            <p className="text-center text-neutral-500 py-8 border border-neutral-800 rounded-md bg-neutral-900/50">
              No hulls in the catalog yet. Create your first hull above.
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

