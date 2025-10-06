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
          <div className="text-sm text-neutral-400">
            Configure material attributes and tier scaling
          </div>
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

                  {archetype && (
                    <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                      <div className="bg-neutral-800/50 p-2 rounded">
                        <div className="text-neutral-500">Strength</div>
                        <div className="font-bold">{archetype.strength}</div>
                      </div>
                      <div className="bg-neutral-800/50 p-2 rounded">
                        <div className="text-neutral-500">Conductivity</div>
                        <div className="font-bold">{archetype.conductivity}</div>
                      </div>
                      <div className="bg-neutral-800/50 p-2 rounded">
                        <div className="text-neutral-500">Density</div>
                        <div className="font-bold">{archetype.density}</div>
                      </div>
                      <div className="bg-neutral-800/50 p-2 rounded">
                        <div className="text-neutral-500">Reactivity</div>
                        <div className="font-bold">{archetype.reactivity}</div>
                      </div>
                      <div className="bg-neutral-800/50 p-2 rounded">
                        <div className="text-neutral-500">Stability</div>
                        <div className="font-bold">{archetype.stability}</div>
                      </div>
                      <div className="bg-neutral-800/50 p-2 rounded">
                        <div className="text-neutral-500">Elasticity</div>
                        <div className="font-bold">{archetype.elasticity}</div>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 text-xs text-neutral-500">
                    <div className="font-semibold mb-1">Tier Scaling:</div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(tier => {
                        const stats = archetype ? getMaterialStats(mat.name, tier) : null;
                        return (
                          <div key={tier} className="px-2 py-1 bg-neutral-800 rounded">
                            T{tier}: {stats ? `${Math.round(stats.strength)}` : '?'}
                          </div>
                        );
                      })}
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
  const stats = getMaterialStats(material.name, selectedTier);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6 max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-4">{material.name} - Attributes</h2>
        
        <div className="mb-4">
          <label className="text-sm text-neutral-400">View Tier:</label>
          <div className="flex gap-2 mt-2">
            {[1, 2, 3, 4, 5].map(tier => (
              <button
                key={tier}
                onClick={() => onTierChange(tier)}
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

        <div className="bg-neutral-800/50 rounded p-4 mb-4">
          <div className="text-sm font-semibold mb-3">
            Tier {selectedTier} Stats (multiplier: {selectedTier === 1 ? '1.0' : selectedTier === 2 ? '1.5' : selectedTier === 3 ? '2.0' : selectedTier === 4 ? '2.5' : '3.0'}×)
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-400">Strength:</span>
              <span className="font-mono font-bold">{Math.round(stats.strength)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Conductivity:</span>
              <span className="font-mono font-bold">{Math.round(stats.conductivity)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Density:</span>
              <span className="font-mono font-bold">{Math.round(stats.density)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Reactivity:</span>
              <span className="font-mono font-bold">{Math.round(stats.reactivity)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Stability:</span>
              <span className="font-mono font-bold">{Math.round(stats.stability)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Elasticity:</span>
              <span className="font-mono font-bold">{Math.round(stats.elasticity)}</span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded text-xs text-neutral-300">
          <p className="mb-2">
            💡 Attributes are defined in <code className="text-blue-400">lib/industrial/materialStats.ts</code>
          </p>
          <p>
            To modify, edit the MATERIAL_ARCHETYPES constant and tier multipliers in that file.
          </p>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

