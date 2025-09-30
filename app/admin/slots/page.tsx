"use client";

import { useState, useEffect } from "react";
import { getCustomSlots, createCustomSlot, updateCustomSlot, deleteCustomSlot, seedSystemSlots } from "./actions";
import { getModuleTypes } from "../module-types/actions";
import type { CustomSlotType, ModuleType } from "@prisma/client";
import { AdminNav } from "@/components/admin/AdminNav";

export default function CustomSlotsAdmin() {
  const [slots, setSlots] = useState<CustomSlotType[]>([]);
  const [moduleTypes, setModuleTypes] = useState<ModuleType[]>([]);
  const [editingSlot, setEditingSlot] = useState<CustomSlotType | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    displayName: "",
    description: "",
    accepts: [] as string[],
    preferredType: "",
    bwMultiplier: 1.2,
    color: "#808080",
    archetypeHints: [] as string[]
  });

  const archetypes = ["support", "defender", "assault", "artillery", "recon", "infiltrator", "carrier", "bulwark"];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [slotsData, typesData] = await Promise.all([
        getCustomSlots(),
        getModuleTypes()
      ]);
      setSlots(slotsData);
      setModuleTypes(typesData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSlots() {
    try {
      const data = await getCustomSlots();
      setSlots(data);
    } catch (error) {
      console.error("Failed to load slots:", error);
    }
  }

  async function handleSeedSystemSlots() {
    if (!confirm("This will seed/reset all system slot types. Continue?")) return;
    
    try {
      await seedSystemSlots();
      await loadSlots();
      alert("System slots seeded successfully!");
    } catch (error) {
      console.error("Failed to seed system slots:", error);
      alert("Failed to seed system slots");
    }
  }

  function startCreating() {
    setIsCreating(true);
    setEditingSlot(null);
    setFormData({
      id: "",
      name: "",
      displayName: "",
      description: "",
      accepts: [],
      preferredType: "",
      bwMultiplier: 1.2,
      color: "#808080",
      archetypeHints: []
    });
  }

  function startEditing(slot: CustomSlotType) {
    setEditingSlot(slot);
    setIsCreating(false);
    setFormData({
      id: slot.id,
      name: slot.name,
      displayName: slot.displayName,
      description: slot.description || "",
      accepts: slot.accepts,
      preferredType: slot.preferredType || "",
      bwMultiplier: slot.bwMultiplier,
      color: slot.color,
      archetypeHints: slot.archetypeHints
    });
  }

  function cancelEdit() {
    setEditingSlot(null);
    setIsCreating(false);
    setFormData({
      id: "",
      name: "",
      displayName: "",
      description: "",
      accepts: [],
      preferredType: "",
      bwMultiplier: 1.2,
      color: "#808080",
      archetypeHints: []
    });
  }

  async function handleSave() {
    try {
      if (isCreating) {
        if (!formData.id || !formData.name || !formData.displayName || formData.accepts.length === 0) {
          alert("Please fill in all required fields");
          return;
        }
        await createCustomSlot({
          ...formData,
          description: formData.description || undefined,
          preferredType: formData.preferredType || undefined,
          archetypeHints: formData.archetypeHints.length > 0 ? formData.archetypeHints : undefined
        });
      } else if (editingSlot) {
        await updateCustomSlot(editingSlot.id, {
          name: formData.name,
          displayName: formData.displayName,
          description: formData.description || undefined,
          accepts: formData.accepts,
          preferredType: formData.preferredType || undefined,
          bwMultiplier: formData.bwMultiplier,
          color: formData.color,
          archetypeHints: formData.archetypeHints
        });
      }
      await loadSlots();
      cancelEdit();
    } catch (error) {
      console.error("Failed to save slot:", error);
      alert("Failed to save slot");
    }
  }

  async function handleDelete(slot: CustomSlotType) {
    if (slot.isSystemSlot) {
      alert("Cannot delete system slot types");
      return;
    }
    
    if (!confirm(`Delete slot type "${slot.displayName}"?`)) return;
    
    try {
      await deleteCustomSlot(slot.id);
      await loadSlots();
    } catch (error) {
      console.error("Failed to delete slot:", error);
      alert("Failed to delete slot");
    }
  }

  async function handleToggleActive(slot: CustomSlotType) {
    try {
      await updateCustomSlot(slot.id, { isActive: !slot.isActive });
      await loadSlots();
    } catch (error) {
      console.error("Failed to toggle slot active state:", error);
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <AdminNav />
      </div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Custom Slot Types</h1>
        <div className="flex gap-2">
          {slots.length === 0 && (
            <button
              onClick={handleSeedSystemSlots}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Seed System Slots
            </button>
          )}
          <button
            onClick={startCreating}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create New Slot Type
          </button>
        </div>
      </div>

      {/* Form for Creating/Editing */}
      {(isCreating || editingSlot) && (
        <div className="mb-8 p-6 border border-neutral-700 rounded-lg bg-neutral-900">
          <h2 className="text-xl font-semibold mb-4">
            {isCreating ? "Create New Slot Type" : `Edit ${editingSlot?.displayName}`}
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">ID (unique identifier)</label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                disabled={!isCreating}
                className="w-full px-3 py-2 border border-neutral-600 rounded bg-neutral-800 disabled:opacity-50"
                placeholder="e.g., Weapon, Engine, Shield"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Internal Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-600 rounded bg-neutral-800"
                placeholder="e.g., weapon_slot"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Display Name</label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-600 rounded bg-neutral-800"
                placeholder="e.g., Weapon Slot"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Color (Hex)</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-10 border border-neutral-600 rounded"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1 px-3 py-2 border border-neutral-600 rounded bg-neutral-800"
                  placeholder="#808080"
                />
              </div>
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-600 rounded bg-neutral-800"
                rows={2}
                placeholder="Optional description of this slot type"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Accepts Module Types</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {moduleTypes.length === 0 ? (
                  <p className="text-sm text-neutral-500">
                    No module types available. <a href="/admin/module-types" className="text-blue-400 hover:underline">Create module types first</a>
                  </p>
                ) : (
                  <>
                    <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">System Types</div>
                    {moduleTypes.filter(t => t.isSystemType).map((type) => (
                      <label key={type.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.accepts.includes(type.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, accepts: [...formData.accepts, type.id] });
                            } else {
                              setFormData({ 
                                ...formData, 
                                accepts: formData.accepts.filter(t => t !== type.id),
                                preferredType: formData.preferredType === type.id ? "" : formData.preferredType
                              });
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded" style={{ backgroundColor: type.color }} />
                          {type.displayName}
                        </span>
                      </label>
                    ))}
                    
                    {moduleTypes.filter(t => !t.isSystemType).length > 0 && (
                      <>
                        <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1 mt-3">Custom Types</div>
                        {moduleTypes.filter(t => !t.isSystemType).map((type) => (
                          <label key={type.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.accepts.includes(type.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({ ...formData, accepts: [...formData.accepts, type.id] });
                                } else {
                                  setFormData({ 
                                    ...formData, 
                                    accepts: formData.accepts.filter(t => t !== type.id),
                                    preferredType: formData.preferredType === type.id ? "" : formData.preferredType
                                  });
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <span className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded" style={{ backgroundColor: type.color }} />
                              {type.displayName}
                              <span className="text-xs text-neutral-500">({type.category})</span>
                            </span>
                          </label>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Preferred Type</label>
              <select
                value={formData.preferredType}
                onChange={(e) => setFormData({ ...formData, preferredType: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-600 rounded bg-neutral-800"
              >
                <option value="">None</option>
                {formData.accepts.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <p className="text-xs text-neutral-500 mt-1">
                Modules of this type get no bandwidth penalty
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Bandwidth Multiplier</label>
              <input
                type="number"
                value={formData.bwMultiplier}
                onChange={(e) => setFormData({ ...formData, bwMultiplier: parseFloat(e.target.value) })}
                step="0.1"
                min="1"
                max="2"
                className="w-full px-3 py-2 border border-neutral-600 rounded bg-neutral-800"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Multiplier for non-preferred module types
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Suggested Archetypes</label>
              <div className="grid grid-cols-2 gap-2">
                {archetypes.map((arch) => (
                  <label key={arch} className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.archetypeHints.includes(arch)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, archetypeHints: [...formData.archetypeHints, arch] });
                        } else {
                          setFormData({ 
                            ...formData, 
                            archetypeHints: formData.archetypeHints.filter(a => a !== arch)
                          });
                        }
                      }}
                      className="w-3 h-3"
                    />
                    <span className="capitalize">{arch}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 mt-6">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={cancelEdit}
              className="px-4 py-2 bg-neutral-600 text-white rounded hover:bg-neutral-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Slot Types List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Existing Slot Types</h2>
        
        {/* System Slots */}
        <div>
          <h3 className="text-lg font-medium mb-2 text-neutral-400">System Slots</h3>
          <div className="grid gap-2">
            {slots.filter(s => s.isSystemSlot).map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                onEdit={startEditing}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        </div>
        
        {/* Custom Slots */}
        <div>
          <h3 className="text-lg font-medium mb-2 text-neutral-400">Custom Slots</h3>
          <div className="grid gap-2">
            {slots.filter(s => !s.isSystemSlot).length === 0 ? (
              <p className="text-neutral-500">No custom slots created yet</p>
            ) : (
              slots.filter(s => !s.isSystemSlot).map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  onEdit={startEditing}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SlotCard({ 
  slot, 
  onEdit, 
  onDelete, 
  onToggleActive 
}: { 
  slot: CustomSlotType;
  onEdit: (slot: CustomSlotType) => void;
  onDelete: (slot: CustomSlotType) => void;
  onToggleActive: (slot: CustomSlotType) => void;
}) {
  return (
    <div className={`p-4 border rounded-lg ${slot.isActive ? 'border-neutral-600 bg-neutral-900' : 'border-neutral-700 bg-neutral-950 opacity-60'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="w-8 h-8 rounded"
              style={{ backgroundColor: slot.color }}
            />
            <div>
              <h3 className="font-semibold text-lg">{slot.displayName}</h3>
              <p className="text-sm text-neutral-400">ID: {slot.id} | Name: {slot.name}</p>
            </div>
            {slot.isSystemSlot && (
              <span className="px-2 py-1 text-xs bg-purple-600/20 text-purple-400 rounded">
                System
              </span>
            )}
            {!slot.isActive && (
              <span className="px-2 py-1 text-xs bg-red-600/20 text-red-400 rounded">
                Inactive
              </span>
            )}
          </div>
          
          {slot.description && (
            <p className="text-sm text-neutral-400 mb-2">{slot.description}</p>
          )}
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-neutral-500">Accepts:</span>{" "}
              <span className="font-medium">{slot.accepts.join(", ")}</span>
            </div>
            <div>
              <span className="text-neutral-500">Preferred:</span>{" "}
              <span className="font-medium">{slot.preferredType || "None"}</span>
            </div>
            <div>
              <span className="text-neutral-500">BW Multiplier:</span>{" "}
              <span className="font-medium">{slot.bwMultiplier}x</span>
            </div>
          </div>
          
          {slot.archetypeHints.length > 0 && (
            <div className="mt-2">
              <span className="text-sm text-neutral-500">Suggested for:</span>{" "}
              {slot.archetypeHints.map(a => (
                <span key={a} className="inline-block px-2 py-0.5 text-xs bg-neutral-800 rounded mr-1 capitalize">
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => onToggleActive(slot)}
            className={`px-3 py-1 text-sm rounded ${
              slot.isActive 
                ? 'bg-neutral-600 hover:bg-neutral-700' 
                : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {slot.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => onEdit(slot)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Edit
          </button>
          {!slot.isSystemSlot && (
            <button
              onClick={() => onDelete(slot)}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
