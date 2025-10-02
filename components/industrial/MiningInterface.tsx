"use client";

import React, { useState, useEffect, useRef } from 'react';
import { getTierColor, getMaterialGrade, formatIndustrialNumber } from '@/lib/industrial/calculations';
import { getQualityGrade, getQualityTextColor } from '@/lib/industrial/quality';

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

// Floating number animation component
function FloatingNumber({ value, tier, quality, components, x, y, color }: { 
  value: string; 
  tier: number; 
  quality?: string; 
  components?: Array<{name: string; emoji: string; rarity: string}>;
  x: number; 
  y: number; 
  color: string 
}) {
  const isTemp = value === '...';
  
  return (
    <div 
      className="absolute pointer-events-none z-50"
      style={{ 
        left: `${x}px`, 
        top: `${y}px`,
        animation: isTemp ? 'pulse 0.5s ease-in-out infinite' : 'floatUp 2.5s ease-out forwards'
      }}
    >
      <div className="flex flex-col items-center">
        <span className="text-lg font-bold drop-shadow-lg" style={{ color }}>
          {isTemp ? '⛏️' : `+${value}`}
        </span>
        {!isTemp && tier > 0 && (
          <div className="flex flex-col items-center">
            <span 
              className="text-sm font-bold drop-shadow-lg"
              style={{ 
                color,
                textShadow: '0 0 10px rgba(0,0,0,0.8)'
              }}
            >
              T{tier}
            </span>
            {quality && (
              <span 
                className="text-xs font-bold drop-shadow-lg"
                style={{ 
                  color,
                  textShadow: '0 0 10px rgba(0,0,0,0.8)'
                }}
              >
                {quality}
              </span>
            )}
          </div>
        )}
        {components && components.length > 0 && (
          <div className="flex flex-col items-center gap-0.5 mt-2">
            {components.map((comp, i) => (
              <div 
                key={i} 
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                  comp.rarity === 'legendary' ? 'bg-purple-900/90 text-purple-100 border border-purple-500' :
                  comp.rarity === 'rare' ? 'bg-blue-900/90 text-blue-100 border border-blue-500' :
                  comp.rarity === 'uncommon' ? 'bg-green-900/90 text-green-100 border border-green-500' :
                  'bg-gray-900/90 text-gray-100 border border-gray-500'
                }`}
                style={{ 
                  animationDelay: `${i * 100}ms`,
                  animation: 'bounce-once 0.5s ease-out',
                  textShadow: '0 0 5px rgba(0,0,0,0.8)'
                }}
              >
                <span className="text-base">{comp.emoji}</span>
                <span>{comp.name}!</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function MiningInterface() {
  const [nodes, setNodes] = useState<ResourceNode[]>([]);
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [floatingNumbers, setFloatingNumbers] = useState<Array<{ id: string; nodeId: string; value: string; tier: number; quality?: string; components?: Array<{name: string; emoji: string; rarity: string}>; x: number; y: number; color: string }>>([]);
  const [clickPower, setClickPower] = useState(1);
  const [autoMiners, setAutoMiners] = useState(0);
  const [totalMined, setTotalMined] = useState(0);
  const [clickEffects, setClickEffects] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Load initial data
  useEffect(() => {
    loadData();
    loadUpgrades();
  }, []);
  
  const loadUpgrades = async () => {
    try {
      const response = await fetch('/api/mining/upgrades');
      if (response.ok) {
        const data = await response.json();
        setClickPower(data.clickPower || 1);
        setAutoMiners(data.autoMiners || 0);
      }
    } catch (error) {
      console.error('Error loading upgrades:', error);
    }
  };
  
  // Auto-mining effect
  useEffect(() => {
    if (autoMiners === 0) return;
    
    const interval = setInterval(() => {
      // Auto-mine random non-depleted nodes
      const availableNodes = nodes.filter(n => !n.depleted);
      if (availableNodes.length > 0) {
        const randomNode = availableNodes[Math.floor(Math.random() * availableNodes.length)];
        handleMineNode(randomNode, true);
      }
    }, 1000 / Math.min(autoMiners, 10)); // Cap speed at 10 clicks/second
    
    return () => clearInterval(interval);
  }, [autoMiners, nodes]);
  
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
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMineNode = async (node: ResourceNode, isAuto = false, event?: React.MouseEvent) => {
    if (node.depleted) return;
    
    // Capture click coordinates BEFORE async operations
    let clickX = 0;
    let clickY = 0;
    if (!isAuto && event && event.currentTarget) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      clickX = event.clientX - rect.left;
      clickY = event.clientY - rect.top;
      
      // Show immediate "mining..." feedback
      const tempId = `temp-${Date.now()}`;
      setFloatingNumbers(prev => [...prev, {
        id: tempId,
        nodeId: node.id,
        value: '...',
        tier: 0, // Will be replaced
        x: clickX - 20,
        y: clickY - 20,
        color: '#666666'
      }]);
      
      // Remove temp after short delay if still there
      setTimeout(() => {
        setFloatingNumbers(prev => prev.filter(n => n.id !== tempId));
      }, 500);
    }
    
    // Click effect
    setClickEffects({ ...clickEffects, [node.id]: true });
    setTimeout(() => {
      setClickEffects(prev => ({ ...prev, [node.id]: false }));
    }, 150);
    
    try {
      const response = await fetch('/api/mining/mine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nodeId: node.id,
          multiplier: clickPower // Send click power multiplier
        })
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Mining failed' }));
        console.error('Mining failed:', error);
        return;
      }
      
      const result = await response.json();
      
      if (result && result.node) {
        // Show floating number with tier and quality AFTER getting result
        if (!isAuto && clickX !== 0) {
          // Add floating number with actual tier from result
          const id = `${Date.now()}-${Math.random()}`;
          const tierColor = getTierColor(result.mined.tier);
          const qualityInfo = getQualityGrade(result.mined.purity || 0.5);
          setFloatingNumbers(prev => [...prev, { 
            id,
            nodeId: node.id,
            value: result.mined.quantity,
            tier: result.mined.tier,
            quality: qualityInfo.shortName,
            components: result.componentDrops, // Add component drops
            x: clickX - 30,
            y: clickY - 30,
            color: tierColor
          }]);
          
          // Remove after animation
          setTimeout(() => {
            setFloatingNumbers(prev => prev.filter(n => n.id !== id));
          }, 2500); // Increased time to show components
        }
        
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
        
        // Update total mined counter
        setTotalMined(prev => prev + parseInt(result.mined.quantity));
        
        // If node is depleted, regenerate it after a delay
        if (result.node.depleted) {
          setTimeout(() => {
            regenerateNode(node.id);
          }, 3000); // Regenerate after 3 seconds
        }
      }
    } catch (error) {
      console.error('Error mining node:', error);
      // Don't throw, just log - allow user to keep clicking
    }
  };
  
  const regenerateNode = async (nodeId: string) => {
    try {
      const response = await fetch('/api/mining/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId })
      });
      
      if (response.ok) {
        const result = await response.json();
        setNodes(prevNodes => prevNodes.map(n => {
          if (n.id === nodeId) {
            return {
              ...n,
              currentAmount: result.node.currentAmount,
              totalAmount: result.node.totalAmount,
              depleted: false,
              purity: result.node.purity
            };
          }
          return n;
        }));
      }
    } catch (error) {
      console.error('Error regenerating node:', error);
    }
  };
  
  const buyUpgrade = async (type: 'clickPower' | 'autoMiner') => {
    if (!player) return;
    
    try {
      const response = await fetch('/api/mining/upgrades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Update local state
        setClickPower(result.upgrades.clickPower);
        setAutoMiners(result.upgrades.autoMiners);
        setPlayer({ ...player, isk: result.player.isk });
      } else {
        const error = await response.json();
        console.error('Failed to buy upgrade:', error);
        alert(error.error || 'Failed to buy upgrade');
      }
    } catch (error) {
      console.error('Error buying upgrade:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-neutral-500">Loading mining interface...</div>
      </div>
    );
  }
  
  if (nodes.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <div className="border border-yellow-800 bg-yellow-900/20 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">Database Connection Required</h3>
          <p className="text-sm text-neutral-400">
            The mining system requires a database connection to store your progress.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6" ref={containerRef}>
      <style jsx>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: translateY(-30px) scale(1.3) rotate(-5deg);
          }
          100% {
            opacity: 0;
            transform: translateY(-80px) scale(1.8) rotate(5deg);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
      `}</style>
      
      {/* Stats Bar */}
      <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/50">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <span className="text-xs text-neutral-500 uppercase tracking-wide">ORE Balance</span>
            <div className="text-2xl font-bold text-amber-400">
              {player ? formatIndustrialNumber(parseInt(player.isk)) : '0'}
            </div>
          </div>
          <div>
            <span className="text-xs text-neutral-500 uppercase tracking-wide">Click Power</span>
            <div className="text-2xl font-bold text-green-400">
              {clickPower}x
            </div>
          </div>
          <div>
            <span className="text-xs text-neutral-500 uppercase tracking-wide">Auto-Miners</span>
            <div className="text-2xl font-bold text-blue-400">
              {autoMiners}
            </div>
          </div>
          <div>
            <span className="text-xs text-neutral-500 uppercase tracking-wide">Total Mined</span>
            <div className="text-2xl font-bold text-purple-400">
              {formatIndustrialNumber(totalMined)}
            </div>
          </div>
          <div>
            <span className="text-xs text-neutral-500 uppercase tracking-wide">Materials</span>
            <div className="text-2xl font-bold text-cyan-400">
              {player?.materials?.length || 0}
            </div>
          </div>
        </div>
      </div>
      
      {/* Resource Nodes - Clicker Style */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {nodes.map(node => {
          const progress = parseInt(node.currentAmount) / parseInt(node.totalAmount);
          const tierColor = getTierColor(node.tier as any);
          const hasClickEffect = clickEffects[node.id];
          
          return (
            <button
              key={node.id}
              onClick={(e) => !node.depleted && handleMineNode(node, false, e)}
              disabled={node.depleted}
              className={`
                relative border rounded-lg p-3 transition-all select-none
                ${node.depleted 
                  ? 'border-neutral-900 bg-neutral-950 opacity-30 cursor-not-allowed' 
                  : 'border border-neutral-800 hover:border-neutral-600 hover:shadow-lg active:scale-95'
                }
                ${hasClickEffect ? 'scale-110' : ''}
              `}
              style={{
                borderColor: !node.depleted ? `${tierColor}60` : undefined,
                background: !node.depleted ? `linear-gradient(135deg, transparent, ${tierColor}10)` : undefined
              }}
            >
              {/* Floating numbers container - only for this specific node */}
              {floatingNumbers
                .filter(num => num.nodeId === node.id)
                .map(num => (
                  <FloatingNumber key={num.id} {...num} />
                ))}
              
              {/* Node Icon */}
              <div className="text-3xl mb-2 select-none">
                {node.type === 'asteroid' ? '🪨' :
                 node.type === 'gas_cloud' ? '☁️' :
                 node.type === 'salvage' ? '🔧' :
                 '💎'}
              </div>
              
              {/* Node Name */}
              <h3 className="text-xs font-semibold text-white mb-1 truncate">
                {node.name}
              </h3>
              
              {/* Tier Badge */}
              <div
                className="inline-block px-1.5 py-0.5 rounded text-xs font-bold mb-2"
                style={{
                  backgroundColor: `${tierColor}20`,
                  color: tierColor,
                }}
              >
                T{node.tier}
              </div>
              
              {/* Resource Type */}
              <div className="text-xs text-neutral-400 mb-1 capitalize">
                {node.resourceType.replace('_', ' ')}
              </div>
              
              {/* Tier Probabilities */}
              <div className="text-xs text-neutral-500 mb-2">
                {node.tier === 5 && '10% T3 • 30% T4 • 60% T5'}
                {node.tier === 4 && '20% T3 • 60% T4 • 20% T5'}
                {node.tier === 3 && '20% T2 • 60% T3 • 20% T4'}
                {node.tier === 2 && '20% T1 • 60% T2 • 20% T3'}
                {node.tier === 1 && '60% T1 • 30% T2 • 10% T3'}
              </div>
              
              {/* Yield */}
              <div className="text-sm font-bold text-green-400 mb-2">
                +{node.baseYield * clickPower}/click
              </div>
              
              {/* Progress Bar */}
              <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-150"
                  style={{
                    width: `${progress * 100}%`,
                    backgroundColor: node.depleted ? '#6B7280' : tierColor
                  }}
                />
              </div>
              
              {/* Amount */}
              <div className="text-xs text-neutral-500 mt-1">
                {formatIndustrialNumber(parseInt(node.currentAmount))}
              </div>
              
              {/* Depleted Overlay */}
              {node.depleted && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                  <div className="text-xs text-red-400 font-bold animate-pulse">
                    REGENERATING...
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Quick Stats */}
      <div className="border border-neutral-800 rounded-lg p-3 bg-neutral-900/30">
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-500">Mining Rate:</span>
          <span className="text-white">
            {autoMiners > 0 ? `${autoMiners}/sec + manual` : 'Manual only'}
          </span>
        </div>
      </div>
    </div>
  );
}