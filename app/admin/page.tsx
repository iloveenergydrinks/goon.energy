"use client";

import Link from "next/link";

const adminLinks = [
  { href: "/admin/hulls", label: "Manage Hulls" },
  { href: "/admin/primaries", label: "Manage Primary Systems" },
  { href: "/admin/secondaries", label: "Manage Secondary Systems" },
  { href: "/admin/modules", label: "Manage Modules" },
];

export default function AdminLanding() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-[0.35em] uppercase text-[color:rgb(220,230,255)]">
            Catalog Administration
          </h1>
          <p className="mt-3 text-sm text-neutral-500">
            Create and edit hulls, weapon systems, and universal modules. These tools write directly to the shared database.
          </p>
        </header>

        {/* System Overview */}
        <section className="border border-neutral-800 rounded-md bg-neutral-900/70 px-6 py-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">How the Soft Archetype System Works</h2>
          
          <div className="space-y-6 text-sm text-neutral-300">
            <div>
              <h3 className="text-xs uppercase tracking-[0.3em] text-neutral-500 mb-2">Core Concept</h3>
              <p>
                Ships are built from four components: <span className="text-white">Hulls</span>, <span className="text-white">Primary Systems</span>, 
                <span className="text-white">Secondary Systems</span>, and <span className="text-white">Universal Modules</span>. 
                Unlike traditional class systems, any module can fit on any hull—if the shape fits and you have the bandwidth.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-xs uppercase tracking-[0.3em] text-neutral-500 mb-2">Ship Archetypes</h3>
                <ul className="space-y-1 text-xs">
                  <li><span className="text-blue-400">Support</span> — Signal and systems augmentation</li>
                  <li><span className="text-blue-400">Defender</span> — Shielding, triage, counter-fire</li>
                  <li><span className="text-red-400">Assault</span> — Close to mid-range bruiser</li>
                  <li><span className="text-red-400">Artillery</span> — Long-range pressure and burst</li>
                  <li><span className="text-emerald-400">Recon</span> — Precision strikes, scouting</li>
                  <li><span className="text-emerald-400">Infiltrator</span> — ECM, signature suppression</li>
                  <li><span className="text-yellow-400">Carrier</span> — Drone ops and distributed fire</li>
                  <li><span className="text-yellow-400">Bulwark</span> — Attrition tanking and area denial</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs uppercase tracking-[0.3em] text-neutral-500 mb-2">Tag Synergy System</h3>
                <p className="text-xs mb-2">
                  Hulls advertise compatible and incompatible tags. Matching tags provide:
                </p>
                <ul className="space-y-1 text-xs">
                  <li>• <span className="text-green-400">Lower bandwidth costs</span> for synergistic modules</li>
                  <li>• <span className="text-green-400">Bonus stats</span> when tags align</li>
                  <li>• <span className="text-green-400">Higher mismatch tolerance</span> for signature builds</li>
                  <li>• <span className="text-red-400">Penalties</span> for incompatible combinations</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-[0.3em] text-neutral-500 mb-2">Module Variants</h3>
              <p className="text-xs">
                Universal modules scale with hull size. A <span className="text-white">Flux Support Matrix</span> on a Frigate 
                becomes the Mk.I variant, while the same module on a Capital ship upgrades to Mk.III with enhanced stats and bandwidth requirements.
                This keeps small ships competitive while rewarding larger platforms with more powerful versions.
              </p>
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-[0.3em] text-neutral-500 mb-2">Design Philosophy</h3>
              <p className="text-xs">
                The system encourages archetypal play through soft incentives rather than hard restrictions. 
                A Defender hull <em>can</em> mount Artillery weapons—it just won&apos;t be as efficient as a purpose-built Artillery platform. 
                This creates a spectrum of builds from hyper-optimized to creative hybrids, supporting both new players following 
                suggested paths and veterans experimenting with off-meta combinations.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="border border-neutral-800 rounded-md bg-neutral-900/70 hover:bg-neutral-900 transition-colors px-4 py-5"
            >
              <div className="text-xs uppercase tracking-[0.35em] text-neutral-500">Section</div>
              <div className="mt-2 text-lg font-semibold text-white">{link.label}</div>
              <div className="mt-2 text-xs text-neutral-500">Open editor →</div>
            </Link>
          ))}
        </section>

        <footer>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-md border border-neutral-700/70 text-neutral-400 hover:border-neutral-500 hover:text-white transition-colors"
          >
            ← Return to Builder
          </Link>
        </footer>
      </div>
    </div>
  );
}

