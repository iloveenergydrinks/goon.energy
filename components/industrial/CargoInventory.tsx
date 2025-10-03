"use client";

import React, { useState, useMemo } from 'react';
import { formatIndustrialNumber, getMaterialGrade, getTierColor } from '@/lib/industrial/calculations';
import { getQualityGrade, getQualityBadgeStyles } from '@/lib/industrial/quality';
import { getMaterialDisplayName } from '@/lib/industrial/materialStats';
import type { Material } from '@/types/industrial';

interface CargoInventoryProps {
  materials: Material[];
  onMaterialSelect?: (material: Material) => void;
  selectedMaterials?: Material[];
  multiSelect?: boolean;
  showActions?: boolean;
  onRefine?: (materials: Material[]) => void;
  onSell?: (materials: Material[]) => void;
  onTransfer?: (materials: Material[]) => void;
  onShowDetails?: (material: Material) => void;
  onDelete?: (materialId: string) => void;
}

type ViewMode = 'grid' | 'list' | 'compact';
type SortBy = 'name' | 'tier' | 'purity' | 'quantity' | 'value';
type GroupBy = 'none' | 'category' | 'tier' | 'grade' | 'purity-band';
type PurityFilter = 'all' | 'premium' | 'high' | 'medium' | 'low';

// Define purity bands
const PURITY_BANDS = {
  premium: { min: 0.85, max: 1.0, name: 'Premium (85-100%)', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  high: { min: 0.60, max: 0.85, name: 'High (60-85%)', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  medium: { min: 0.30, max: 0.60, name: 'Medium (30-60%)', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  low: { min: 0, max: 0.30, name: 'Low (0-30%)', color: 'text-neutral-400', bg: 'bg-neutral-500/20' }
};

function getPurityBand(purity: number): keyof typeof PURITY_BANDS {
  if (purity >= PURITY_BANDS.premium.min) return 'premium';
  if (purity >= PURITY_BANDS.high.min) return 'high';
  if (purity >= PURITY_BANDS.medium.min) return 'medium';
  return 'low';
}

export function CargoInventory({
  materials,
  onMaterialSelect,
  selectedMaterials = [],
  multiSelect = false,
  showActions = true,
  onRefine,
  onSell,
  onTransfer,
  onShowDetails,
  onDelete
}: CargoInventoryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('tier');
  const [sortAsc, setSortAsc] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupBy>('category');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<number | 'all'>('all');
  const [filterPurity, setFilterPurity] = useState<PurityFilter>('all');

  // Calculate total cargo value and weight
  const cargoStats = useMemo(() => {
    const totalValue = materials.reduce((sum, m) => sum + (m.baseValue * m.quantity * m.tier * m.purity), 0);
    const totalVolume = materials.reduce((sum, m) => sum + (m.quantity * (m.attributes?.density || 1)), 0);
    const totalItems = materials.reduce((sum, m) => sum + m.quantity, 0);
    const uniqueTypes = new Set(materials.map(m => m.name)).size;
    
    return { totalValue, totalVolume, totalItems, uniqueTypes };
  }, [materials]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set(materials.map(m => m.category));
    return Array.from(cats).sort();
  }, [materials]);

  // Filter and sort materials
  const processedMaterials = useMemo(() => {
    let filtered = materials.filter(m => {
      if (searchTerm && !m.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filterCategory !== 'all' && m.category !== filterCategory) return false;
      if (filterTier !== 'all' && m.tier !== filterTier) return false;
      
      // Purity band filter
      if (filterPurity !== 'all') {
        const band = getPurityBand(m.purity);
        if (band !== filterPurity) return false;
      }
      
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'tier':
          comparison = a.tier - b.tier;
          break;
        case 'purity':
          comparison = a.purity - b.purity;
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        case 'value':
          comparison = (a.baseValue * a.quantity * a.tier * a.purity) - 
                      (b.baseValue * b.quantity * b.tier * b.purity);
          break;
      }
      return sortAsc ? comparison : -comparison;
    });

    return filtered;
  }, [materials, searchTerm, filterCategory, filterTier, filterPurity, sortBy, sortAsc]);

  // Group materials - also consolidate by material type
  const groupedMaterials = useMemo(() => {
    // First, consolidate materials by name and tier
    const consolidated: Record<string, Material & { stacks: Material[] }> = {};
    
    processedMaterials.forEach(material => {
      const key = `${material.name}_T${material.tier}`;
      if (!consolidated[key]) {
        consolidated[key] = {
          ...material,
          quantity: 0,
          stacks: []
        };
      }
      consolidated[key].quantity += material.quantity;
      consolidated[key].stacks.push(material);
    });
    
    // Convert back to array
    const consolidatedMaterials = Object.values(consolidated);
    
    if (groupBy === 'none') {
      return { 'All Materials': consolidatedMaterials };
    }

    const groups: Record<string, typeof consolidatedMaterials> = {};
    
    consolidatedMaterials.forEach(material => {
      let groupKey = '';
      switch (groupBy) {
        case 'category':
          groupKey = material.category;
          break;
        case 'tier':
          groupKey = `Tier ${material.tier}`;
          break;
        case 'grade':
          groupKey = `Grade ${getMaterialGrade(material.purity)}`;
          break;
        case 'purity-band':
          const band = getPurityBand(material.purity);
          groupKey = PURITY_BANDS[band].name;
          break;
      }
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(material);
    });

    return groups;
  }, [processedMaterials, groupBy]);

  const isSelected = (material: Material) => {
    return selectedMaterials.some(m => m.id === material.id);
  };

  const handleSelect = (material: Material) => {
    if (onMaterialSelect) {
      onMaterialSelect(material);
    }
  };

  const renderMaterialCard = (material: Material & { stacks?: Material[] }) => {
    const selected = isSelected(material);
    const tierColor = getTierColor(material.tier);
    const qualityInfo = getQualityGrade(material.purity);
    const value = material.baseValue * material.quantity * material.tier * material.purity;
    const purityBand = getPurityBand(material.purity);
    const bandInfo = PURITY_BANDS[purityBand];

    if (viewMode === 'compact') {
      return (
        <div
          key={material.id}
          onClick={() => handleSelect(material)}
          className={`
            flex items-center justify-between p-2 rounded border cursor-pointer transition-all
            ${selected 
              ? 'border-blue-500 bg-blue-500/10' 
              : 'border-neutral-800 hover:border-neutral-600 bg-neutral-900/50'
            }
          `}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-2 h-8 rounded"
              style={{ backgroundColor: tierColor }}
            />
            <div>
              <span className="text-sm font-medium text-white">{material.name}</span>
              <span className="text-xs text-neutral-500 ml-2">{material.category}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-neutral-400">
              {formatIndustrialNumber(material.quantity)}
            </span>
            <span className="text-xs font-bold" style={{ color: tierColor }}>
              T{material.tier}
            </span>
            <span className={`text-xs font-bold ${
              grade === 'S' ? 'text-yellow-400' :
              grade === 'A' ? 'text-purple-400' :
              'text-neutral-400'
            }`}>
              {grade}
            </span>
          </div>
        </div>
      );
    }

    if (viewMode === 'list') {
      return (
        <tr
          key={material.id}
          onClick={() => handleSelect(material)}
          className={`
            cursor-pointer transition-all
            ${selected 
              ? 'bg-blue-500/10' 
              : 'hover:bg-neutral-900/50'
            }
          `}
        >
          <td className="p-3">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: tierColor }}
              />
              <span className="text-sm font-medium text-white">{material.name}</span>
            </div>
          </td>
          <td className="p-3 text-xs text-neutral-400">{material.category}</td>
          <td className="p-3">
            <span className="text-xs font-bold" style={{ color: tierColor }}>
              T{material.tier}
            </span>
          </td>
          <td className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full"
                  style={{
                    width: `${material.purity * 100}%`,
                    backgroundColor: tierColor
                  }}
                />
              </div>
              <span className={`text-xs font-bold ${
                grade === 'S' ? 'text-yellow-400' :
                grade === 'A' ? 'text-purple-400' :
                'text-neutral-400'
              }`}>
                {grade}
              </span>
            </div>
          </td>
          <td className="p-3 text-xs text-neutral-300">
            {formatIndustrialNumber(material.quantity)}
          </td>
          <td className="p-3 text-xs text-green-400">
            {formatIndustrialNumber(value)} ISK
          </td>
        </tr>
      );
    }

    // Grid view (default)
    return (
      <div
        key={material.id}
        onClick={() => handleSelect(material)}
        className={`
          relative p-4 rounded-lg border cursor-pointer transition-all
          ${selected 
            ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20' 
            : 'border-neutral-800 hover:border-neutral-600 bg-neutral-900/50'
          }
        `}
      >
        {/* Selection indicator, raw/refined badge, and purity band badge */}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          {/* Raw vs Refined badge - LARGER */}
          {material.stacks && material.stacks[0] && (
            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg ${
              (material.stacks[0] as any).isRefined === false
                ? 'bg-orange-600 text-white border-2 border-orange-400'
                : 'bg-blue-600 text-white border-2 border-blue-400'
            }`}>
              {(material.stacks[0] as any).isRefined === false ? '🪨 ORE' : '✨ MINERAL'}
            </span>
          )}
          {purityBand === 'premium' && (
            <span className={`px-2 py-1 rounded text-xs font-bold ${bandInfo.bg} ${bandInfo.color}`}>
              PREMIUM
            </span>
          )}
          {multiSelect && (
            <div className={`
              w-5 h-5 rounded border-2 flex items-center justify-center
              ${selected ? 'border-blue-500 bg-blue-500' : 'border-neutral-600'}
            `}>
              {selected && <span className="text-xs text-white">✓</span>}
            </div>
          )}
        </div>

        {/* Tier indicator */}
        <div
          className="absolute top-0 left-0 w-full h-1 rounded-t-lg"
          style={{ backgroundColor: tierColor }}
        />

        {/* Material info */}
        <div className="space-y-3 mt-2">
          <div>
            <div className="text-sm font-semibold text-white">
              {getMaterialDisplayName(
                material.name, 
                material.stacks && material.stacks[0] ? (material.stacks[0] as any).isRefined !== false : true
              )}
            </div>
            <div className="text-xs text-neutral-500">
              {material.category}
              {material.stacks && material.stacks.length > 1 && (
                <span className="ml-2 text-yellow-400">
                  ({material.stacks.length} stacks)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-1 rounded text-xs font-bold"
                style={{ backgroundColor: `${tierColor}20`, color: tierColor }}
              >
                T{material.tier}
              </span>
              <span 
                className={`px-2 py-1 rounded text-xs font-bold ${getQualityBadgeStyles(qualityInfo)}`}
                style={{ 
                  color: qualityInfo.grade === 'QT' ? 'white' : qualityInfo.color,
                  borderColor: qualityInfo.color 
                }}
              >
                {qualityInfo.shortName}
              </span>
              {material.stacks && material.stacks.length > 1 && onShowDetails && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowDetails(material);
                  }}
                  className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                >
                  📊 Details
                </button>
              )}
            </div>
            <span className="text-xs text-neutral-400">
              {formatIndustrialNumber(material.quantity)}
            </span>
          </div>

          {/* Purity bar */}
          <div>
            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full transition-all"
                style={{
                  width: `${material.purity * 100}%`,
                  backgroundColor: tierColor
                }}
              />
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              {qualityInfo.name} • {(material.purity * 100).toFixed(1)}%
            </div>
          </div>

          {/* Attributes preview */}
          {material.attributes && (
            <div className="grid grid-cols-3 gap-1">
              {Object.entries(material.attributes).slice(0, 3).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="text-xs text-neutral-600 capitalize">{key.slice(0, 3)}</div>
                  <div className="text-xs font-medium text-neutral-400">
                    {typeof value === 'number' ? value.toFixed(2) : value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Value */}
          <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
            <div className="text-xs text-green-400 font-medium">
              {formatIndustrialNumber(value)} ISK
            </div>
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Destroy ${material.quantity} ${material.name}?`)) {
                    onDelete(material.id);
                  }
                }}
                className="text-xs px-2 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded border border-red-500/50 transition-colors"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-neutral-900/50 rounded-lg p-3 border border-neutral-800">
          <div className="text-xs text-neutral-500">Total Value</div>
          <div className="text-lg font-bold text-green-400">
            {formatIndustrialNumber(cargoStats.totalValue)} ISK
          </div>
        </div>
        <div className="bg-neutral-900/50 rounded-lg p-3 border border-neutral-800">
          <div className="text-xs text-neutral-500">Total Items</div>
          <div className="text-lg font-bold text-white">
            {formatIndustrialNumber(cargoStats.totalItems)}
          </div>
        </div>
        <div className="bg-neutral-900/50 rounded-lg p-3 border border-neutral-800">
          <div className="text-xs text-neutral-500">Unique Types</div>
          <div className="text-lg font-bold text-white">
            {cargoStats.uniqueTypes}
          </div>
        </div>
        <div className="bg-neutral-900/50 rounded-lg p-3 border border-neutral-800">
          <div className="text-xs text-neutral-500">Cargo Volume</div>
          <div className="text-lg font-bold text-white">
            {formatIndustrialNumber(cargoStats.totalVolume)} m³
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-neutral-900/50 rounded-lg border border-neutral-800">
        {/* Search */}
        <input
          type="text"
          placeholder="Search materials..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 bg-neutral-800 rounded text-sm text-white placeholder-neutral-500 border border-neutral-700 focus:border-blue-500 focus:outline-none"
        />

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 bg-neutral-800 rounded text-sm text-white border border-neutral-700 focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Tier Filter */}
        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
          className="px-3 py-2 bg-neutral-800 rounded text-sm text-white border border-neutral-700 focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All Tiers</option>
          {[1, 2, 3, 4, 5].map(tier => (
            <option key={tier} value={tier}>Tier {tier}</option>
          ))}
        </select>

        {/* Purity Filter */}
        <select
          value={filterPurity}
          onChange={(e) => setFilterPurity(e.target.value as PurityFilter)}
          className="px-3 py-2 bg-neutral-800 rounded text-sm text-white border border-neutral-700 focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All Purities</option>
          <option value="premium">Premium (85%+)</option>
          <option value="high">High (60-85%)</option>
          <option value="medium">Medium (30-60%)</option>
          <option value="low">Low (0-30%)</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="px-3 py-2 bg-neutral-800 rounded text-sm text-white border border-neutral-700 focus:border-blue-500 focus:outline-none"
        >
          <option value="name">Sort by Name</option>
          <option value="tier">Sort by Tier</option>
          <option value="purity">Sort by Purity</option>
          <option value="quantity">Sort by Quantity</option>
          <option value="value">Sort by Value</option>
        </select>

        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="px-3 py-2 bg-neutral-800 rounded text-sm text-white border border-neutral-700 hover:border-neutral-600"
        >
          {sortAsc ? '↑' : '↓'}
        </button>

        {/* Group By */}
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          className="px-3 py-2 bg-neutral-800 rounded text-sm text-white border border-neutral-700 focus:border-blue-500 focus:outline-none"
        >
          <option value="none">No Grouping</option>
          <option value="category">Group by Category</option>
          <option value="tier">Group by Tier</option>
          <option value="grade">Group by Grade</option>
          <option value="purity-band">Group by Purity Band</option>
        </select>

        {/* View Mode */}
        <div className="flex gap-1 ml-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 rounded text-sm ${
              viewMode === 'grid' 
                ? 'bg-blue-500 text-white' 
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 rounded text-sm ${
              viewMode === 'list' 
                ? 'bg-blue-500 text-white' 
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={`px-3 py-2 rounded text-sm ${
              viewMode === 'compact' 
                ? 'bg-blue-500 text-white' 
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            Compact
          </button>
        </div>
      </div>

      {/* Actions Bar */}
      {showActions && selectedMaterials.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/50 rounded-lg">
          <span className="text-sm text-blue-300">
            {selectedMaterials.length} material{selectedMaterials.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            {onRefine && (
              <button
                onClick={() => onRefine(selectedMaterials)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors"
              >
                Refine Selected
              </button>
            )}
            {onSell && (
              <button
                onClick={() => onSell(selectedMaterials)}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium transition-colors"
              >
                Sell Selected
              </button>
            )}
            {onTransfer && (
              <button
                onClick={() => onTransfer(selectedMaterials)}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm font-medium transition-colors"
              >
                Transfer Selected
              </button>
            )}
          </div>
        </div>
      )}

      {/* Materials Display */}
      {viewMode === 'list' ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="p-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Material</th>
                <th className="p-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Category</th>
                <th className="p-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Tier</th>
                <th className="p-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Purity</th>
                <th className="p-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Quantity</th>
                <th className="p-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {Object.entries(groupedMaterials).map(([group, mats]) => (
                <React.Fragment key={`group-${group}`}>
                  {groupBy !== 'none' && (
                    <tr>
                      <td colSpan={6} className="p-2 bg-neutral-900/50">
                        <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                          {group} ({mats.length})
                        </span>
                      </td>
                    </tr>
                  )}
                  {mats.map(material => renderMaterialCard(material))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedMaterials).map(([group, mats]) => (
            <div key={group}>
              {groupBy !== 'none' && (
                <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-3">
                  {group} ({mats.length})
                </h3>
              )}
              <div className={
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                  : 'space-y-2'
              }>
                {mats.map(material => renderMaterialCard(material))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {processedMaterials.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <div className="text-lg font-medium text-neutral-400">No materials found</div>
          <div className="text-sm text-neutral-500 mt-2">
            {searchTerm || filterCategory !== 'all' || filterTier !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Your cargo hold is empty'}
          </div>
        </div>
      )}
    </div>
  );
}
