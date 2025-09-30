"use client";

import { useState, useEffect } from "react";
import { getModuleTypes, createModuleType, updateModuleType, deleteModuleType, seedSystemModuleTypes } from "./actions";
import type { ModuleType } from "@prisma/client";
import { AdminNav } from "@/components/admin/AdminNav";

export default function ModuleTypesAdmin() {
  const [moduleTypes, setModuleTypes] = useState<ModuleType[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    displayName: "",
    description: "",
    color: "#808080",
    baseBandwidth: 10,
    category: "custom"
  });

  const categories = ["weapon", "defense", "utility", "engine", "sensor", "custom"];

  useEffect(() => {
    loadModuleTypes();
  }, []);

  async function loadModuleTypes() {
    setLoading(true);
    try {
      const data = await getModuleTypes();
      setModuleTypes(data);
    } catch (error) {
      console.error("Failed to load module types:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSeedSystemTypes() {
    if (!confirm("This will seed/reset the base module types (Power, Ammo, Utility). Continue?")) return;
    
    try {
      await seedSystemModuleTypes();
      await loadModuleTypes();
      alert("System module types seeded successfully!");
    } catch (error) {
      console.error("Failed to seed system types:", error);
      alert("Failed to seed system types");
    }
  }

  function startCreating() {
    setIsCreating(true);
    setFormData({
      id: "",
      name: "",
      displayName: "",
      description: "",
      color: "#808080",
      baseBandwidth: 10,
      category: "custom"
    });
  }

  function cancelCreate() {
    setIsCreating(false);
    setFormData({
      id: "",
      name: "",
      displayName: "",
      description: "",
      color: "#808080",
      baseBandwidth: 10,
      category: "custom"
    });
  }

  async function handleCreate() {
    if (!formData.id || !formData.name || !formData.displayName) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      await createModuleType({
        ...formData,
        description: formData.description || undefined
      });
      await loadModuleTypes();
      cancelCreate();
    } catch (error) {
      console.error("Failed to create module type:", error);
      alert("Failed to create module type");
    }
  }

  async function handleDelete(type: ModuleType) {
    if (type.isSystemType) {
      alert("Cannot delete system module types");
      return;
    }
    
    if (!confirm(`Delete module type "${type.displayName}"? This may affect existing modules and slots.`)) return;
    
    try {
      await deleteModuleType(type.id);
      await loadModuleTypes();
    } catch (error) {
      console.error("Failed to delete module type:", error);
      alert("Failed to delete module type");
    }
  }

  async function handleToggleActive(type: ModuleType) {
    try {
      await updateModuleType(type.id, { isActive: !type.isActive });
      await loadModuleTypes();
    } catch (error) {
      console.error("Failed to toggle active state:", error);
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <AdminNav />
      </div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Module Types</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Define custom module types that can be used in your modules and accepted by custom slots
          </p>
        </div>
        <div className="flex gap-2">
          {moduleTypes.length === 0 && (
            <button
              onClick={handleSeedSystemTypes}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Seed System Types
            </button>
          )}
          <button
            onClick={startCreating}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Module Type
          </button>
        </div>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="mb-8 p-6 border border-neutral-700 rounded-lg bg-neutral-900">
          <h2 className="text-xl font-semibold mb-4">Create New Module Type</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">ID (unique)</label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-600 rounded bg-neutral-800"
                placeholder="e.g., Weapon, Shield, Engine"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Internal Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-600 rounded bg-neutral-800"
                placeholder="e.g., weapon_module"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Display Name</label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-600 rounded bg-neutral-800"
                placeholder="e.g., Weapon Module"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
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
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-600 rounded bg-neutral-800"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Base Bandwidth</label>
              <input
                type="number"
                value={formData.baseBandwidth}
                onChange={(e) => setFormData({ ...formData, baseBandwidth: parseInt(e.target.value) })}
                min="1"
                max="50"
                className="w-full px-3 py-2 border border-neutral-600 rounded bg-neutral-800"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-600 rounded bg-neutral-800"
                rows={2}
                placeholder="Optional description"
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create
            </button>
            <button
              onClick={cancelCreate}
              className="px-4 py-2 bg-neutral-600 text-white rounded hover:bg-neutral-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Module Types List */}
      <div className="space-y-4">
        {/* System Types */}
        <div>
          <h3 className="text-lg font-medium mb-2 text-neutral-400">System Module Types</h3>
          <div className="grid gap-2">
            {moduleTypes.filter(t => t.isSystemType).map((type) => (
              <TypeCard
                key={type.id}
                type={type}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        </div>
        
        {/* Custom Types */}
        <div>
          <h3 className="text-lg font-medium mb-2 text-neutral-400">Custom Module Types</h3>
          <div className="grid gap-2">
            {moduleTypes.filter(t => !t.isSystemType).length === 0 ? (
              <p className="text-neutral-500">No custom module types created yet</p>
            ) : (
              moduleTypes.filter(t => !t.isSystemType).map((type) => (
                <TypeCard
                  key={type.id}
                  type={type}
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

function TypeCard({ 
  type, 
  onDelete, 
  onToggleActive 
}: { 
  type: ModuleType;
  onDelete: (type: ModuleType) => void;
  onToggleActive: (type: ModuleType) => void;
}) {
  return (
    <div className={`p-4 border rounded-lg ${type.isActive ? 'border-neutral-600 bg-neutral-900' : 'border-neutral-700 bg-neutral-950 opacity-60'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="w-8 h-8 rounded"
              style={{ backgroundColor: type.color }}
            />
            <div>
              <h3 className="font-semibold text-lg">{type.displayName}</h3>
              <p className="text-sm text-neutral-400">
                ID: {type.id} | Category: {type.category} | Bandwidth: {type.baseBandwidth}
              </p>
            </div>
            {type.isSystemType && (
              <span className="px-2 py-1 text-xs bg-purple-600/20 text-purple-400 rounded">
                System
              </span>
            )}
            {!type.isActive && (
              <span className="px-2 py-1 text-xs bg-red-600/20 text-red-400 rounded">
                Inactive
              </span>
            )}
          </div>
          
          {type.description && (
            <p className="text-sm text-neutral-400">{type.description}</p>
          )}
        </div>
        
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => onToggleActive(type)}
            className={`px-3 py-1 text-sm rounded ${
              type.isActive 
                ? 'bg-neutral-600 hover:bg-neutral-700' 
                : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {type.isActive ? 'Deactivate' : 'Activate'}
          </button>
          {!type.isSystemType && (
            <button
              onClick={() => onDelete(type)}
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
