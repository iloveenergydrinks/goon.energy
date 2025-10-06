"use client";

import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";

const adminLinks = [
  { href: "/admin/hulls", label: "Manage Hulls" },
  { href: "/admin/primaries", label: "Manage Primary Systems" },
  { href: "/admin/secondaries", label: "Manage Secondary Systems" },
  { href: "/admin/modules", label: "Manage Modules" },
  { href: "/admin/module-types", label: "Manage Module Types" },
  { href: "/admin/slots", label: "Manage Custom Slots" },
  { href: "/admin/blueprints", label: "Manage Blueprints", section: "Industrial" },
  { href: "/admin/materials", label: "Manage Materials", section: "Industrial" },
  { href: "/admin/instructions", label: "System Instructions" },
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

        {/* System Overview moved to /admin/instructions */}

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
          <AdminNav />
        </footer>
      </div>
    </div>
  );
}

