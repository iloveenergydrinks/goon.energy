'use client';

import React, { useState, useMemo } from 'react';
import { calculateMarketPrice, formatPrice, getMarketTrend, BASE_PRICES, TIER_MULTIPLIERS } from '@/lib/industrial/marketPricing';
import { getQualityGrade, getQualityBadgeStyles } from '@/lib/industrial/quality';

interface PlayerMaterial {
  id: string;
  materialId: string;
  material: {
    name: string;
    category: string;
    tier: number;
  };
  quantity: string;
  purity: number;
  tier: number;
}

interface MarketInterfaceProps {
  playerMaterials: PlayerMaterial[];
  playerOre: number;
  onTransactionComplete?: () => void;
}

type MarketTab = 'buy' | 'sell' | 'orders';

export function MarketInterface({
  playerMaterials,
  playerOre,
  onTransactionComplete
}: MarketInterfaceProps) {
  const [activeTab, setActiveTab] = useState<MarketTab>('buy');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('Iron');
  const [selectedTier, setSelectedTier] = useState(1);
  const [selectedQuality, setSelectedQuality] = useState(0.5);
  const [buyQuantity, setBuyQuantity] = useState(10);
  const [selectedStack, setSelectedStack] = useState<string | null>(null);
  const [sellQuantity, setSellQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Calculate current market prices for buying
  const buyMarketData = useMemo(() => {
    return calculateMarketPrice(selectedMaterial, selectedTier, selectedQuality, buyQuantity);
  }, [selectedMaterial, selectedTier, selectedQuality, buyQuantity]);
  
  // Calculate sell prices for player materials
  const sellableItems = useMemo(() => {
    return playerMaterials.map(mat => {
      const marketData = calculateMarketPrice(
        mat.material.name,
        mat.tier,
        mat.purity,
        parseInt(mat.quantity)
      );
      return {
        ...mat,
        marketData,
        qualityInfo: getQualityGrade(mat.purity)
      };
    }).sort((a, b) => b.marketData.sellPrice - a.marketData.sellPrice);
  }, [playerMaterials]);
  
  // Get selected stack for selling
  const selectedSellItem = useMemo(() => {
    return sellableItems.find(item => item.id === selectedStack);
  }, [sellableItems, selectedStack]);
  
  const handleBuy = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/market/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialType: selectedMaterial,
          tier: selectedTier,
          quality: selectedQuality,
          quantity: buyQuantity
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        onTransactionComplete?.();
        setBuyQuantity(10); // Reset quantity
        alert(result.message);
      } else {
        alert(`Purchase failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Buy error:', error);
      alert('Failed to complete purchase');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleSell = async () => {
    if (!selectedStack || !sellQuantity || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/market/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialStackId: selectedStack,
          quantity: sellQuantity
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        onTransactionComplete?.();
        setSelectedStack(null);
        setSellQuantity(1);
        alert(result.message);
      } else {
        alert(`Sale failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Sell error:', error);
      alert('Failed to complete sale');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-neutral-800">
        {(['buy', 'sell', 'orders'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold capitalize transition-colors ${
              activeTab === tab
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {tab === 'buy' ? '📈 Buy' : tab === 'sell' ? '📉 Sell' : '📋 Orders'}
          </button>
        ))}
      </div>
      
      {/* Buy Tab */}
      {activeTab === 'buy' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Material Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Select Material to Buy</h3>
            
            {/* Material Type */}
            <div>
              <label className="text-sm text-neutral-400">Material Type</label>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="w-full mt-1 bg-neutral-800 rounded px-3 py-2"
              >
                {Object.keys(BASE_PRICES).map(mat => (
                  <option key={mat} value={mat}>{mat}</option>
                ))}
              </select>
            </div>
            
            {/* Tier Selection */}
            <div>
              <label className="text-sm text-neutral-400">Tier</label>
              <div className="flex gap-2 mt-1">
                {[1, 2, 3, 4, 5].map(tier => (
                  <button
                    key={tier}
                    onClick={() => setSelectedTier(tier)}
                    className={`px-3 py-2 rounded ${
                      selectedTier === tier
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-800 hover:bg-neutral-700'
                    }`}
                  >
                    T{tier}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Quality Selection */}
            <div>
              <label className="text-sm text-neutral-400">
                Quality: {Math.round(selectedQuality * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={selectedQuality}
                onChange={(e) => setSelectedQuality(parseFloat(e.target.value))}
                className="w-full mt-1"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>Scrap (0%)</span>
                <span>Quantum (100%)</span>
              </div>
            </div>
            
            {/* Quantity */}
            <div>
              <label className="text-sm text-neutral-400">Quantity</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="number"
                  value={buyQuantity}
                  onChange={(e) => setBuyQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 bg-neutral-800 rounded px-3 py-2"
                  min="1"
                />
                <button
                  onClick={() => setBuyQuantity(10)}
                  className="px-3 py-2 bg-neutral-800 rounded hover:bg-neutral-700"
                >
                  10
                </button>
                <button
                  onClick={() => setBuyQuantity(100)}
                  className="px-3 py-2 bg-neutral-800 rounded hover:bg-neutral-700"
                >
                  100
                </button>
                <button
                  onClick={() => setBuyQuantity(1000)}
                  className="px-3 py-2 bg-neutral-800 rounded hover:bg-neutral-700"
                >
                  1K
                </button>
              </div>
            </div>
          </div>
          
          {/* Price Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Purchase Details</h3>
            
            <div className="bg-neutral-900 rounded-lg p-4 space-y-3">
              {/* Material Preview */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{selectedMaterial}</div>
                  <div className="text-sm text-neutral-400">Tier {selectedTier}</div>
                </div>
                <div className={`px-2 py-1 rounded text-xs ${getQualityBadgeStyles(getQualityGrade(selectedQuality))}`}>
                  {getQualityGrade(selectedQuality).name}
                </div>
              </div>
              
              {/* Market Info */}
              <div className="space-y-2 pt-3 border-t border-neutral-800">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Price per unit:</span>
                  <span>{formatPrice(buyMarketData.buyPrice)} ORE</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Quantity:</span>
                  <span>{buyQuantity}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t border-neutral-800">
                  <span>Total Cost:</span>
                  <span className="text-yellow-400">
                    {formatPrice(buyMarketData.buyPrice * buyQuantity)} ORE
                  </span>
                </div>
              </div>
              
              {/* Market Trend */}
              <div className="bg-neutral-800 rounded p-3">
                <div className="text-xs text-neutral-400 mb-1">Market Trend</div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${
                    getMarketTrend(buyMarketData.demandModifier, buyMarketData.supplyModifier).trend === 'up'
                      ? 'text-green-400'
                      : getMarketTrend(buyMarketData.demandModifier, buyMarketData.supplyModifier).trend === 'down'
                      ? 'text-red-400'
                      : 'text-yellow-400'
                  }`}>
                    {getMarketTrend(buyMarketData.demandModifier, buyMarketData.supplyModifier).trend === 'up' ? '📈' :
                     getMarketTrend(buyMarketData.demandModifier, buyMarketData.supplyModifier).trend === 'down' ? '📉' : '➡️'}
                  </span>
                  <span className="text-sm">
                    {getMarketTrend(buyMarketData.demandModifier, buyMarketData.supplyModifier).description}
                  </span>
                </div>
              </div>
              
              {/* Buy Button */}
              <button
                onClick={handleBuy}
                disabled={isProcessing || buyMarketData.buyPrice * buyQuantity > playerOre}
                className={`w-full py-3 rounded-lg font-bold transition-all ${
                  buyMarketData.buyPrice * buyQuantity <= playerOre && !isProcessing
                    ? 'bg-green-600 hover:bg-green-500 text-white'
                    : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                }`}
              >
                {isProcessing ? 'Processing...' :
                 buyMarketData.buyPrice * buyQuantity > playerOre ? 'Insufficient ORE' :
                 `Buy for ${formatPrice(buyMarketData.buyPrice * buyQuantity)} ORE`}
              </button>
            </div>
            
            {/* Balance */}
            <div className="text-sm text-neutral-400">
              Your Balance: <span className="text-yellow-400 font-bold">{formatPrice(playerOre)} ORE</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Sell Tab */}
      {activeTab === 'sell' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Material Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Your Materials</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {sellableItems.length === 0 ? (
                <div className="text-neutral-500 text-center py-8">
                  No materials to sell. Go mine some!
                </div>
              ) : (
                sellableItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedStack(item.id);
                      setSellQuantity(Math.min(10, parseInt(item.quantity)));
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedStack === item.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-neutral-700 hover:border-neutral-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{item.material.name}</div>
                        <div className="text-xs text-neutral-400">
                          T{item.tier} • {item.quantity} units
                        </div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded ${getQualityBadgeStyles(item.qualityInfo)}`}>
                        {item.qualityInfo.name}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-green-400">
                      Value: {formatPrice(item.marketData.sellPrice * parseInt(item.quantity))} ORE
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Sell Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Sell Details</h3>
            
            {selectedSellItem ? (
              <div className="bg-neutral-900 rounded-lg p-4 space-y-3">
                {/* Material Info */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{selectedSellItem.material.name}</div>
                    <div className="text-sm text-neutral-400">
                      Tier {selectedSellItem.tier} • {selectedSellItem.quantity} available
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${getQualityBadgeStyles(selectedSellItem.qualityInfo)}`}>
                    {selectedSellItem.qualityInfo.name}
                  </div>
                </div>
                
                {/* Quantity Selection */}
                <div>
                  <label className="text-sm text-neutral-400">Quantity to Sell</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="number"
                      value={sellQuantity}
                      onChange={(e) => setSellQuantity(Math.min(parseInt(selectedSellItem.quantity), Math.max(1, parseInt(e.target.value) || 1)))}
                      className="flex-1 bg-neutral-800 rounded px-3 py-2"
                      min="1"
                      max={selectedSellItem.quantity}
                    />
                    <button
                      onClick={() => setSellQuantity(Math.min(10, parseInt(selectedSellItem.quantity)))}
                      className="px-3 py-2 bg-neutral-800 rounded hover:bg-neutral-700"
                    >
                      10
                    </button>
                    <button
                      onClick={() => setSellQuantity(Math.min(100, parseInt(selectedSellItem.quantity)))}
                      className="px-3 py-2 bg-neutral-800 rounded hover:bg-neutral-700"
                    >
                      100
                    </button>
                    <button
                      onClick={() => setSellQuantity(parseInt(selectedSellItem.quantity))}
                      className="px-3 py-2 bg-neutral-800 rounded hover:bg-neutral-700"
                    >
                      All
                    </button>
                  </div>
                </div>
                
                {/* Price Info */}
                <div className="space-y-2 pt-3 border-t border-neutral-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Price per unit:</span>
                    <span>{formatPrice(selectedSellItem.marketData.sellPrice)} ORE</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Quantity:</span>
                    <span>{sellQuantity}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t border-neutral-800">
                    <span>Total Revenue:</span>
                    <span className="text-green-400">
                      {formatPrice(selectedSellItem.marketData.sellPrice * sellQuantity)} ORE
                    </span>
                  </div>
                </div>
                
                {/* Sell Button */}
                <button
                  onClick={handleSell}
                  disabled={isProcessing}
                  className={`w-full py-3 rounded-lg font-bold transition-all ${
                    !isProcessing
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                  }`}
                >
                  {isProcessing ? 'Processing...' :
                   `Sell for ${formatPrice(selectedSellItem.marketData.sellPrice * sellQuantity)} ORE`}
                </button>
              </div>
            ) : (
              <div className="bg-neutral-900 rounded-lg p-8 text-center text-neutral-400">
                Select a material to sell
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="bg-neutral-900 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Market Orders Coming Soon
          </h3>
          <p className="text-sm text-neutral-500 max-w-md mx-auto">
            Place buy and sell orders at specific prices and let the market come to you.
            Set up automated trading strategies based on quality and price thresholds.
          </p>
        </div>
      )}
    </div>
  );
}
