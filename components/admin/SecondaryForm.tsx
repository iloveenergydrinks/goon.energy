"use client";

import { useState } from "react";
import { createSecondaryAction, updateSecondaryAction, deleteSecondaryAction } from "@/app/admin/secondaries/actions";
import type { SecondaryDef } from "@/types/fitting";

const CATEGORY_OPTIONS = ["Offensive", "Defensive", "Utility"] as const;
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

interface SecondaryFormProps {
  secondary?: SecondaryDef;
  mode: "create" | "edit";
}

export function SecondaryForm({ secondary, mode }: SecondaryFormProps) {
  const [slotAdjustments, setSlotAdjustments] = useState({
    Power: secondary?.slotAdjustments?.Power || 0,
    Ammo: secondary?.slotAdjustments?.Ammo || 0,
    Utility: secondary?.slotAdjustments?.Utility || 0,
  });

  const [compatibleTags, setCompatibleTags] = useState<string[]>(
    secondary?.compatibleTags || []
  );

  const updateSlotAdjustment = (slot: keyof typeof slotAdjustments, value: number) => {
    setSlotAdjustments(prev => ({ ...prev, [slot]: value }));
  };

  const handleTagInput = (value: string) => {
    const tags = value.split(",").map(t => t.trim()).filter(Boolean);
    setCompatibleTags(tags);
  };

  const action = mode === "create" ? createSecondaryAction : updateSecondaryAction;

  return (
    <form action={action} className="space-y-6">
      {mode === "edit" && secondary && (
        <input type="hidden" name="id" value={secondary.id} />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <div className="text-xs text-neutral-500 italic mb-2">
            IDs are generated automatically for new secondary systems
          </div>
        </div>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Name</span>
          <input
            name="name"
            defaultValue={secondary?.name}
            className="mt-1 w-full rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            required
          />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Category</span>
          <select
            name="category"
            defaultValue={String(secondary?.category || "Utility")}
            className="mt-1 w-full rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Power Cost</span>
          <input
            type="number"
            name="powerCost"
            defaultValue={secondary?.powerCost || 10}
            className="mt-1 w-full rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            required
          />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Archetype Focus</span>
          <select
            name="archetypeFocus"
            defaultValue={String(secondary?.archetypeFocus || "")}
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
            defaultValue={secondary?.description || ""}
            rows={2}
            className="mt-1 w-full rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            placeholder="E.g., Shreds incoming missiles and light craft with area denial bursts"
          />
        </label>
      </div>

      {/* Slot Adjustments with visual controls */}
      <div className="space-y-2">
        <h3 className="text-xs uppercase tracking-[0.3em] text-neutral-500">Slot Adjustments</h3>
        <p className="text-xs text-neutral-400">
          Modify available slots when this secondary is equipped (positive = add, negative = remove)
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-blue-400 mb-1">Power Slots</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateSlotAdjustment("Power", slotAdjustments.Power - 1)}
                className="w-8 h-8 rounded bg-neutral-800 hover:bg-neutral-700 text-white"
              >
                −
              </button>
              <input
                type="number"
                value={slotAdjustments.Power}
                onChange={(e) => updateSlotAdjustment("Power", Number(e.target.value))}
                className="w-16 text-center rounded bg-neutral-800 border border-neutral-700 px-2 py-1 text-sm text-white"
              />
              <button
                type="button"
                onClick={() => updateSlotAdjustment("Power", slotAdjustments.Power + 1)}
                className="w-8 h-8 rounded bg-neutral-800 hover:bg-neutral-700 text-white"
              >
                +
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-red-400 mb-1">Ammo Slots</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateSlotAdjustment("Ammo", slotAdjustments.Ammo - 1)}
                className="w-8 h-8 rounded bg-neutral-800 hover:bg-neutral-700 text-white"
              >
                −
              </button>
              <input
                type="number"
                value={slotAdjustments.Ammo}
                onChange={(e) => updateSlotAdjustment("Ammo", Number(e.target.value))}
                className="w-16 text-center rounded bg-neutral-800 border border-neutral-700 px-2 py-1 text-sm text-white"
              />
              <button
                type="button"
                onClick={() => updateSlotAdjustment("Ammo", slotAdjustments.Ammo + 1)}
                className="w-8 h-8 rounded bg-neutral-800 hover:bg-neutral-700 text-white"
              >
                +
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-emerald-400 mb-1">Utility Slots</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateSlotAdjustment("Utility", slotAdjustments.Utility - 1)}
                className="w-8 h-8 rounded bg-neutral-800 hover:bg-neutral-700 text-white"
              >
                −
              </button>
              <input
                type="number"
                value={slotAdjustments.Utility}
                onChange={(e) => updateSlotAdjustment("Utility", Number(e.target.value))}
                className="w-16 text-center rounded bg-neutral-800 border border-neutral-700 px-2 py-1 text-sm text-white"
              />
              <button
                type="button"
                onClick={() => updateSlotAdjustment("Utility", slotAdjustments.Utility + 1)}
                className="w-8 h-8 rounded bg-neutral-800 hover:bg-neutral-700 text-white"
              >
                +
              </button>
            </div>
          </div>
        </div>
        <input
          type="hidden"
          name="slotAdjustments"
          value={`Power:${slotAdjustments.Power},Ammo:${slotAdjustments.Ammo},Utility:${slotAdjustments.Utility}`}
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
        {mode === "edit" && secondary && (
          <button
            type="submit"
            formAction={deleteSecondaryAction}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm rounded-md transition-colors"
          >
            Delete Secondary
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
        >
          {mode === "create" ? "Create Secondary" : "Update Secondary"}
        </button>
      </div>
    </form>
  );
}
