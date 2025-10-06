"use client";

import { useState, useEffect } from "react";
import { getBlueprints, createBlueprint, updateBlueprint, deleteBlueprint, getMaterials } from "./actions";
import { AdminNav } from "@/components/admin/AdminNav";
import type { Blueprint, Material } from "@prisma/client";

export default function BlueprintsAdmin() {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBlueprint, setEditingBlueprint] = useState<Blueprint | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [bpData, matData] = await Promise.all([
        getBlueprints(),
        getMaterials()
      ]);
      setBlueprints(bpData);
      setMaterials(matData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(blueprint: Blueprint) {
    if (!confirm(`Delete blueprint "${blueprint.name}"?`)) return;
    
    try {
      await deleteBlueprint(blueprint.id);
      await loadData();
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("Failed to delete blueprint");
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <AdminNav />
      
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Blueprint Manager</h1>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium"
          >
            + Create Blueprint
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-neutral-400">Loading...</div>
        ) : (
          <div className="grid gap-4">
            {blueprints.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                No blueprints yet. Create one above.
              </div>
            ) : (
              blueprints.map(bp => (
                <div key={bp.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{bp.name}</h3>
                        <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded">
                          Tier {bp.tier}
                        </span>
                        <span className="text-xs text-neutral-500">{bp.type}</span>
                      </div>
                      {bp.description && (
                        <p className="text-sm text-neutral-400 mb-3">{bp.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="text-neutral-500 mb-1">Required Materials:</div>
                          {(bp.requiredMaterials as any[])?.map((m: any, i: number) => (
                            <div key={i} className="text-neutral-300">
                              • {m.quantity}× {m.materialType}
                              {m.affects && <span className="text-green-400 ml-2">→ {m.affects.join(', ')}</span>}
                            </div>
                          ))}
                        </div>
                        <div>
                          <div className="text-neutral-500 mb-1">Base Stats:</div>
                          {Object.entries(bp.baseStats as any).map(([stat, value]) => (
                            <div key={stat} className="text-neutral-300">
                              • {stat}: {String(value)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingBlueprint(bp)}
                        className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(bp)}
                        className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        {(isCreating || editingBlueprint) && (
          <BlueprintFormModal
            blueprint={editingBlueprint}
            materials={materials}
            onClose={() => {
              setIsCreating(false);
              setEditingBlueprint(null);
            }}
            onSave={async () => {
              await loadData();
              setIsCreating(false);
              setEditingBlueprint(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function BlueprintFormModal({ 
  blueprint, 
  materials,
  onClose, 
  onSave 
}: { 
  blueprint: Blueprint | null;
  materials: Material[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    name: blueprint?.name || '',
    description: blueprint?.description || '',
    type: blueprint?.type || 'module',
    tier: blueprint?.tier || 1,
    masteryRequired: blueprint?.masteryRequired || 0,
    requiredMaterials: blueprint?.requiredMaterials as any[] || [{ materialType: '', quantity: 0, affects: [] }],
    requiredComponents: blueprint?.requiredComponents as any[] || [],
    baseStats: blueprint?.baseStats as any || {}
  });
  
  const [baseStatFields, setBaseStatFields] = useState<{key: string; value: number}[]>(
    blueprint?.baseStats 
      ? Object.entries(blueprint.baseStats as any).map(([key, value]) => ({ key, value: value as number }))
      : [{ key: 'hp', value: 100 }]
  );

  const availableStats = [
    'shieldHP', 'armor', 'hullHP', 'damage', 'fireRate', 'range',
    'rechargeRate', 'powerDraw', 'capacitor', 'speed', 'mass',
    'tracking', 'scanResolution', 'cargoCapacity'
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      const baseStats = baseStatFields.reduce((acc, field) => {
        if (field.key) acc[field.key] = field.value;
        return acc;
      }, {} as any);
      
      const data = {
        ...formData,
        baseStats,
        tier: Number(formData.tier),
        masteryRequired: Number(formData.masteryRequired)
      };
      
      if (blueprint) {
        await updateBlueprint(blueprint.id, data);
      } else {
        await createBlueprint(data);
      }
      
      onSave();
    } catch (error) {
      console.error('Failed to save blueprint:', error);
      alert('Failed to save blueprint');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {blueprint ? 'Edit Blueprint' : 'Create Blueprint'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs text-neutral-400">Name</span>
              <input
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="mt-1 w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm"
                required
              />
            </label>
            
            <label className="block">
              <span className="text-xs text-neutral-400">Type</span>
              <select
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
                className="mt-1 w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm"
              >
                <option value="module">Module</option>
                <option value="hull">Hull</option>
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-neutral-400">Tier (1-3)</span>
              <input
                type="number"
                min={1}
                max={3}
                value={formData.tier}
                onChange={e => setFormData({...formData, tier: parseInt(e.target.value)})}
                className="mt-1 w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm"
              />
            </label>

            <label className="block">
              <span className="text-xs text-neutral-400">Mastery Required</span>
              <input
                type="number"
                min={0}
                value={formData.masteryRequired}
                onChange={e => setFormData({...formData, masteryRequired: parseInt(e.target.value)})}
                className="mt-1 w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs text-neutral-400">Description</span>
            <textarea
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="mt-1 w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm"
              rows={2}
            />
          </label>

          {/* Required Materials */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Required Materials</span>
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  requiredMaterials: [...formData.requiredMaterials, { materialType: '', quantity: 0, affects: [] }]
                })}
                className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs"
              >
                + Add Material
              </button>
            </div>
            <div className="space-y-2">
              {formData.requiredMaterials.map((mat: any, idx: number) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-start bg-neutral-800 p-3 rounded">
                  <div className="col-span-3">
                    <label className="text-xs text-neutral-500">Material</label>
                    <select
                      value={mat.materialType}
                      onChange={e => {
                        const newMats = [...formData.requiredMaterials];
                        newMats[idx].materialType = e.target.value;
                        setFormData({...formData, requiredMaterials: newMats});
                      }}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs"
                    >
                      <option value="">Select...</option>
                      <option value="Titanium">Titanium</option>
                      <option value="Iron">Iron</option>
                      <option value="Aluminum">Aluminum</option>
                      <option value="Plasma">Plasma</option>
                      <option value="Quantum">Quantum</option>
                      <option value="Dark matter">Dark matter</option>
                      <option value="Silicon">Silicon</option>
                      <option value="Copper">Copper</option>
                      <option value="Gold">Gold</option>
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="text-xs text-neutral-500">Quantity</label>
                    <input
                      type="number"
                      value={mat.quantity}
                      onChange={e => {
                        const newMats = [...formData.requiredMaterials];
                        newMats[idx].quantity = parseInt(e.target.value);
                        setFormData({...formData, requiredMaterials: newMats});
                      }}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs"
                    />
                  </div>
                  
                  <div className="col-span-6">
                    <label className="text-xs text-neutral-500">Affects Stats (multi-select)</label>
                    <select
                      multiple
                      value={mat.affects || []}
                      onChange={e => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        const newMats = [...formData.requiredMaterials];
                        newMats[idx].affects = selected;
                        setFormData({...formData, requiredMaterials: newMats});
                      }}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs h-20"
                    >
                      {availableStats.map(stat => (
                        <option key={stat} value={stat}>{stat}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          requiredMaterials: formData.requiredMaterials.filter((_: any, i: number) => i !== idx)
                        });
                      }}
                      className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Base Stats */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Base Stats</span>
              <button
                type="button"
                onClick={() => setBaseStatFields([...baseStatFields, { key: '', value: 0 }])}
                className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs"
              >
                + Add Stat
              </button>
            </div>
            <div className="space-y-2">
              {baseStatFields.map((field, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-neutral-800 p-2 rounded">
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="Stat name (e.g., shieldHP)"
                      value={field.key}
                      onChange={e => {
                        const newFields = [...baseStatFields];
                        newFields[idx].key = e.target.value;
                        setBaseStatFields(newFields);
                      }}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs"
                    />
                  </div>
                  <div className="col-span-6">
                    <input
                      type="number"
                      placeholder="Base value"
                      value={field.value}
                      onChange={e => {
                        const newFields = [...baseStatFields];
                        newFields[idx].value = parseInt(e.target.value) || 0;
                        setBaseStatFields(newFields);
                      }}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs"
                    />
                  </div>
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => setBaseStatFields(baseStatFields.filter((_, i) => i !== idx))}
                      className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-neutral-800">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium"
            >
              {blueprint ? 'Update Blueprint' : 'Create Blueprint'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

