"use client";

import Link from "next/link";
import { useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFittingStore } from "@/store/useFittingStore";
import type { Catalog } from "@/lib/catalog";

interface SurfaceSummaryProps {
  placement?: "top" | "bottom";
  catalog?: Catalog;
}

export default function SurfaceSummary({ placement = "bottom", catalog }: SurfaceSummaryProps) {
  const hydrateCatalog = useFittingStore((s) => s.hydrateCatalog);
  const catalogReady = useFittingStore((s) => s.catalogReady);
  const hulls = useFittingStore((s) => s.hulls);
  const primaries = useFittingStore((s) => s.primaries);
  const secondaries = useFittingStore((s) => s.secondaries);
  const selectedHullId = useFittingStore((s) => s.selectedHullId);
  const selectedPrimaryId = useFittingStore((s) => s.selectedPrimaryId);
  const selectedSecondaryIds = useFittingStore((s) => s.selectedSecondaryIds);

  useEffect(() => {
    if (!catalogReady && catalog) {
      hydrateCatalog({
        primaries: catalog.primaries,
        secondaries: catalog.secondaries,
        hulls: catalog.hulls,
        modules: catalog.modules,
        modulesById: catalog.modulesById,
        catalogReady: true,
      });
    }
  }, [catalogReady, catalog, hydrateCatalog]);

  const hull = hulls.find((h) => h.id === selectedHullId);
  const primary = primaries.find((p) => p.id === selectedPrimaryId);
  const secondaryList = useMemo(
    () => secondaries.filter((s) => selectedSecondaryIds.includes(s.id)),
    [secondaries, selectedSecondaryIds]
  );

  const totalPower = (primary?.powerDraw || 0) + secondaryList.reduce((sum, s) => sum + s.powerDraw, 0);

  const hullReady = Boolean(hull);
  const primaryReady = Boolean(primary);
  const readyForBuilder = hullReady && primaryReady;

  const router = useRouter();
  const generateFromHull = useFittingStore((s) => s.generateFromHull);

  const handleOpenBuilder = useCallback(() => {
    if (!readyForBuilder) return;
    generateFromHull();
    router.push("/builder");
  }, [generateFromHull, readyForBuilder, router]);

  return (
    <div
      className={`
        bg-[radial-gradient(circle_at_top,_rgba(40,44,52,0.95),_rgba(22,23,28,0.98))]
        border border-neutral-800/70 rounded-md px-5 py-4 text-sm text-neutral-200 shadow-[0_0_35px_rgba(10,10,10,0.45)]
        ${placement === "top" ? "mb-6" : "mt-6"}
      `}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.45em] text-[color:rgba(160,175,200,0.65)]">Selected Loadout</div>
          <div className="flex flex-wrap gap-4">
            <SummaryChip label="Hull" value={hull?.name ?? (catalogReady ? "Not selected" : "Loading…")} ready={hullReady} />
            <SummaryChip label="Primary" value={primary?.name ?? (catalogReady ? "Not selected" : "Loading…")} ready={primaryReady} />
            <SummaryChip
              label="Secondaries"
              value={catalogReady ? (secondaryList.length > 0 ? secondaryList.map((s) => s.name).join(", ") : "None") : "Loading…"}
              ready
            />
            <SummaryChip
              label="Power"
              value={catalogReady ? (hull ? `${totalPower} / ${hull.powerCapacity}` : "--") : "Loading…"}
              ready={hullReady}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/builders/modules"
            className="text-xs px-3 py-2 rounded-md border border-neutral-700/70 text-neutral-400 hover:border-neutral-500 hover:text-white transition-colors"
          >
            Universal Modules →
          </Link>
          <button
            type="button"
            onClick={handleOpenBuilder}
            disabled={!readyForBuilder}
            className={`text-sm px-4 py-2 rounded font-medium transition-colors
              ${readyForBuilder
                ? 'bg-[linear-gradient(135deg,_#3b82f6,_#2563eb)] hover:brightness-110 text-white shadow-[0_0_12px_rgba(37,99,235,0.45)]'
                : 'bg-neutral-800/80 text-neutral-500 cursor-not-allowed'
              }
            `}
          >
            Open Builder
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryChip({ label, value, ready }: { label: string; value: string; ready: boolean }) {
  return (
    <div
      className={`px-3 py-1.5 rounded-sm border backdrop-blur-sm
        ${ready
          ? 'border-[color:rgba(90,115,150,0.45)] bg-[rgba(30,36,46,0.75)] text-white'
          : 'border-neutral-800/80 bg-neutral-900/70 text-neutral-500'
        }
      `}
    >
      <div className="text-[10px] uppercase tracking-[0.4em] text-[color:rgba(130,145,170,0.55)]">{label}</div>
      <div className="text-sm font-semibold tracking-wide">{value}</div>
    </div>
  );
}

