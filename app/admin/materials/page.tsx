"use client";

import { useState, useEffect } from "react";
import { getMaterials, updateMaterial, createMaterial, deleteMaterial } from "./actions";
import { AdminNav } from "@/components/admin/AdminNav";
import { getMaterialStats, MATERIAL_ARCHETYPES } from "@/lib/industrial/materialStats";
import type { Material } from "@prisma/client";

export default function MaterialsAdmin() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [selectedTier, setSelectedTier] = useState<number>(1);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await getMaterials();
      setMaterials(data);
    } catch (error) {
      console.error("Failed to load materials:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(material: Material) {
    if (!confirm(`Delete material "${material.name}"? This will fail if players have it.`)) return;
    
    try {
      await deleteMaterial(material.id);
      await loadData();
    } catch (error) {
      console.error("Failed to delete:", error);
      alert((error as Error).message || "Failed to delete material");
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <AdminNav />
      
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Material Manager</h1>
          <button
            onClick={() => {
              setEditingMaterial({
                id: 'new',
                name: '',
                category: 'metal',
                baseValue: 100,
                baseAttributes: {},
                tierStats: null,
                createdAt: new Date(),
                updatedAt: new Date()
              } as any);
            }}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-medium"
          >
            + Create Material
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-neutral-400">Loading...</div>
        ) : (
          <div className="grid gap-4">
            {materials.map(mat => {
              const attrs = mat.baseAttributes as any;
              const archetype = MATERIAL_ARCHETYPES[mat.name as keyof typeof MATERIAL_ARCHETYPES];
              
              return (
                <div key={mat.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold">{mat.name}</h3>
                      <p className="text-xs text-neutral-500">{mat.category}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingMaterial(mat);
                          setSelectedTier(1);
                        }}
                        className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-sm"
                      >
                        View/Edit Attributes
                      </button>
                      <button
                        onClick={() => handleDelete(mat)}
                        className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Show attributes from DB or archetype */}
                  {(attrs || archetype) && (
                    <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                      <div className="bg-neutral-800/50 p-2 rounded">
                        <div className="text-neutral-500">Strength</div>
                        <div className="font-bold">{attrs?.strength || archetype?.strength || 100}</div>
                      </div>
                      <div className="bg-neutral-800/50 p-2 rounded">
                        <div className="text-neutral-500">Conductivity</div>
                        <div className="font-bold">{attrs?.conductivity || archetype?.conductivity || 100}</div>
                      </div>
                      <div className="bg-neutral-800/50 p-2 rounded">
                        <div className="text-neutral-500">Density</div>
                        <div className="font-bold">{attrs?.density || archetype?.density || 100}</div>
                      </div>
                      <div className="bg-neutral-800/50 p-2 rounded">
                        <div className="text-neutral-500">Reactivity</div>
                        <div className="font-bold">{attrs?.reactivity || archetype?.reactivity || 100}</div>
                      </div>
                      <div className="bg-neutral-800/50 p-2 rounded">
                        <div className="text-neutral-500">Stability</div>
                        <div className="font-bold">{attrs?.stability || archetype?.stability || 100}</div>
                      </div>
                      <div className="bg-neutral-800/50 p-2 rounded">
                        <div className="text-neutral-500">Elasticity</div>
                        <div className="font-bold">{attrs?.elasticity || archetype?.elasticity || 100}</div>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 text-xs text-neutral-500">
                    <div className="font-semibold mb-1">Tier Scaling (Strength):</div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(tier => {
                        const tierMult = tier === 1 ? 1.0 : tier === 2 ? 1.5 : tier === 3 ? 2.0 : tier === 4 ? 2.5 : 3.0;
                        let baseStrength = 100;
                        if (archetype) {
                          baseStrength = archetype.strength;
                        } else if (attrs?.strength) {
                          baseStrength = attrs.strength;
                        }
                        const scaledValue = Math.round(baseStrength * tierMult);
                        return (
                          <div key={tier} className="px-2 py-1 bg-neutral-800 rounded">
                            T{tier}: {scaledValue}
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-xs text-green-400 mt-1">
                      ✓ Using {archetype ? 'code-defined' : 'database'} attributes
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Material Attributes Modal */}
        {editingMaterial && (
          <MaterialAttributeModal
            material={editingMaterial}
            selectedTier={selectedTier}
            onTierChange={setSelectedTier}
            onClose={() => setEditingMaterial(null)}
            onSave={() => {
              loadData();
              setEditingMaterial(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function MaterialAttributeModal({
  material,
  selectedTier,
  onTierChange,
  onClose,
  onSave
}: {
  material: Material;
  selectedTier: number;
  onTierChange: (tier: number) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const isNew = material.id === 'new';
  const archetype = isNew ? null : MATERIAL_ARCHETYPES[material.name as keyof typeof MATERIAL_ARCHETYPES];
  
  // Use DB baseAttributes if available, otherwise archetype, otherwise defaults
  const dbAttrs = material.baseAttributes as any;
  const initialAttributes = dbAttrs && Object.keys(dbAttrs).length > 0 ? {
    strength: dbAttrs.strength || 100,
    conductivity: dbAttrs.conductivity || 100,
    density: dbAttrs.density || 100,
    reactivity: dbAttrs.reactivity || 100,
    stability: dbAttrs.stability || 100,
    elasticity: dbAttrs.elasticity || 100
  } : archetype ? {
    strength: archetype.strength,
    conductivity: archetype.conductivity,
    density: archetype.density,
    reactivity: archetype.reactivity,
    stability: archetype.stability,
    elasticity: archetype.elasticity
  } : {
    strength: 100,
    conductivity: 100,
    density: 100,
    reactivity: 100,
    stability: 100,
    elasticity: 100
  };
  
  const [formData, setFormData] = useState({
    name: material.name || '',
    category: material.category || 'metal',
    baseValue: material.baseValue || 100,
    attributes: initialAttributes
  });

  const [customAttributes, setCustomAttributes] = useState<{name: string; value: number}[]>([]);
  
  const stats = archetype ? getMaterialStats(material.name, selectedTier) : {
    strength: formData.attributes.strength * (selectedTier === 1 ? 1.0 : selectedTier === 2 ? 1.5 : selectedTier === 3 ? 2.0 : selectedTier === 4 ? 2.5 : 3.0),
    conductivity: formData.attributes.conductivity * (selectedTier === 1 ? 1.0 : selectedTier === 2 ? 1.5 : selectedTier === 3 ? 2.0 : selectedTier === 4 ? 2.5 : 3.0),
    density: formData.attributes.density * (selectedTier === 1 ? 1.0 : selectedTier === 2 ? 1.5 : selectedTier === 3 ? 2.0 : selectedTier === 4 ? 2.5 : 3.0),
    reactivity: formData.attributes.reactivity * (selectedTier === 1 ? 1.0 : selectedTier === 2 ? 1.5 : selectedTier === 3 ? 2.0 : selectedTier === 4 ? 2.5 : 3.0),
    stability: formData.attributes.stability * (selectedTier === 1 ? 1.0 : selectedTier === 2 ? 1.5 : selectedTier === 3 ? 2.0 : selectedTier === 4 ? 2.5 : 3.0),
    elasticity: formData.attributes.elasticity * (selectedTier === 1 ? 1.0 : selectedTier === 2 ? 1.5 : selectedTier === 3 ? 2.0 : selectedTier === 4 ? 2.5 : 3.0)
  };

  async function handleSave() {
    try {
      const allAttributes = { ...formData.attributes };
      customAttributes.forEach(attr => {
        if (attr.name) allAttributes[attr.name] = attr.value;
      });

      const data = {
        name: formData.name,
        category: formData.category,
        baseValue: formData.baseValue,
        baseAttributes: allAttributes
      };

      if (isNew) {
        await createMaterial(data);
      } else {
        await updateMaterial(material.id, data);
      }
      onSave();
    } catch (error) {
      console.error('Failed to save material:', error);
      alert('Failed to save material');
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {isNew ? 'Create Material' : `${material.name} - Attributes`}
        </h2>
        
        {/* Basic Info */}
        {isNew && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <label className="block">
              <span className="text-xs text-neutral-400">Name</span>
              <input
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="mt-1 w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm"
                placeholder="e.g., Chromium"
              />
            </label>
            <label className="block">
              <span className="text-xs text-neutral-400">Category</span>
              <select
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="mt-1 w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm"
              >
                <option value="metal">Metal</option>
                <option value="gas">Gas</option>
                <option value="crystal">Crystal</option>
                <option value="composite">Composite</option>
                <option value="exotic">Exotic</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-neutral-400">Base Value (ISK)</span>
              <input
                type="number"
                value={formData.baseValue}
                onChange={e => setFormData({...formData, baseValue: parseInt(e.target.value)})}
                className="mt-1 w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm"
              />
            </label>
          </div>
        )}

        {/* Tier Preview */}
        <div className="mb-4">
          <label className="text-sm text-neutral-400">View Tier Scaling:</label>
          <div className="flex gap-2 mt-2">
            {[1, 2, 3, 4, 5].map(tier => (
              <button
                key={tier}
                onClick={() => onTierChange(tier)}
                type="button"
                className={`px-3 py-1 rounded text-sm ${
                  selectedTier === tier
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                T{tier}
              </button>
            ))}
          </div>
        </div>

        {/* Base Attributes (T1 values) */}
        <div className="bg-neutral-800/50 rounded p-4 mb-4">
          <div className="text-sm font-semibold mb-3">
            Base Attributes (T1 = 1.0× multiplier)
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(formData.attributes).map(([key, value]) => (
              <label key={key} className="block">
                <span className="text-xs text-neutral-400 capitalize">{key}</span>
                  <input
                      type="number"
                      value={value || 0}
                      onChange={e => setFormData({
                        ...formData,
                        attributes: { ...formData.attributes, [key]: parseInt(e.target.value) || 0 }
                      })}
                      className="mt-1 w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm"
                    />
              </label>
            ))}
          </div>
        </div>

        {/* Custom Attributes */}
        <div className="bg-neutral-800/50 rounded p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Custom Attributes</span>
            <button
              type="button"
              onClick={() => setCustomAttributes([...customAttributes, { name: '', value: 100 }])}
              className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs"
            >
              + Add Custom
            </button>
          </div>
          {customAttributes.length === 0 ? (
            <div className="text-xs text-neutral-500">No custom attributes. Add one above.</div>
          ) : (
            <div className="space-y-2">
              {customAttributes.map((attr, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2">
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="Attribute name"
                      value={attr.name}
                      onChange={e => {
                        const newAttrs = [...customAttributes];
                        newAttrs[idx].name = e.target.value;
                        setCustomAttributes(newAttrs);
                      }}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs"
                    />
                  </div>
                  <div className="col-span-6">
                    <input
                      type="number"
                      placeholder="Value"
                      value={attr.value}
                      onChange={e => {
                        const newAttrs = [...customAttributes];
                        newAttrs[idx].value = parseInt(e.target.value) || 0;
                        setCustomAttributes(newAttrs);
                      }}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs"
                    />
                  </div>
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => setCustomAttributes(customAttributes.filter((_, i) => i !== idx))}
                      className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview at Selected Tier */}
        <div className="bg-neutral-800/50 rounded p-4 mb-4">
          <div className="text-sm font-semibold mb-3">
            Tier {selectedTier} Preview (×{selectedTier === 1 ? '1.0' : selectedTier === 2 ? '1.5' : selectedTier === 3 ? '2.0' : selectedTier === 4 ? '2.5' : '3.0'})
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-neutral-400 capitalize">{key}:</span>
                <span className="font-mono font-bold text-green-400">{Math.round(value as number)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded text-xs text-neutral-300">
          <p className="font-semibold mb-1">ℹ️ Material System</p>
          <p>
            Materials are DB-first. For performance optimization, add frequently-used materials to 
            <code className="text-blue-400"> lib/industrial/materialStats.ts</code> MATERIAL_ARCHETYPES.
          </p>
          <p className="mt-1">DB-only materials work but may be slightly slower (requires DB query per craft).</p>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium"
          >
            {isNew ? 'Create Material' : 'Save Changes'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

