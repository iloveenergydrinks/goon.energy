"use client";

import { useState } from "react";
import { GridBuilder } from "./GridBuilder";
import { createHullAction, updateHullAction, deleteHullAction } from "@/app/admin/hulls/actions";
import type { Hull } from "@/types/fitting";

const SIZE_OPTIONS = ["Frigate", "Destroyer", "Cruiser", "Capital"] as const;
const ARCHETYPE_OPTIONS = [
  "support",
  "defender",
  "assault",
  "artillery",
  "recon",
  "infiltrator",
  "carrier",
  "bulwark"
] as const;

interface StatField {
  key: string;
  value: number;
}

interface HullFormProps {
  hull?: Hull;
  mode: "create" | "edit";
}

export function HullForm({ hull, mode }: HullFormProps) {
  const [baseStats, setBaseStats] = useState<StatField[]>(
    hull?.baseStats
      ? Object.entries(hull.baseStats).map(([key, value]) => ({ key, value: value as number }))
      : [{ key: "hull", value: 1000 }, { key: "armor", value: 250 }]
  );

  const [compatibleTags, setCompatibleTags] = useState<string[]>(
    hull?.compatibleTags || []
  );

  const [incompatibleTags, setIncompatibleTags] = useState<string[]>(
    hull?.incompatibleTags || []
  );

  const [preferredWeapons, setPreferredWeapons] = useState<string[]>(
    hull?.preferredWeapons || []
  );

  const addStat = () => {
    setBaseStats([...baseStats, { key: "", value: 0 }]);
  };

  const updateStat = (index: number, field: "key" | "value", value: string | number) => {
    const newStats = [...baseStats];
    if (field === "key") {
      newStats[index].key = value as string;
    } else {
      newStats[index].value = Number(value);
    }
    setBaseStats(newStats);
  };

  const removeStat = (index: number) => {
    setBaseStats(baseStats.filter((_, i) => i !== index));
  };

  const handleTagInput = (value: string, setter: (tags: string[]) => void) => {
    const tags = value.split(",").map(t => t.trim()).filter(Boolean);
    setter(tags);
  };

  const action = mode === "create" ? createHullAction : updateHullAction;

  return (
    <form action={action} className="space-y-6">
      {mode === "edit" && hull && (
        <input type="hidden" name="id" value={hull.id} />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <div className="text-xs text-neutral-500 italic mb-2">
            IDs are generated automatically for new hulls
          </div>
        </div>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Name</span>
          <input
            name="name"
            defaultValue={hull?.name}
            className="mt-1 w-full rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            required
          />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Size</span>
          <select
            name="sizeId"
            defaultValue={hull?.sizeId || "Frigate"}
            className="mt-1 w-full rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          >
            {SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Power Capacity</span>
          <input
            type="number"
            name="powerCapacity"
            defaultValue={hull?.powerCapacity || 60}
            className="mt-1 w-full rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            required
          />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Bandwidth Limit</span>
          <input
            type="number"
            name="bandwidthLimit"
            defaultValue={hull?.bandwidthLimit || 60}
            className="mt-1 w-full rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            required
          />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Archetype</span>
          <select
            name="archetype"
            defaultValue={String(hull?.archetype || "")}
            className="mt-1 w-full rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="">None</option>
            {ARCHETYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Mismatch Tolerance</span>
          <input
            type="number"
            step="0.05"
            name="mismatchTolerance"
            defaultValue={hull?.mismatchTolerance || 0}
            className="mt-1 w-full rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Description</span>
          <textarea
            name="description"
            defaultValue={hull?.description}
            rows={2}
            className="mt-1 w-full rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          />
        </label>
      </div>

      {/* Grid Builder */}
      <div className="space-y-2">
        <h3 className="text-xs uppercase tracking-[0.3em] text-neutral-500">Grid Layout</h3>
        <p className="text-xs text-neutral-400">
          Click cells to cycle: Empty → Power → Ammo → Utility
        </p>
        <GridBuilder
          fieldName="grid"
          initialRows={hull?.grid?.rows || 3}
          initialCols={hull?.grid?.cols || 5}
          initialSlots={hull?.grid?.slots}
        />
      </div>

      {/* Base Stats with better UX */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-[0.3em] text-neutral-500">Base Stats</h3>
          <button
            type="button"
            onClick={addStat}
            className="text-xs px-2 py-1 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors"
          >
            + Add Stat
          </button>
        </div>
        <div className="space-y-2">
          {baseStats.map((stat, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Stat name"
                value={stat.key}
                onChange={(e) => updateStat(index, "key", e.target.value)}
                className="flex-1 rounded bg-neutral-800 border border-neutral-700 px-2 py-1 text-sm text-white"
              />
              <input
                type="number"
                placeholder="Value"
                value={stat.value}
                onChange={(e) => updateStat(index, "value", e.target.value)}
                className="w-24 rounded bg-neutral-800 border border-neutral-700 px-2 py-1 text-sm text-white"
              />
              <button
                type="button"
                onClick={() => removeStat(index)}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <input
          type="hidden"
          name="baseStats"
          value={baseStats.map(s => `${s.key}:${s.value}`).join(",")}
        />
      </div>

      {/* Tags with chips UI */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-[0.3em] text-neutral-500">Compatible Tags</h3>
          <input
            type="text"
            placeholder="Enter tags separated by commas"
            value={compatibleTags.join(", ")}
            onChange={(e) => handleTagInput(e.target.value, setCompatibleTags)}
            className="w-full rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white"
          />
          <div className="flex flex-wrap gap-1">
            {compatibleTags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs rounded-full bg-green-600/20 text-green-400"
              >
                {tag}
              </span>
            ))}
          </div>
          <input type="hidden" name="compatibleTags" value={compatibleTags.join(",")} />
        </div>

        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-[0.3em] text-neutral-500">Incompatible Tags</h3>
          <input
            type="text"
            placeholder="Enter tags separated by commas"
            value={incompatibleTags.join(", ")}
            onChange={(e) => handleTagInput(e.target.value, setIncompatibleTags)}
            className="w-full rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white"
          />
          <div className="flex flex-wrap gap-1">
            {incompatibleTags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs rounded-full bg-red-600/20 text-red-400"
              >
                {tag}
              </span>
            ))}
          </div>
          <input type="hidden" name="incompatibleTags" value={incompatibleTags.join(",")} />
        </div>

        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-[0.3em] text-neutral-500">Preferred Weapons</h3>
          <input
            type="text"
            placeholder="Enter weapon names separated by commas"
            value={preferredWeapons.join(", ")}
            onChange={(e) => handleTagInput(e.target.value, setPreferredWeapons)}
            className="w-full rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white"
          />
          <div className="flex flex-wrap gap-1">
            {preferredWeapons.map((weapon) => (
              <span
                key={weapon}
                className="px-2 py-0.5 text-xs rounded-full bg-blue-600/20 text-blue-400"
              >
                {weapon}
              </span>
            ))}
          </div>
          <input type="hidden" name="preferredWeapons" value={preferredWeapons.join(",")} />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {mode === "edit" && hull && (
          <button
            type="submit"
            formAction={deleteHullAction}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm rounded-md transition-colors"
          >
            Delete Hull
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
        >
          {mode === "create" ? "Create Hull" : "Update Hull"}
        </button>
      </div>
    </form>
  );
}
