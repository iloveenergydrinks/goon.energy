"use client";

import { useState } from "react";
import { createModuleAction, updateModuleAction, deleteModuleAction } from "@/app/admin/modules/actions";
import { ShapeBuilder } from "./ShapeBuilder";
import type { ModuleDef } from "@/types/fitting";

const SLOT_OPTIONS = ["Power", "Ammo", "Utility"] as const;
const SIZE_OPTIONS = ["Frigate", "Destroyer", "Cruiser", "Capital"] as const;

interface StatField {
  key: string;
  value: number;
}

interface ModuleFormProps {
  module?: ModuleDef;
  mode: "create" | "edit";
}

export function ModuleForm({ module, mode }: ModuleFormProps) {
  const [stats, setStats] = useState<StatField[]>(
    module?.stats
      ? Object.entries(module.stats).map(([key, value]) => ({ key, value: value as number }))
      : []
  );

  const [tags, setTags] = useState<string[]>(module?.tags || []);

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
    const newTags = value.split(",").map(t => t.trim()).filter(Boolean);
    setTags(newTags);
  };

  const action = mode === "create" ? createModuleAction : updateModuleAction;

  return (
    <form action={action} className="space-y-6">
      {mode === "edit" && module && (
        <input type="hidden" name="id" value={module.id} />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <div className="text-xs text-neutral-500 italic mb-2">
            IDs are generated automatically for new modules
          </div>
        </div>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Module Name</span>
          <input
            name="name"
            defaultValue={module?.name}
            className="mt-1 w-full rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            required
            placeholder="e.g., Power Stabilizers"
          />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Slot Type</span>
          <select
            name="slot"
            defaultValue={module?.slot || "Power"}
            className="mt-1 w-full rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          >
            {SLOT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Base Bandwidth</span>
          <input
            type="number"
            name="baseBW"
            defaultValue={module?.baseBW || 10}
            className="mt-1 w-full rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            required
          />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Family Name</span>
          <input
            name="familyName"
            defaultValue={module?.familyName}
            className="mt-1 w-full rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            placeholder="e.g., Flux Support Matrix"
          />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Variant Tier</span>
          <input
            name="variantTier"
            defaultValue={module?.variantTier}
            className="mt-1 w-full rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            placeholder="e.g., Mk.I, Mk.II, Mk.III"
          />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Min Hull Size</span>
          <select
            name="minHullSize"
            defaultValue={module?.minHullSize || ""}
            className="mt-1 w-full rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="">Any Size</option>
            {SIZE_OPTIONS.map((option) => (
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
            defaultValue={module?.description}
            rows={2}
            className="mt-1 w-full rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            placeholder="e.g., Stabilizes power output fluctuations"
          />
        </label>
      </div>

      {/* Module Shape Builder */}
      <div className="space-y-2">
        <h3 className="text-xs uppercase tracking-[0.3em] text-neutral-500">Module Shape</h3>
        <ShapeBuilder 
          fieldName="shape" 
          initialShape={Array.isArray(module?.shape) ? module.shape : [{ r: 0, c: 0 }]}
        />
      </div>

      {/* Stats with better UX */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-[0.3em] text-neutral-500">Module Stats</h3>
          <button
            type="button"
            onClick={addStat}
            className="text-xs px-2 py-1 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors"
          >
            + Add Stat
          </button>
        </div>
        <p className="text-xs text-neutral-400">
          Common stats: powerGen, damage, rofBonus, range, tracking, evasion, armor, shieldStrength
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
        {stats.length === 0 && (
          <p className="text-xs text-neutral-500 italic">No stats defined. Click &quot;+ Add Stat&quot; to add module effects.</p>
        )}
        <input
          type="hidden"
          name="stats"
          value={stats.map(s => `${s.key}:${s.value}`).join(",")}
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <h3 className="text-xs uppercase tracking-[0.3em] text-neutral-500">Module Tags</h3>
        <p className="text-xs text-neutral-400">
          Tags determine synergies with hull archetypes (e.g., support, assault, energy, defensive)
        </p>
        <input
          type="text"
          placeholder="Enter tags separated by commas"
          value={tags.join(", ")}
          onChange={(e) => handleTagInput(e.target.value)}
          className="w-full rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white"
        />
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs rounded-full bg-blue-600/20 text-blue-400"
            >
              {tag}
            </span>
          ))}
        </div>
        <input type="hidden" name="tags" value={tags.join(",")} />
      </div>

      <div className="flex justify-end gap-3">
        {mode === "edit" && module && (
          <button
            type="submit"
            formAction={deleteModuleAction}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm rounded-md transition-colors"
          >
            Delete Module
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
        >
          {mode === "create" ? "Create Module" : "Update Module"}
        </button>
      </div>
    </form>
  );
}
