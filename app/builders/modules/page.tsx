"use client";

import ModulePalette from "@/components/builder/ModulePalette";
import Link from "next/link";

export default function ModulesPage() {
  return (
    <div className="min-h-screen p-10 bg-neutral-950 text-neutral-200">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-[0.3em] uppercase text-[color:rgb(210,220,245)]">
              Universal Modules
            </h1>
            <p className="text-sm text-neutral-500 mt-2">
              Browse and familiarize yourself with the module catalog. Drag-and-drop fitting is available inside the builder context.
            </p>
          </div>
          <Link
            href="/"
            className="text-xs px-3 py-2 rounded-md border border-neutral-700/70 text-neutral-400 hover:border-neutral-500 hover:text-white transition-colors"
          >
            ← Back to Builder Setup
          </Link>
        </header>

        <section className="bg-neutral-900/80 border border-neutral-800/70 rounded-md p-5 max-h-[calc(100vh-12rem)] overflow-y-auto custom-scroll">
          <ModulePalette />
        </section>
      </div>
    </div>
  );
}

