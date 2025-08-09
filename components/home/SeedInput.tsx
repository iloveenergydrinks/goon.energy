"use client";
import { useFittingStore } from "@/store/useFittingStore";

export default function SeedInput() {
  const seed = useFittingStore((s) => s.seed);
  const setSeed = useFittingStore((s) => s.setSeed);
  const rollSeed = useFittingStore((s) => s.rollSeed);
  return (
    <div className="space-y-2">
      <div className="font-medium">Seed</div>
      <div className="flex gap-2">
        <input
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          className="border border-neutral-300 rounded px-3 py-2 flex-1"
          placeholder="seed"
        />
        <button className="border rounded px-3" onClick={rollSeed}>
          🎲
        </button>
      </div>
    </div>
  );
}

