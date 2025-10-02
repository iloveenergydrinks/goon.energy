import HullStep from "@/components/wizard/HullStep";
import PrimaryStep from "@/components/wizard/PrimaryStep";
import SecondaryStep from "@/components/wizard/SecondaryStep";
import SurfaceSummary from "@/components/wizard/SurfaceSummary";
import { loadCatalog } from "@/lib/catalog";
import BuilderColumns from "@/components/builder/BuilderColumns";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function ShipBuilder() {
  let catalog;
  try {
    catalog = await loadCatalog();
  } catch (error) {
    // If catalog fails to load (empty database), provide empty defaults
    catalog = {
      hulls: [],
      primaries: [],
      secondaries: [],
      modules: [],
      hullsById: {},
      primariesById: {},
      secondariesById: {},
      modulesById: {}
    };
  }

  // Check if catalog is empty
  const isEmpty = catalog.hulls.length === 0 && catalog.primaries.length === 0 && catalog.secondaries.length === 0;

  if (isEmpty) {
    return (
      <div className="min-h-screen p-10 bg-neutral-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-white">Ship Catalog Empty</h1>
          <p className="text-neutral-400 mb-6">
            No ships, weapons, or systems have been configured yet. 
            Please use the admin panel to add components to the catalog.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/admin"
              className="px-6 py-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Go to Admin Panel
            </a>
            <a
              href="/"
              className="px-6 py-3 rounded-md border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-10 bg-neutral-950">
      <div className="max-w-[1400px] mx-auto">
        <SurfaceSummary placement="top" catalog={catalog} />
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h1 className="text-3xl font-bold tracking-[0.35em] uppercase text-[color:rgb(220,230,255)]">
            Ship Builder
          </h1>
          <div className="flex gap-2">
            <a
              href="/industrial"
              className="text-xs px-3 py-2 rounded-md border border-neutral-700/70 text-neutral-400 hover:border-neutral-500 hover:text-white transition-colors"
            >
              ⚗️ Industrial
            </a>
            <a
              href="/admin"
              className="text-xs px-3 py-2 rounded-md border border-neutral-700/70 text-neutral-400 hover:border-neutral-500 hover:text-white transition-colors"
            >
              Manage Ship Catalog →
            </a>
          </div>
        </div>
        <p className="text-sm text-neutral-500 mb-8">
          Configure your hull, primary, and secondary systems here. Universal modules are now managed directly inside the fitting grid.
        </p>
        <BuilderColumns
          left={
            <div className="bg-neutral-900/80 rounded-md p-4 h-[calc(100vh-8rem)]">
              <h2 className="text-lg font-semibold mb-3 text-white/90">Hull Selection</h2>
              <div className="h-[calc(100%-1.75rem)] overflow-y-auto pr-1 custom-scroll">
                <HullStep />
              </div>
            </div>
          }
          center={
            <div className="bg-neutral-900/80 rounded-md p-4 h-[calc(100vh-8rem)]">
              <h2 className="text-lg font-semibold mb-3 text-white/90">Primary Systems</h2>
              <div className="h-[calc(100%-1.75rem)] overflow-y-auto pr-1 custom-scroll">
                <PrimaryStep />
              </div>
            </div>
          }
          right={
            <div className="bg-neutral-900/80 rounded-md p-4 h-[calc(100vh-8rem)]">
              <h2 className="text-lg font-semibold mb-3 text-white/90">Secondary Systems</h2>
              <div className="h-[calc(100%-1.75rem)] overflow-y-auto pr-1 custom-scroll">
                <SecondaryStep />
              </div>
            </div>
          }
        />
        <SurfaceSummary placement="bottom" />
      </div>
    </div>
  );
}
