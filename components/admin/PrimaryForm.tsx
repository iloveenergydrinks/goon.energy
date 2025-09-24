"use client";

import { useState } from "react";
import { createPrimaryAction, updatePrimaryAction, deletePrimaryAction } from "@/app/admin/primaries/actions";
import type { PrimaryArchetype } from "@/types/fitting";

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

interface PrimaryFormProps {
  primary?: PrimaryArchetype;
  mode: "create" | "edit";
}

export function PrimaryForm({ primary, mode }: PrimaryFormProps) {
  const [stats, setStats] = useState<StatField[]>(
    primary?.baseStats
      ? Object.entries(primary.baseStats).map(([key, value]) => ({ key, value: value as number }))
      : [
          { key: "damage", value: 100 },
          { key: "rateOfFire", value: 1 },
          { key: "range", value: 150 },
          { key: "tracking", value: 10 }
        ]
  );

  const [compatibleTags, setCompatibleTags] = useState<string[]>(
    primary?.tags || []
  );

  const addStat = () => {
    setStats([...stats, { key: "", value: 0 }]);
  };

  const updateStat = (index: number, field: "key" | "value", value: string | number) => {
    const newStats = [...stats];
    if (field === "key") {
      newStats[index].key = value as string;
    } else {
      newStats[index].value = Number(value);
    }
    setStats(newStats);
  };

  const removeStat = (index: number) => {
    setStats(stats.filter((_, i) => i !== index));
  };

  const handleTagInput = (value: string) => {
    const tags = value.split(",").map(t => t.trim()).filter(Boolean);
    setCompatibleTags(tags);
  };

  const action = mode === "create" ? createPrimaryAction : updatePrimaryAction;

  return (
    <form action={action} className="space-y-6">
      {mode === "edit" && primary && (
        <input type="hidden" name="id" value={primary.id} />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <div className="text-xs text-neutral-500 italic mb-2">
            IDs are generated automatically for new primary systems
          </div>
        </div>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Name</span>
          <input
            name="name"
            defaultValue={primary?.name}
            className="mt-1 w-full rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            required
          />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Power Cost</span>
          <input
            type="number"
            name="powerCost"
            defaultValue={primary?.powerDraw || 30}
            className="mt-1 w-full rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            required
          />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Archetype Focus</span>
          <select
            name="archetypeFocus"
            defaultValue={String(primary?.archetypeFocus || "")}
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

        <label className="block sm:col-span-2">
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Description</span>
          <textarea
            name="description"
            defaultValue={primary?.description}
            rows={2}
            className="mt-1 w-full rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            placeholder="E.g., Long-range precision strikes with high alpha damage"
          />
        </label>
      </div>

      {/* Stats with better UX */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-[0.3em] text-neutral-500">Weapon Stats</h3>
          <button
            type="button"
            onClick={addStat}
            className="text-xs px-2 py-1 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors"
          >
            + Add Stat
          </button>
        </div>
        <p className="text-xs text-neutral-400">
          Common stats: damage, rateOfFire, range, tracking, penetration, lockTime
        </p>
        <div className="space-y-2">
          {stats.map((stat, index) => (
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
                className="text-red-400 hover:text-red-300 text-sm px-2"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <input
          type="hidden"
          name="stats"
          value={stats.map(s => `${s.key}:${s.value}`).join(",")}
        />
      </div>

      {/* Compatible Tags */}
      <div className="space-y-2">
        <h3 className="text-xs uppercase tracking-[0.3em] text-neutral-500">Compatible Tags</h3>
        <input
          type="text"
          placeholder="Enter tags separated by commas"
          value={compatibleTags.join(", ")}
          onChange={(e) => handleTagInput(e.target.value)}
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

      <div className="flex justify-end gap-3">
        {mode === "edit" && primary && (
          <button
            type="submit"
            formAction={deletePrimaryAction}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm rounded-md transition-colors"
          >
            Delete Primary
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
        >
          {mode === "create" ? "Create Primary" : "Update Primary"}
        </button>
      </div>
    </form>
  );
}
