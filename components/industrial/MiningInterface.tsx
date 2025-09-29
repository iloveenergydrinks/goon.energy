"use client";

import React, { useState, useEffect } from 'react';
import { getTierColor, getMaterialGrade, formatIndustrialNumber } from '@/lib/industrial/calculations';

interface ResourceNode {
  id: string;
  name: string;
  type: string;
  tier: number;
  resourceType: string;
  totalAmount: string;
  currentAmount: string;
  baseYield: number;
  purity: number;
  sector: string;
  coordinates: number[];
  active: boolean;
  depleted: boolean;
}

interface MiningResult {
  mined: {
    material: string;
    quantity: string;
    tier: number;
    purity: number;
    iskReward: string;
  };
  node: {
    id: string;
    currentAmount: string;
    depleted: boolean;
  };
  inventory: {
    totalQuantity: string;
    stackId: string;
  };
  player: {
    isk: string;
  };
}

interface PlayerData {
  id: string;
  name: string;
  isk: string;
  materials: Array<{
    id: string;
    quantity: string;
    tier: number;
    purity: number;
    material: {
      id: string;
      name: string;
      category: string;
    };
  }>;
}

export function MiningInterface() {
  const [nodes, setNodes] = useState<ResourceNode[]>([]);
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [selectedNode, setSelectedNode] = useState<ResourceNode | null>(null);
  const [miningInProgress, setMiningInProgress] = useState<string | null>(null);
  const [lastMiningResult, setLastMiningResult] = useState<MiningResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [miningAnimations, setMiningAnimations] = useState<Record<string, boolean>>({});
  
  // Load initial data
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setLoading(true);
    try {
      // Load player data
      const playerRes = await fetch('/api/player');
      if (playerRes.ok) {
        const playerData = await playerRes.json();
        if (playerData && !playerData.error) {
          setPlayer(playerData);
        }
      } else {
        console.error('Failed to load player data');
      }
      
      // Load or generate nodes
      let nodesRes = await fetch('/api/mining/nodes');
      if (nodesRes.ok) {
        let nodesData = await nodesRes.json();
        
        // If no nodes exist, generate them
        if ((!nodesData || nodesData.length === 0 || nodesData.error) && !nodesData.error) {
          const generateRes = await fetch('/api/mining/nodes', { method: 'POST' });
          if (generateRes.ok) {
            nodesRes = await fetch('/api/mining/nodes');
            if (nodesRes.ok) {
              nodesData = await nodesRes.json();
            }
          }
        }
        
        if (Array.isArray(nodesData)) {
          setNodes(nodesData);
        }
      } else {
        console.error('Failed to load nodes');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMineNode = async (node: ResourceNode) => {
    if (miningInProgress || node.depleted) return;
    
    setMiningInProgress(node.id);
    setMiningAnimations({ ...miningAnimations, [node.id]: true });
    
    try {
      const response = await fetch('/api/mining/mine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId: node.id })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Mining failed:', errorData);
        // Show error to user
        setLastMiningResult({
          mined: {
            material: 'Error',
            quantity: '0',
            tier: 1,
            purity: 0,
            iskReward: '0'
          },
          node: { id: node.id, currentAmount: node.currentAmount, depleted: false },
          inventory: { totalQuantity: '0', stackId: '' },
          player: { isk: player?.isk || '0' },
          error: errorData.details || errorData.error || 'Mining failed'
        } as any);
        return;
      }
      
      const result = await response.json();
      
      if (result && result.node) {
        setLastMiningResult(result);
        
        // Update local state
        setNodes(nodes.map(n => 
          n.id === node.id 
            ? { ...n, currentAmount: result.node.currentAmount, depleted: result.node.depleted }
            : n
        ));
        
        // Update player ISK
        if (result.player && player) {
          setPlayer({ ...player, isk: result.player.isk });
        }
        
        // Reload player inventory
        const playerRes = await fetch('/api/player');
        const playerData = await playerRes.json();
        setPlayer(playerData);
        
        // Show mining animation
        setTimeout(() => {
          setMiningAnimations({ ...miningAnimations, [node.id]: false });
        }, 1000);
      }
    } catch (error) {
      console.error('Error mining node:', error);
    } finally {
      setMiningInProgress(null);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-neutral-500">Loading mining interface...</div>
      </div>
    );
  }
  
  // Show demo mode if no database connection
  if (nodes.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <div className="border border-yellow-800 bg-yellow-900/20 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">Database Connection Required</h3>
          <p className="text-sm text-neutral-400 mb-4">
            The mining system requires a database connection to store your progress.
          </p>
          <p className="text-xs text-neutral-500">
            Make sure your database is configured and Prisma migrations have been run.
          </p>
        </div>
        
        {/* Demo Preview */}
        <div className="border border-neutral-800 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Mining System Features (Preview)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-neutral-900 rounded p-3">
              <div className="text-2xl mb-2">⛏️</div>
              <div className="text-neutral-200 font-medium">Click-to-Mine</div>
              <div className="text-neutral-500 mt-1">Extract resources from nodes with each click</div>
            </div>
            <div className="bg-neutral-900 rounded p-3">
              <div className="text-2xl mb-2">💎</div>
              <div className="text-neutral-200 font-medium">Material Quality</div>
              <div className="text-neutral-500 mt-1">Tiers 1-5 with varying purity levels</div>
            </div>
            <div className="bg-neutral-900 rounded p-3">
              <div className="text-2xl mb-2">📦</div>
              <div className="text-neutral-200 font-medium">Inventory System</div>
              <div className="text-neutral-500 mt-1">Materials stack by tier and purity</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Player Stats Bar */}
      <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-xs text-neutral-500 uppercase tracking-wide">Player</span>
              <div className="text-lg font-semibold text-white">{player?.name || 'Loading...'}</div>
            </div>
            <div>
              <span className="text-xs text-neutral-500 uppercase tracking-wide">ORE Balance</span>
              <div className="text-lg font-semibold text-amber-400">
                {player ? formatIndustrialNumber(parseInt(player.isk)) : '0'} ORE
              </div>
            </div>
            <div>
              <span className="text-xs text-neutral-500 uppercase tracking-wide">Materials</span>
              <div className="text-lg font-semibold text-blue-400">
                {player?.materials?.length || 0} stacks
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {nodes.length > 6 && (
              <button
                onClick={async () => {
                  await fetch('/api/mining/nodes/clear', { method: 'DELETE' });
                  loadData();
                }}
                className="px-4 py-2 text-sm border border-red-700 text-red-400 rounded-lg hover:border-red-600 transition-colors"
              >
                Clear Duplicates
              </button>
            )}
            <button
              onClick={loadData}
              className="px-4 py-2 text-sm border border-neutral-700 rounded-lg hover:border-neutral-600 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      {/* Mining Result Notification */}
      {lastMiningResult && (
        <div className={`border rounded-lg p-4 ${
          (lastMiningResult as any).error 
            ? 'border-red-800 bg-red-900/20' 
            : 'border-green-800 bg-green-900/20'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              {(lastMiningResult as any).error ? (
                <>
                  <div className="text-sm font-semibold text-red-400">Mining Failed</div>
                  <div className="text-xs text-neutral-300 mt-1">
                    {(lastMiningResult as any).error}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm font-semibold text-green-400">Mining Successful!</div>
                  <div className="text-xs text-neutral-300 mt-1">
                    Extracted {formatIndustrialNumber(parseInt(lastMiningResult.mined.quantity))} units of{' '}
                    <span className="text-white font-medium">{lastMiningResult.mined.material}</span>{' '}
                    <span style={{ color: getTierColor(lastMiningResult.mined.tier as any) }}>
                      (T{lastMiningResult.mined.tier}, {(lastMiningResult.mined.purity * 100).toFixed(0)}% purity)
                    </span>
                  </div>
                  <div className="text-xs text-amber-400 mt-0.5">
                    +{formatIndustrialNumber(parseInt(lastMiningResult.mined.iskReward))} ORE
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setLastMiningResult(null)}
              className="text-neutral-500 hover:text-neutral-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* Resource Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nodes.map(node => {
          const progress = parseInt(node.currentAmount) / parseInt(node.totalAmount);
          const tierColor = getTierColor(node.tier as any);
          const isSelected = selectedNode?.id === node.id;
          const isMining = miningInProgress === node.id;
          const hasAnimation = miningAnimations[node.id];
          
          return (
            <button
              key={node.id}
              onClick={() => !node.depleted && handleMineNode(node)}
              disabled={node.depleted || isMining}
              className={`
                relative border rounded-lg p-4 text-left transition-all
                ${node.depleted 
                  ? 'border-neutral-900 bg-neutral-950 opacity-50 cursor-not-allowed' 
                  : isSelected
                    ? 'border-2 shadow-lg'
                    : 'border border-neutral-800 hover:border-neutral-700 hover:shadow-md'
                }
                ${!node.depleted && !isMining ? 'hover:scale-[1.02] active:scale-[0.98]' : ''}
                ${hasAnimation ? 'animate-pulse' : ''}
              `}
              style={{
                borderColor: isSelected && !node.depleted ? tierColor : undefined,
                boxShadow: isSelected && !node.depleted ? `0 0 30px ${tierColor}30` : undefined
              }}
            >
              {/* Mining Animation Overlay */}
              {hasAnimation && (
                <div className="absolute inset-0 rounded-lg pointer-events-none">
                  <div className="absolute inset-0 bg-green-400/20 animate-ping rounded-lg" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl animate-bounce">
                    ⛏️
                  </div>
                </div>
              )}
              
              {/* Node Type Icon */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {node.type === 'asteroid' ? '🪨' :
                     node.type === 'gas_cloud' ? '☁️' :
                     node.type === 'salvage' ? '🔧' :
                     '💎'}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{node.name}</h3>
                    <p className="text-xs text-neutral-500">{node.sector}</p>
                  </div>
                </div>
                <div
                  className="px-2 py-1 rounded text-xs font-bold"
                  style={{
                    backgroundColor: `${tierColor}20`,
                    color: tierColor,
                    border: `1px solid ${tierColor}60`
                  }}
                >
                  T{node.tier}
                </div>
              </div>
              
              {/* Resource Info */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Resource</span>
                  <span className="text-neutral-200 font-medium capitalize">
                    {node.resourceType.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Yield/Click</span>
                  <span className="text-green-400 font-medium">
                    ~{node.baseYield} units
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Base Purity</span>
                  <span className="text-blue-400 font-medium">
                    {(node.purity * 100).toFixed(0)}% ({getMaterialGrade(node.purity)})
                  </span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-neutral-500">Remaining</span>
                  <span className="text-neutral-300">
                    {formatIndustrialNumber(parseInt(node.currentAmount))} / {formatIndustrialNumber(parseInt(node.totalAmount))}
                  </span>
                </div>
                <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${progress * 100}%`,
                      backgroundColor: node.depleted ? '#6B7280' : tierColor
                    }}
                  />
                </div>
              </div>
              
              {/* Status */}
              {node.depleted && (
                <div className="mt-3 text-xs text-center text-red-400 font-medium">
                  DEPLETED
                </div>
              )}
              {isMining && (
                <div className="mt-3 text-xs text-center text-green-400 font-medium animate-pulse">
                  MINING...
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Inventory Summary */}
      {player && player.materials && player.materials.length > 0 && (
        <div className="border border-neutral-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Current Inventory</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {player.materials.map(stack => (
              <div
                key={stack.id}
                className="bg-neutral-900 rounded p-2 text-xs"
              >
                <div className="text-neutral-200 font-medium capitalize">
                  {stack.material.name}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-neutral-500">
                    {formatIndustrialNumber(parseInt(stack.quantity))} units
                  </span>
                  <span
                    className="font-bold"
                    style={{ color: getTierColor(stack.tier as any) }}
                  >
                    T{stack.tier}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
