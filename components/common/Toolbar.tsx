"use client";
import { useFittingStore } from "@/store/useFittingStore";

export default function Toolbar() {
  const toPermalink = useFittingStore((s) => s.toPermalink);
  const seed = useFittingStore((s) => s.seed);
  const rollSeed = useFittingStore((s) => s.rollSeed);
  const generate = useFittingStore((s) => s.generate);
  const code = toPermalink();
  const copy = async () => {
    if (typeof window === "undefined") return;
    await navigator.clipboard.writeText(`${window.location.origin}/builder?fit=${code}`);
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm">
        <span className="px-2 py-1 rounded border border-neutral-300 bg-neutral-50 text-neutral-900">
          Seed: <span className="font-mono">{seed}</span>
        </span>
        <button
          className="px-2 py-1 border border-neutral-300 rounded bg-white hover:bg-neutral-50 text-neutral-900"
          onClick={() => {
            rollSeed();
            generate();
          }}
        >
          Regen
        </button>
      </div>
      <div>
        <button className="px-3 py-2 border border-neutral-300 rounded bg-white hover:bg-neutral-50 text-neutral-900" onClick={copy}>
          Copy Permalink
        </button>
      </div>
    </div>
  );
}

