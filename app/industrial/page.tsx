"use client";

import React, { useState, useEffect } from 'react';
import { MaterialCard, MaterialComparison } from '@/components/industrial/MaterialCard';
import { BlueprintResearch, BlueprintList } from '@/components/industrial/BlueprintResearch';
import { RefiningInterface } from '@/components/industrial/RefiningInterface';
import { MiningInterface } from '@/components/industrial/MiningInterface';
import type { 
  Material, 
  Blueprint, 
  RefiningFacility,
  MaterialMarket,
  ResourceNode,
  ManufacturingFacility
} from '@/types/industrial';
import { getMockIndustrialData } from '@/lib/industrial/mockData';
import { formatIndustrialNumber, calculateMaterialTier, getMaterialGrade } from '@/lib/industrial/calculations';

type TabId = 'overview' | 'mining' | 'materials' | 'blueprints' | 'refining' | 'manufacturing' | 'market';

export default function IndustrialDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [playerData, setPlayerData] = useState<any>(null);
  const [realMaterials, setRealMaterials] = useState<Material[]>([]);
  
  // Load player data
  useEffect(() => {
    loadPlayerData();
  }, [activeTab]);
  
  const loadPlayerData = async () => {
    try {
      const response = await fetch('/api/player');
      if (response.ok) {
        const data = await response.json();
        setPlayerData(data);
        
        // Convert player materials to Material format
        if (data.materials) {
          const materials: Material[] = data.materials.map((pm: any) => ({
            id: pm.id,
            name: pm.material.name,
            category: pm.material.category,
            tier: pm.tier,
            purity: pm.purity,
            displayGrade: getMaterialGrade(pm.purity),
            attributes: pm.attributes,
            rarity: pm.tier === 5 ? 'Legendary' : 
                   pm.tier === 4 ? 'Epic' :
                   pm.tier === 3 ? 'Rare' :
                   pm.tier === 2 ? 'Uncommon' : 'Common',
            baseValue: pm.material.baseValue || 100 * pm.tier,
            quantity: parseInt(pm.quantity),
            stackable: true
          }));
          setRealMaterials(materials);
        }
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
  
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null);
  const [selectedMaterials, setSelectedMaterials] = useState<Material[]>([]);
  
  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'mining', label: 'Mining', icon: '⛏️' },
    { id: 'materials', label: 'Materials', icon: '💎' },
    { id: 'blueprints', label: 'Blueprints', icon: '📋' },
    { id: 'refining', label: 'Refining', icon: '⚗️' },
    { id: 'manufacturing', label: 'Manufacturing', icon: '🏭' },
    { id: 'market', label: 'Market', icon: '💹' }
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
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                title="Active Research"
                value={blueprints.filter(b => b.inResearch).length}
                subtitle="blueprints"
                color="text-purple-400"
              />
              <StatCard
                title="Refining Jobs"
                value={playerStats.activeJobs.refining}
                subtitle="in progress"
                color="text-green-400"
              />
              <StatCard
                title="Manufacturing"
                value={playerStats.activeJobs.manufacturing}
                subtitle="queued"
                color="text-blue-400"
              />
              <StatCard
                title="Transport Routes"
                value={playerStats.activeJobs.transport}
                subtitle="active"
                color="text-yellow-400"
              />
            </div>
            
            {/* Recent Activity */}
            <div className="border border-neutral-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
              <div className="space-y-2">
                <ActivityItem
                  time="2 minutes ago"
                  message="Refining completed: 3,430 units of Titanium (T4, 80% purity)"
                  type="success"
                />
                <ActivityItem
                  time="15 minutes ago"
                  message="Research failed: Heavy Railgun Mk. III - Level 12"
                  type="error"
                />
                <ActivityItem
                  time="1 hour ago"
                  message="Manufacturing started: Flux Capacitors x10"
                  type="info"
                />
                <ActivityItem
                  time="2 hours ago"
                  message="Market sale: 5,000 units of Plasma Gas for 125,000 ORE"
                  type="success"
                />
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <QuickAction
                title="Start Mining"
                description="Extract resources from nodes"
                icon="⛏️"
                onClick={() => setActiveTab('mining')}
              />
              <QuickAction
                title="Start Refining"
                description="Process raw materials to increase purity"
                icon="⚗️"
                onClick={() => setActiveTab('refining')}
              />
              <QuickAction
                title="Research Blueprints"
                description="Improve your blueprints for better stats"
                icon="🔬"
                onClick={() => setActiveTab('blueprints')}
              />
              <QuickAction
                title="Check Market"
                description="Buy and sell materials at current prices"
                icon="💹"
                onClick={() => setActiveTab('market')}
              />
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
        
        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Material Inventory</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={loadPlayerData}
                  className="px-3 py-1.5 text-sm border border-blue-700 text-blue-400 rounded-lg hover:border-blue-600 transition-colors"
                >
                  Refresh
                </button>
                {materials.length > 0 && (
                  <>
                    <button className="px-3 py-1.5 text-sm border border-neutral-700 rounded-lg hover:border-neutral-600 transition-colors">
                      Sort by Tier
                    </button>
                    <button className="px-3 py-1.5 text-sm border border-neutral-700 rounded-lg hover:border-neutral-600 transition-colors">
                      Sort by Purity
                    </button>
                    <button className="px-3 py-1.5 text-sm border border-neutral-700 rounded-lg hover:border-neutral-600 transition-colors">
                      Sort by Value
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Material Grid or Empty State */}
            {materials.length === 0 ? (
              <div className="border border-neutral-800 rounded-lg p-12 text-center">
                <div className="text-4xl mb-4">📦</div>
                <h3 className="text-lg font-semibold text-white mb-2">No Materials Yet</h3>
                <p className="text-sm text-neutral-500 mb-4">
                  Start mining resources to build your material inventory
                </p>
                <button
                  onClick={() => setActiveTab('mining')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Go to Mining
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materials.map(material => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    selected={selectedMaterials.some(m => m.id === material.id)}
                    onSelect={(mat) => {
                      setSelectedMaterials(prev => {
                        const exists = prev.some(m => m.id === mat.id);
                        if (exists) {
                          return prev.filter(m => m.id !== mat.id);
                        }
                        return [...prev, mat];
                      });
                    }}
                    showDetails={true}
                  />
                ))}
              </div>
            )}
            
            {/* Comparison View */}
            {selectedMaterials.length > 1 && (
              <div className="mt-6">
                <MaterialComparison
                  materials={selectedMaterials}
                  requirements={[
                    { attribute: 'strength', minValue: 0.5, idealValue: 0.8 },
                    { attribute: 'conductivity', minValue: 0.6, idealValue: 0.9 }
                  ]}
                />
              </div>
            )}
          </div>
        )}
        
        {/* Blueprints Tab */}
        {activeTab === 'blueprints' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <h3 className="text-lg font-semibold text-white mb-4">Your Blueprints</h3>
              <BlueprintList
                blueprints={blueprints}
                onSelectBlueprint={setSelectedBlueprint}
                selectedId={selectedBlueprint?.id}
              />
            </div>
            <div className="lg:col-span-2">
              {selectedBlueprint ? (
                <BlueprintResearch
                  blueprint={selectedBlueprint}
                  onStartResearch={(config) => {
                    console.log('Starting research:', config);
                    // Handle research start
                  }}
                  onCancelResearch={() => {
                    console.log('Cancelling research');
                    // Handle research cancel
                  }}
                  isResearching={selectedBlueprint.inResearch}
                />
              ) : (
                <div className="border border-neutral-800 rounded-lg p-12 text-center">
                  <div className="text-4xl mb-4">📋</div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Select a Blueprint
                  </h3>
                  <p className="text-sm text-neutral-500">
                    Choose a blueprint from the list to view details and start research
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Refining Tab */}
        {activeTab === 'refining' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">Refining Station</h2>
            <RefiningInterface
              materials={materials}
              facilities={refiningFacilities}
              onStartRefining={(config) => {
                console.log('Starting refining:', config);
                // Handle refining start
              }}
            />
          </div>
        )}
        
        {/* Manufacturing Tab */}
        {activeTab === 'manufacturing' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Manufacturing Bay</h2>
            <div className="border border-neutral-800 rounded-lg p-8 text-center">
              <div className="text-4xl mb-4">🏭</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Manufacturing Coming Soon
              </h3>
              <p className="text-sm text-neutral-500 max-w-md mx-auto">
                The manufacturing system will allow you to combine blueprints and materials 
                to create items with quality bonuses based on material tiers.
              </p>
            </div>
          </div>
        )}
        
        {/* Market Tab */}
        {activeTab === 'market' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Material Exchange</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Buy Orders */}
              <div className="border border-neutral-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Buy Orders</h3>
                <div className="space-y-2">
                  <MarketOrder
                    material="Titanium"
                    tier={3}
                    minPurity={60}
                    price={1250}
                    quantity={1000}
                    type="buy"
                  />
                  <MarketOrder
                    material="Plasma Gas"
                    tier={2}
                    minPurity={40}
                    price={850}
                    quantity={2500}
                    type="buy"
                  />
                  <MarketOrder
                    material="Quantum Crystals"
                    tier={4}
                    minPurity={75}
                    price={5500}
                    quantity={500}
                    type="buy"
                  />
                </div>
              </div>
              
              {/* Sell Orders */}
              <div className="border border-neutral-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Sell Orders</h3>
                <div className="space-y-2">
                  <MarketOrder
                    material="Titanium"
                    tier={2}
                    minPurity={45}
                    price={980}
                    quantity={3000}
                    type="sell"
                  />
                  <MarketOrder
                    material="Carbon Fiber"
                    tier={3}
                    minPurity={65}
                    price={2100}
                    quantity={1500}
                    type="sell"
                  />
                  <MarketOrder
                    material="Dark Matter"
                    tier={5}
                    minPurity={92}
                    price={15000}
                    quantity={100}
                    type="sell"
                  />
                </div>
              </div>
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

function MarketOrder({ material, tier, minPurity, price, quantity, type }: {
  material: string;
  tier: number;
  minPurity: number;
  price: number;
  quantity: number;
  type: 'buy' | 'sell';
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-neutral-900/50 rounded-lg">
      <div>
        <div className="text-sm font-medium text-white">{material}</div>
        <div className="text-xs text-neutral-500">
          T{tier} • Min {minPurity}% purity • {quantity} units
        </div>
      </div>
      <div className="text-right">
      <div className={`text-sm font-medium ${
        type === 'buy' ? 'text-green-400' : 'text-red-400'
      }`}>
        {price} ORE/unit
      </div>
        <button className="text-xs text-blue-400 hover:text-blue-300 mt-0.5">
          {type === 'buy' ? 'Sell' : 'Buy'}
        </button>
      </div>
    </div>
  );
}
