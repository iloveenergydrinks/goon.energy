"use client";

import React, { useState, useEffect } from 'react';
import { MaterialCard, MaterialComparison } from '@/components/industrial/MaterialCard';
import { PurificationInterface } from '@/components/industrial/PurificationInterface';
import { MiningInterface } from '@/components/industrial/MiningInterface';
import { CargoInventory } from '@/components/industrial/CargoInventory';
import { MaterialStackDetails } from '@/components/industrial/MaterialStackDetails';
import { ManufacturingInterface } from '@/components/industrial/ManufacturingInterface';
import { InventoryCard } from '@/components/industrial/InventoryCard';
import type { 
  Material, 
  RefiningFacility,
  MaterialMarket,
  ResourceNode,
  ManufacturingFacility
} from '@/types/industrial';
import { getMockIndustrialData } from '@/lib/industrial/mockData';
import { formatIndustrialNumber, calculateMaterialTier, getMaterialGrade } from '@/lib/industrial/calculations';

type TabId = 'overview' | 'mining' | 'materials' | 'refining' | 'manufacturing' | 'inventory';

export default function IndustrialDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [playerData, setPlayerData] = useState<any>(null);
  const [realMaterials, setRealMaterials] = useState<Material[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<Material[]>([]);
  const [detailMaterial, setDetailMaterial] = useState<Material | null>(null);
  const [multiSelect, setMultiSelect] = useState(false);
  const [playerBlueprints, setPlayerBlueprints] = useState<any[]>([]);
  const [playerModules, setPlayerModules] = useState<any[]>([]);
  
  // Load player data
  useEffect(() => {
    loadPlayerData();
  }, [activeTab]);
  
  const loadPlayerData = async () => {
    try {
      // Fetch player data
      const response = await fetch('/api/player');
      if (response.ok) {
        const data = await response.json();
        setPlayerData(data);
        
        // Convert player materials to Material format with stack tracking
        if (data.materials) {
          // Group materials by name and tier to create consolidated view with stack info
          const grouped: Record<string, Material & { stacks: any[] }> = {};
          
          data.materials.forEach((pm: any) => {
            const key = `${pm.material.name}_T${pm.tier}`;
            
            if (!grouped[key]) {
              grouped[key] = {
            id: pm.id,
            name: pm.material.name,
            category: pm.material.category,
            tier: pm.tier,
                purity: 0, // Will calculate weighted average
                displayGrade: '',
                attributes: pm.attributes || {
                  strength: 50 + pm.tier * 10,
                  conductivity: 45 + pm.tier * 12,
                  density: 60 - pm.tier * 5,
                  reactivity: 40 + pm.tier * 8,
                  stability: 55 + pm.tier * 7,
                  elasticity: 50 + pm.tier * 6
                },
            rarity: pm.tier === 5 ? 'Legendary' : 
                   pm.tier === 4 ? 'Epic' :
                   pm.tier === 3 ? 'Rare' :
                   pm.tier === 2 ? 'Uncommon' : 'Common',
            baseValue: pm.material.baseValue || 100 * pm.tier,
                quantity: 0,
                stackable: true,
                stacks: []
              };
            }
            
            grouped[key].quantity += parseInt(pm.quantity);
            grouped[key].stacks.push({
              id: pm.id,
            quantity: parseInt(pm.quantity),
              purity: pm.purity
            });
          });
          
          // Calculate weighted average purity for each group
          const materials = Object.values(grouped).map(group => {
            const totalQuantity = group.stacks.reduce((sum, s) => sum + s.quantity, 0);
            const weightedPurity = group.stacks.reduce((sum, s) => 
              sum + (s.purity * s.quantity), 0
            ) / totalQuantity;
            
            return {
              ...group,
              purity: weightedPurity,
              displayGrade: getMaterialGrade(weightedPurity)
            };
          });
          
          setRealMaterials(materials);
        }
      }
      
      // Fetch blueprints
      const blueprintsResponse = await fetch('/api/blueprints');
      if (blueprintsResponse.ok) {
        const blueprintsData = await blueprintsResponse.json();
        setPlayerBlueprints(blueprintsData.blueprints || []);
      }
      
      // Fetch inventory
      const inventoryResponse = await fetch('/api/inventory');
      if (inventoryResponse.ok) {
        const inventoryData = await inventoryResponse.json();
        setPlayerModules(inventoryData.modules || []);
      }
    } catch (error) {
      console.error('Error loading player data:', error);
    }
  };
  
  // Mock data for other systems
  const {
    materials: mockMaterials,
    blueprints,
    refiningFacilities,
    manufacturingFacilities,
    marketData,
    resourceNodes,
    playerStats: mockPlayerStats
  } = getMockIndustrialData();
  
  // Use real data when available
  const materials = realMaterials.length > 0 ? realMaterials : mockMaterials;
  const playerStats = playerData ? {
    isk: parseInt(playerData.isk || '0'),
    totalMaterials: playerData.materials?.reduce((sum: number, m: any) => sum + parseInt(m.quantity), 0) || 0,
    totalBlueprints: playerData.blueprints?.length || 0,
    activeJobs: mockPlayerStats.activeJobs
  } : mockPlayerStats;
  
  
  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'mining', label: 'Mining', icon: '⛏️' },
    { id: 'materials', label: 'Cargo Hold', icon: '📦' },
    { id: 'refining', label: 'Purification', icon: '⚗️' },
    { id: 'manufacturing', label: 'Manufacturing', icon: '🏭' },
    { id: 'inventory', label: 'Inventory', icon: '📋' }
  ];
  
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-neutral-900/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="text-neutral-400 hover:text-white transition-colors"
                title="Back to Ship Builder"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </a>
              <div>
                <h1 className="text-2xl font-bold text-white">Industrial Complex</h1>
                <p className="text-sm text-neutral-500 mt-1">
                  Refine, Research, Manufacture
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              {/* Player Resources Quick View */}
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-neutral-500">ORE:</span>
                  <span className="text-amber-400 ml-2 font-medium">
                    {formatIndustrialNumber(playerStats.isk)} ORE
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">Materials:</span>
                  <span className="text-blue-400 ml-2 font-medium">
                    {formatIndustrialNumber(playerStats.totalMaterials)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">Blueprints:</span>
                  <span className="text-purple-400 ml-2 font-medium">
                    {playerStats.totalBlueprints}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="border-b border-neutral-800 bg-neutral-900/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-3 text-sm font-medium transition-colors border-b-2
                  ${activeTab === tab.id
                    ? 'text-white border-blue-500 bg-neutral-900/50'
                    : 'text-neutral-400 border-transparent hover:text-neutral-200 hover:bg-neutral-900/30'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Overview Tab - System Briefing */}
        {activeTab === 'overview' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Main Title */}
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/50 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-2">Industrial Complex Briefing</h2>
              <p className="text-neutral-400">
                Welcome to your industrial operation center. Here you'll extract resources, refine materials, and manufacture advanced equipment.
              </p>
            </div>

            {/* Mining Section */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-green-400 mb-3 flex items-center gap-2">
                ⛏️ Mining Operations
              </h3>
              <div className="space-y-3 text-neutral-300">
                <p>
                  <span className="text-white font-semibold">Extract raw materials</span> from resource nodes scattered across space. 
                  Click nodes to mine them instantly - no waiting required!
                </p>
                <div className="bg-neutral-800/50 rounded p-3 space-y-2">
                  <p className="text-sm"><span className="text-yellow-400">• Node Tiers (T1-T5):</span> Higher tier nodes yield better materials</p>
                  <p className="text-sm"><span className="text-yellow-400">• Material Quality:</span> Each extraction has random quality from <span className="text-orange-500">Scrap</span> to <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">Quantum</span></p>
                  <p className="text-sm"><span className="text-yellow-400">• Tier Variance:</span> T4 nodes can yield T3-T5 materials based on luck</p>
                </div>
              </div>
            </div>
            
            {/* Quality System */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-purple-400 mb-3">
                💎 Quality Grades
              </h3>
              <div className="space-y-2">
                <p className="text-neutral-300 mb-3">
                  Materials come in 7 quality grades that determine their value and effectiveness:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded text-xs font-bold bg-orange-900/50 text-orange-600 border border-orange-900">Scrap</span>
                    <span className="text-neutral-400 text-sm">0-20% purity (70% effectiveness)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded text-xs font-bold bg-gray-700/50 text-gray-400 border border-gray-700">Crude</span>
                    <span className="text-neutral-400 text-sm">20-40% purity (80% effectiveness)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded text-xs font-bold bg-gray-500/20 text-gray-300 border border-gray-500">Standard</span>
                    <span className="text-neutral-400 text-sm">40-60% purity (90% effectiveness)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded text-xs font-bold bg-blue-600/20 text-blue-400 border border-blue-600">Refined</span>
                    <span className="text-neutral-400 text-sm">60-80% purity (100% effectiveness)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded text-xs font-bold bg-purple-600/20 text-purple-400 border border-purple-600">Pure</span>
                    <span className="text-neutral-400 text-sm">80-95% purity (110% effectiveness)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-600/20 text-yellow-400 border border-yellow-600">Pristine</span>
                    <span className="text-neutral-400 text-sm">95-99.99% purity (120% effectiveness)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded text-xs font-bold bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20 text-white border border-transparent bg-clip-border animate-pulse">Quantum</span>
                    <span className="text-neutral-400 text-sm">100% purity (130% effectiveness) - Extremely rare!</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Purification Section */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-orange-400 mb-3 flex items-center gap-2">
                ⚗️ Purification Chamber
              </h3>
              <div className="space-y-3 text-neutral-300">
                <p>
                  <span className="text-white font-semibold">Gamble to improve material quality</span> through purification. 
                  Success odds decrease as materials get purer, making high-quality materials exponentially valuable.
                </p>
                
                {/* Dynamic Odds */}
                <div className="bg-neutral-800/50 rounded p-3 space-y-2">
                  <p className="text-sm font-semibold text-yellow-400 mb-2">📊 Dynamic Difficulty:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div><span className="text-orange-500">Scrap (0-20%):</span> <span className="text-green-400">80% upgrade chance - Easy!</span></div>
                    <div><span className="text-gray-400">Crude (20-40%):</span> <span className="text-green-400">70% upgrade chance</span></div>
                    <div><span className="text-gray-300">Standard (40-60%):</span> <span className="text-yellow-400">60% upgrade chance</span></div>
                    <div><span className="text-blue-400">Refined (60-75%):</span> <span className="text-yellow-400">45% upgrade chance</span></div>
                    <div><span className="text-purple-400">Pure (75-85%):</span> <span className="text-orange-400">35% upgrade chance</span></div>
                    <div><span className="text-yellow-400">Pristine (85-95%):</span> <span className="text-red-400">25% upgrade chance</span></div>
                    <div><span className="text-white">Quantum (95-100%):</span> <span className="text-red-500">15% upgrade chance - Extreme!</span></div>
                  </div>
                </div>
                
                {/* Risk Modes */}
                <div className="bg-neutral-800/50 rounded p-3 space-y-2">
                  <p className="text-sm font-semibold text-yellow-400 mb-2">🎲 Risk Modes - Choose Your Strategy:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-start gap-2">
                      <span className="text-green-400 font-bold">🟢 Safe:</span>
                      <div className="text-xs">
                        <p className="text-neutral-400">10% material cost, ×0.7 upgrade odds</p>
                        <p className="text-neutral-500">Small gains (5-10%), low risk</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">🔵 Standard:</span>
                      <div className="text-xs">
                        <p className="text-neutral-400">20% material cost, ×1.0 odds</p>
                        <p className="text-neutral-500">Moderate gains (10-20%), balanced</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-orange-400 font-bold">🟠 Aggressive:</span>
                      <div className="text-xs">
                        <p className="text-neutral-400">30% material cost, ×1.3 upgrade odds</p>
                        <p className="text-neutral-500">Large gains (15-35%), higher risk</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-red-400 font-bold animate-pulse">🔴 YOLO:</span>
                      <div className="text-xs">
                        <p className="text-neutral-400">50% material cost, ×1.5 upgrade odds</p>
                        <p className="text-neutral-500">Huge gains (25-50%), maximum chaos!</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Advanced Features */}
                <div className="bg-neutral-800/50 rounded p-3 space-y-2">
                  <p className="text-sm"><span className="text-yellow-400">• Refinement Levels:</span> Materials at 100% purity can be refined further (+1, +2, etc.) for bonus effectiveness</p>
                  <p className="text-sm"><span className="text-yellow-400">• Auto-Merge:</span> Same purity stacks automatically combine to save inventory space</p>
                  <p className="text-sm"><span className="text-yellow-400">• Strategic Depth:</span> Low quality? Go aggressive! Near perfect? Play it safe!</p>
                </div>
              </div>
            </div>

            {/* Manufacturing Preview */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                🏭 Manufacturing <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded">Coming Soon</span>
              </h3>
              <div className="space-y-3 text-neutral-300">
                <p>
                  <span className="text-white font-semibold">Create powerful equipment</span> using refined materials. 
                  Higher quality materials produce superior items with enhanced stats.
                </p>
                <div className="bg-neutral-800/50 rounded p-3 space-y-2">
                  <p className="text-sm"><span className="text-yellow-400">• Quality Matters:</span> Pristine materials create +20% stronger items</p>
                  <p className="text-sm"><span className="text-yellow-400">• Blueprints:</span> Research and improve manufacturing patterns</p>
                  <p className="text-sm"><span className="text-yellow-400">• Specialization:</span> Focus on specific item types for bonuses</p>
                </div>
              </div>
            </div>
            
            {/* Tips */}
            <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-800/50 rounded-lg p-4">
              <h4 className="text-yellow-400 font-semibold mb-2">💡 Pro Tips</h4>
              <ul className="text-sm text-neutral-300 space-y-1">
                <li>• <span className="text-white">Mining:</span> Start with T1-T2 nodes to build up materials safely</li>
                <li>• <span className="text-white">Risk Strategy:</span> Use YOLO mode on low-quality materials for big jumps</li>
                <li>• <span className="text-white">Preservation:</span> Switch to Safe mode when materials reach Pure+ quality</li>
                <li>• <span className="text-white">Efficiency:</span> Standard mode offers the best risk/reward balance</li>
                <li>• <span className="text-white">Inventory:</span> Materials auto-merge at same purity to save space</li>
                <li>• <span className="text-white">End Game:</span> Refinement levels (+1, +2) provide infinite progression</li>
                <li>• <span className="text-white">Value:</span> Each quality grade is ~50% more valuable than the previous</li>
              </ul>
            </div>

            {/* Quick Navigation */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button 
                onClick={() => setActiveTab('mining')}
                className="bg-green-600/20 hover:bg-green-600/30 border border-green-600/50 text-green-400 py-3 px-4 rounded-lg transition-all hover:scale-105"
              >
                <div className="text-2xl mb-1">⛏️</div>
                <div className="text-sm font-semibold">Start Mining</div>
              </button>
              <button 
                onClick={() => setActiveTab('materials')}
                className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/50 text-blue-400 py-3 px-4 rounded-lg transition-all hover:scale-105"
              >
                <div className="text-2xl mb-1">📦</div>
                <div className="text-sm font-semibold">Cargo Hold</div>
              </button>
              <button 
                onClick={() => setActiveTab('refining')}
                className="bg-orange-600/20 hover:bg-orange-600/30 border border-orange-600/50 text-orange-400 py-3 px-4 rounded-lg transition-all hover:scale-105"
              >
                <div className="text-2xl mb-1">⚗️</div>
                <div className="text-sm font-semibold">Purify Materials</div>
              </button>
              <button 
                onClick={() => setActiveTab('manufacturing')}
                className="bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-600/50 text-cyan-400 py-3 px-4 rounded-lg transition-all hover:scale-105 relative"
              >
                <div className="text-2xl mb-1">🏭</div>
                <div className="text-sm font-semibold">Manufacturing</div>
                <span className="absolute -top-1 -right-1 text-xs bg-yellow-600 text-black px-1 rounded">Soon</span>
              </button>
            </div>
          </div>
        )}
        
        {/* Mining Tab */}
        {activeTab === 'mining' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">Mining Operations</h2>
            <MiningInterface />
          </div>
        )}
        
        {/* Cargo Hold Tab */}
        {activeTab === 'materials' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Cargo Hold</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    const response = await fetch('/api/materials/consolidate', { 
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ preservePremium: true })
                    });
                    if (response.ok) {
                      const result = await response.json();
                      const message = result.preservedPremium > 0 
                        ? `Consolidated ${result.consolidatedGroups} groups, removed ${result.deletedStacks} duplicates, preserved ${result.preservedPremium} premium stacks`
                        : `Consolidated ${result.consolidatedGroups} groups, removed ${result.deletedStacks} duplicates`;
                      alert(message);
                      loadPlayerData();
                    }
                  }}
                  className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  title="Consolidates materials within purity bands, preserving premium (85%+) stacks"
                >
                  🔀 Smart Consolidate
                </button>
                <button 
                  onClick={loadPlayerData}
                  className="px-3 py-1.5 text-sm border border-blue-700 text-blue-400 rounded-lg hover:border-blue-600 transition-colors"
                >
                  🔄 Refresh
                </button>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={multiSelect}
                    onChange={(e) => {
                      setMultiSelect(e.target.checked);
                      if (!e.target.checked) setSelectedMaterials([]);
                    }}
                    className="rounded border-neutral-600"
                  />
                  <span className="text-neutral-400">Multi-select</span>
                </label>
              </div>
            </div>
            
            <CargoInventory
              materials={materials}
              onMaterialSelect={(material) => {
                if (multiSelect) {
                      setSelectedMaterials(prev => {
                    const exists = prev.some(m => m.id === material.id);
                        if (exists) {
                      return prev.filter(m => m.id !== material.id);
                    } else {
                      return [...prev, material];
                    }
                  });
                } else {
                  setSelectedMaterials([material]);
                }
              }}
              selectedMaterials={selectedMaterials}
              multiSelect={multiSelect}
              showActions={true}
              onRefine={(materials) => {
                setActiveTab('refining');
                setSelectedMaterials(materials);
              }}
              onSell={async (materials) => {
                // TODO: Implement selling
                console.log('Selling materials:', materials);
              }}
              onTransfer={async (materials) => {
                // TODO: Implement transfer
                console.log('Transferring materials:', materials);
              }}
              onShowDetails={setDetailMaterial}
            />
            
            {detailMaterial && (
              <MaterialStackDetails
                material={detailMaterial}
                onClose={() => setDetailMaterial(null)}
              />
            )}
          </>
        )}
        
        {/* Purification Tab (formerly Refining) */}
        {activeTab === 'refining' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">Purification Chamber</h2>
            <PurificationInterface
              materials={selectedMaterials.length > 0 ? selectedMaterials : []}
              playerMaterials={playerData?.materials || []}
              onPurificationComplete={() => {
                // Reload materials after purification
                loadPlayerData();
                setSelectedMaterials([]);
              }}
            />
          </div>
        )}
        
        {/* Manufacturing Tab */}
        {activeTab === 'manufacturing' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Manufacturing Bay</h2>
            <ManufacturingInterface
              blueprints={playerBlueprints}
              playerMaterials={playerData?.materials || []}
              onCraftComplete={() => {
                loadPlayerData();
              }}
            />
          </div>
        )}
        
        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Module Inventory</h2>
            <div className="text-sm text-neutral-400 mb-4">
              Crafted modules: {playerModules.length}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {playerModules.map((module) => (
                <InventoryCard key={module.id} module={module} />
              ))}
              {playerModules.length === 0 && (
                <div className="col-span-full text-center py-12 text-neutral-500">
                  No modules crafted yet. Visit the Manufacturing Bay to craft your first module!
                </div>
              )}
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ title, value, subtitle, color }: {
  title: string;
  value: number | string;
  subtitle: string;
  color: string;
}) {
  return (
    <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/30">
      <div className="text-sm text-neutral-500 mb-1">{title}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-neutral-600 mt-1">{subtitle}</div>
    </div>
  );
}

function ActivityItem({ time, message, type }: {
  time: string;
  message: string;
  type: 'success' | 'error' | 'info';
}) {
  const colors = {
    success: 'text-green-400',
    error: 'text-red-400',
    info: 'text-blue-400'
  };
  
  return (
    <div className="flex items-start gap-3 py-2">
      <div className={`w-2 h-2 rounded-full mt-1.5 ${
        type === 'success' ? 'bg-green-400' :
        type === 'error' ? 'bg-red-400' :
        'bg-blue-400'
      }`} />
      <div className="flex-1">
        <p className="text-sm text-neutral-300">{message}</p>
        <p className="text-xs text-neutral-600 mt-0.5">{time}</p>
      </div>
    </div>
  );
}

function QuickAction({ title, description, icon, onClick }: {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="border border-neutral-800 rounded-lg p-6 text-left hover:border-neutral-700 hover:bg-neutral-900/30 transition-all"
    >
      <div className="text-2xl mb-3">{icon}</div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="text-xs text-neutral-500 mt-1">{description}</p>
    </button>
  );
}

