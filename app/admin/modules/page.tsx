import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuleForm } from "@/components/admin/ModuleForm";

const SLOT_COLORS = {
  Power: "bg-blue-600/20 text-blue-400",
  Ammo: "bg-red-600/20 text-red-400",
  Utility: "bg-emerald-600/20 text-emerald-400",
};

export default async function ModuleAdminPage() {
  const modules = await prisma.module.findMany({ orderBy: { slot: "asc" } });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="space-y-3">
          <h1 className="text-2xl font-bold tracking-[0.35em] uppercase text-[color:rgb(220,230,255)]">
            Universal Modules Catalog
          </h1>
          <p className="text-sm text-neutral-500">
            Modular components that fit into the hull grid to customize your ship&apos;s capabilities
          </p>
        </header>

        {/* Create New Module */}
        <section className="border border-neutral-800 rounded-md bg-neutral-900/70 px-6 py-6">
          <h2 className="text-lg font-semibold text-white mb-4">Create New Module</h2>
          <ModuleForm mode="create" />
        </section>

        {/* Existing Modules */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Existing Modules ({modules.length})</h2>
          
          {/* Group by slot type */}
          {["Power", "Ammo", "Utility"].map((slotType) => {
            const slotsOfType = modules.filter(m => m.slot === slotType);
            if (slotsOfType.length === 0) return null;
            
            return (
              <div key={slotType} className="space-y-3">
                <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
                  {slotType} Modules ({slotsOfType.length})
                </h3>
                {slotsOfType.map((module) => {
                  const shape = (module.shape as Array<{ r: number; c: number }>) || [];
                  const shapeSize = shape.length;
                  
                  return (
                    <details key={module.id} className="border border-neutral-800 rounded-md bg-neutral-900/70 px-6 py-4">
                      <summary className="cursor-pointer flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <h4 className="text-white font-semibold">
                            {module.familyName || module.id}
                            {module.variantTier && <span className="text-neutral-400 ml-2">— {module.variantTier}</span>}
                          </h4>
                          <div className="flex gap-2">
                            <span className={`px-2 py-0.5 text-xs rounded ${SLOT_COLORS[module.slot as keyof typeof SLOT_COLORS]}`}>
                              {module.slot}
                            </span>
                            <span className="px-2 py-0.5 text-xs rounded bg-neutral-800 text-neutral-400">
                              Size: {shapeSize === 1 ? 'S' : shapeSize <= 4 ? 'M' : 'L'}
                            </span>
                            <span className="px-2 py-0.5 text-xs rounded bg-neutral-800 text-neutral-400">
                              BW: {module.baseBW}
                            </span>
                            {module.minHullSize && (
                              <span className="px-2 py-0.5 text-xs rounded bg-yellow-600/20 text-yellow-400">
                                {module.minHullSize}+
                              </span>
                            )}
                            {module.tags && (module.tags as string[]).slice(0, 2).map((tag: string) => (
                              <span key={tag} className="px-2 py-0.5 text-xs rounded bg-neutral-800 text-neutral-400">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-neutral-500">Click to edit</span>
                      </summary>
                      <div className="mt-6">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <ModuleForm module={module as any} mode="edit" />
                      </div>
                    </details>
                  );
                })}
              </div>
            );
          })}
          
          {modules.length === 0 && (
            <p className="text-center text-neutral-500 py-8 border border-neutral-800 rounded-md bg-neutral-900/50">
              No modules in the catalog yet. Create your first module above.
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