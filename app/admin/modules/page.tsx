import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuleForm } from "@/components/admin/ModuleForm";
import { AdminHeader } from "@/components/admin/AdminHeader";

// Force dynamic rendering - don't try to generate static pages at build time
export const dynamic = 'force-dynamic';

// Default colors for known types
const DEFAULT_SLOT_COLORS: Record<string, string> = {
  Power: "bg-blue-600/20 text-blue-400",
  Ammo: "bg-red-600/20 text-red-400",
  Utility: "bg-emerald-600/20 text-emerald-400",
};

export default async function ModuleAdminPage() {
  const [modules, moduleTypes] = await Promise.all([
    prisma.module.findMany({ orderBy: { slot: "asc" } }),
    prisma.moduleType.findMany({ where: { isActive: true }, orderBy: { isSystemType: "desc" } })
  ]);
  
  // Create a map for module type colors
  const typeColorMap: Record<string, string> = {};
  for (const type of moduleTypes) {
    const color = type.color;
    // Convert hex color to tailwind-style classes
    typeColorMap[type.id] = `bg-[${color}20] text-[${color}]`;
  }
  
  // Group modules by type
  const modulesByType = new Map<string, typeof modules>();
  for (const module of modules) {
    const existing = modulesByType.get(module.slot) || [];
    modulesByType.set(module.slot, [...existing, module]);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <AdminHeader 
          title="Universal Modules Catalog"
          description="Modular components that fit into the hull grid to customize your ship's capabilities"
        />

        {/* Create New Module */}
        <section className="border border-neutral-800 rounded-md bg-neutral-900/70 px-6 py-6">
          <h2 className="text-lg font-semibold text-white mb-4">Create New Module</h2>
          <ModuleForm mode="create" />
        </section>

        {/* Existing Modules */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Existing Modules ({modules.length})</h2>
          
          {/* Group by module type */}
          {moduleTypes.map((moduleType) => {
            const modulesOfType = modulesByType.get(moduleType.id) || [];
            if (modulesOfType.length === 0) return null;
            
            return (
              <div key={moduleType.id} className="space-y-3">
                <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                  <span 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: moduleType.color }}
                  />
                  {moduleType.displayName} Modules ({modulesOfType.length})
                  {moduleType.isSystemType && (
                    <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded normal-case">
                      System
                    </span>
                  )}
                </h3>
                {modulesOfType.map((module) => {
                  const shape = (module.shape as Array<{ r: number; c: number }>) || [];
                  const shapeSize = shape.length;
                  const slotColor = DEFAULT_SLOT_COLORS[module.slot] || typeColorMap[module.slot] || "bg-neutral-600/20 text-neutral-400";
                  
                  return (
                    <details key={module.id} className="border border-neutral-800 rounded-md bg-neutral-900/70 px-6 py-4">
                      <summary className="cursor-pointer flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <h4 className="text-white font-semibold">
                            {module.familyName || module.id}
                            {module.variantTier && <span className="text-neutral-400 ml-2">— {module.variantTier}</span>}
                          </h4>
                          <div className="flex gap-2">
                            <span className={`px-2 py-0.5 text-xs rounded ${slotColor}`}>
                              {moduleType.displayName}
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
          
          {/* Show orphaned modules (with unknown types) */}
          {(() => {
            const knownTypes = new Set(moduleTypes.map(t => t.id));
            const orphanedModules = modules.filter(m => !knownTypes.has(m.slot));
            if (orphanedModules.length > 0) {
              return (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider">
                    ⚠️ Orphaned Modules ({orphanedModules.length})
                  </h3>
                  <p className="text-xs text-neutral-500">
                    These modules have unknown types. Create the missing module types or update these modules.
                  </p>
                  {orphanedModules.map((module) => {
                    const shape = (module.shape as Array<{ r: number; c: number }>) || [];
                    const shapeSize = shape.length;
                    
                    return (
                      <details key={module.id} className="border border-red-800/50 rounded-md bg-red-900/10 px-6 py-4">
                        <summary className="cursor-pointer flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <h4 className="text-white font-semibold">
                              {module.familyName || module.id}
                              {module.variantTier && <span className="text-neutral-400 ml-2">— {module.variantTier}</span>}
                            </h4>
                            <div className="flex gap-2">
                              <span className="px-2 py-0.5 text-xs rounded bg-red-600/20 text-red-400">
                                Unknown Type: {module.slot}
                              </span>
                              <span className="px-2 py-0.5 text-xs rounded bg-neutral-800 text-neutral-400">
                                Size: {shapeSize === 1 ? 'S' : shapeSize <= 4 ? 'M' : 'L'}
                              </span>
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
            }
            return null;
          })()}
          
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