'use client';

import { useState } from 'react';

const ROOM_DATA = [
  {
    name: "Safe Zone",
    level: 1,
    risk: "None",
    description: "Tutorial/Starting Area - No PvP, no hazards",
    qualityRange: "30-50%",
    distribution: [
      { tier: "T1", material: "Iron", percentage: 39, rarity: "common" },
      { tier: "T1", material: "Copper", percentage: 34, rarity: "common" },
      { tier: "T1", material: "Silicon", percentage: 24, rarity: "common" },
      { tier: "T2", material: "Silver", percentage: 2, rarity: "rare" },
      { tier: "T2", material: "Gold", percentage: 0.8, rarity: "rare" },
      { tier: "T2", material: "Titanium", percentage: 0.2, rarity: "very-rare" },
    ]
  },
  {
    name: "Industrial Sector",
    level: 2,
    risk: "Low",
    description: "Minor equipment wear, occasional power fluctuations",
    qualityRange: "40-65%",
    distribution: [
      { tier: "T1", material: "Iron", percentage: 19, rarity: "common" },
      { tier: "T1", material: "Copper", percentage: 14, rarity: "common" },
      { tier: "T1", material: "Silicon", percentage: 14, rarity: "common" },
      { tier: "T2", material: "Silver", percentage: 19, rarity: "common" },
      { tier: "T2", material: "Gold", percentage: 19, rarity: "common" },
      { tier: "T2", material: "Titanium", percentage: 10, rarity: "common" },
      { tier: "T3", material: "Platinum", percentage: 3, rarity: "rare" },
      { tier: "T3", material: "Uranium", percentage: 1.5, rarity: "rare" },
      { tier: "T3", material: "Thorium", percentage: 0.5, rarity: "very-rare" },
    ]
  },
  {
    name: "Contested Zone",
    level: 3,
    risk: "Medium",
    description: "PvP enabled, extraction makes you visible",
    qualityRange: "50-75%",
    distribution: [
      { tier: "T1", material: "Iron", percentage: 4.5, rarity: "common" },
      { tier: "T1", material: "Copper", percentage: 4.5, rarity: "common" },
      { tier: "T1", material: "Silicon", percentage: 4.5, rarity: "common" },
      { tier: "T2", material: "Silver", percentage: 14, rarity: "common" },
      { tier: "T2", material: "Gold", percentage: 14, rarity: "common" },
      { tier: "T2", material: "Titanium", percentage: 19, rarity: "common" },
      { tier: "T3", material: "Platinum", percentage: 15, rarity: "common" },
      { tier: "T3", material: "Uranium", percentage: 10, rarity: "common" },
      { tier: "T3", material: "Thorium", percentage: 10, rarity: "common" },
      { tier: "T4", material: "Rare Earth", percentage: 2.5, rarity: "rare" },
      { tier: "T4", material: "Neutronium", percentage: 1.5, rarity: "rare" },
      { tier: "T4", material: "Plasma", percentage: 0.5, rarity: "very-rare" },
    ]
  },
  {
    name: "Deep Core",
    level: 4,
    risk: "High",
    description: "Environmental damage, equipment degradation",
    qualityRange: "60-85%",
    distribution: [
      { tier: "T2", material: "Silver", percentage: 4.5, rarity: "common" },
      { tier: "T2", material: "Gold", percentage: 4.5, rarity: "common" },
      { tier: "T2", material: "Titanium", percentage: 9, rarity: "common" },
      { tier: "T3", material: "Platinum", percentage: 19, rarity: "common" },
      { tier: "T3", material: "Uranium", percentage: 14, rarity: "common" },
      { tier: "T3", material: "Thorium", percentage: 14, rarity: "common" },
      { tier: "T4", material: "Rare Earth", percentage: 15, rarity: "common" },
      { tier: "T4", material: "Neutronium", percentage: 10, rarity: "common" },
      { tier: "T4", material: "Plasma", percentage: 5, rarity: "common" },
      { tier: "T5", material: "Dark Matter", percentage: 3, rarity: "rare" },
      { tier: "T5", material: "Antimatter", percentage: 1.5, rarity: "rare" },
      { tier: "T5", material: "Strange Matter", percentage: 0.5, rarity: "very-rare" },
    ]
  },
  {
    name: "Quantum Anomaly",
    level: 5,
    risk: "Extreme",
    description: "Reality distortions, random teleportation, time dilation",
    qualityRange: "40-95% (high variance)",
    distribution: [
      { tier: "T3", material: "Platinum", percentage: 5, rarity: "common" },
      { tier: "T3", material: "Uranium", percentage: 5, rarity: "common" },
      { tier: "T3", material: "Thorium", percentage: 5, rarity: "common" },
      { tier: "T4", material: "Rare Earth", percentage: 20, rarity: "common" },
      { tier: "T4", material: "Neutronium", percentage: 15, rarity: "common" },
      { tier: "T4", material: "Plasma", percentage: 15, rarity: "common" },
      { tier: "T5", material: "Dark Matter", percentage: 15, rarity: "common" },
      { tier: "T5", material: "Antimatter", percentage: 10, rarity: "common" },
      { tier: "T5", material: "Strange Matter", percentage: 10, rarity: "common" },
    ]
  }
];

const TIER_COLORS = {
  T1: "text-gray-400",
  T2: "text-green-400",
  T3: "text-blue-400",
  T4: "text-purple-400",
  T5: "text-orange-400",
};

const RARITY_STYLES = {
  "common": "",
  "rare": "italic text-yellow-500",
  "very-rare": "italic font-bold text-red-500",
};

export default function OverviewPage() {
  const [selectedRoom, setSelectedRoom] = useState(0);

  return (
    <div className="min-h-screen p-10 bg-neutral-950">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-[0.35em] uppercase text-[rgb(220,230,255)]">
            Game Overview
          </h1>
          <div className="flex gap-2">
            <a
              href="/"
              className="text-xs px-3 py-2 rounded-md border border-neutral-700/70 text-neutral-400 hover:border-neutral-500 hover:text-white transition-colors"
            >
              🚀 Ship Builder
            </a>
            <a
              href="/industrial"
              className="text-xs px-3 py-2 rounded-md border border-neutral-700/70 text-neutral-400 hover:border-neutral-500 hover:text-white transition-colors"
            >
              ⚗️ Industrial
            </a>
          </div>
        </div>

        {/* Resource Distribution Section */}
        <div className="bg-neutral-900/80 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-white/90">Resource Distribution by Zone</h2>
          
          {/* Room Selector */}
          <div className="flex gap-2 mb-6">
            {ROOM_DATA.map((room, index) => (
              <button
                key={index}
                onClick={() => setSelectedRoom(index)}
                className={`px-4 py-2 rounded-md transition-all ${
                  selectedRoom === index
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                <div className="text-sm font-bold">Room {room.level}</div>
                <div className="text-xs">{room.name}</div>
              </button>
            ))}
          </div>

          {/* Selected Room Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-white/80">
                {ROOM_DATA[selectedRoom].name} (Level {ROOM_DATA[selectedRoom].level})
              </h3>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-neutral-400">
                  <span className="font-semibold">Risk:</span>{' '}
                  <span className={`${
                    ROOM_DATA[selectedRoom].risk === 'None' ? 'text-green-500' :
                    ROOM_DATA[selectedRoom].risk === 'Low' ? 'text-yellow-500' :
                    ROOM_DATA[selectedRoom].risk === 'Medium' ? 'text-orange-500' :
                    ROOM_DATA[selectedRoom].risk === 'High' ? 'text-red-500' :
                    'text-purple-500'
                  }`}>
                    {ROOM_DATA[selectedRoom].risk}
                  </span>
                </p>
                <p className="text-sm text-neutral-400">
                  <span className="font-semibold">Quality Range:</span> {ROOM_DATA[selectedRoom].qualityRange}
                </p>
                <p className="text-sm text-neutral-400 italic">
                  {ROOM_DATA[selectedRoom].description}
                </p>
              </div>
            </div>

            {/* Distribution Chart */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-white/70">Material Distribution</h4>
              <div className="space-y-1">
                {ROOM_DATA[selectedRoom].distribution.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${TIER_COLORS[item.tier]} w-8`}>
                      {item.tier}
                    </span>
                    <span className={`text-sm flex-1 ${RARITY_STYLES[item.rarity]}`}>
                      {item.material}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-neutral-800 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            item.tier === 'T1' ? 'bg-gray-500' :
                            item.tier === 'T2' ? 'bg-green-500' :
                            item.tier === 'T3' ? 'bg-blue-500' :
                            item.tier === 'T4' ? 'bg-purple-500' :
                            'bg-orange-500'
                          }`}
                          style={{ width: `${Math.min(item.percentage * 5, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-neutral-500 w-12 text-right">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Special Mechanics */}
        <div className="bg-neutral-900/80 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-white/90">Special Mechanics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-neutral-800/50 rounded-md p-4">
              <h3 className="text-sm font-bold text-purple-400 mb-2">Anomaly Nodes (0.1%)</h3>
              <p className="text-xs text-neutral-400">
                Can contain ANY material from ANY tier with 70-95% quality. 
                "A strange anomaly pulses with unknown energy..."
              </p>
            </div>
            <div className="bg-neutral-800/50 rounded-md p-4">
              <h3 className="text-sm font-bold text-yellow-400 mb-2">Quality Bonuses</h3>
              <p className="text-xs text-neutral-400">
                Materials 2+ tiers above room: +20% quality<br/>
                Materials 3+ tiers above room: +40% quality
              </p>
            </div>
            <div className="bg-neutral-800/50 rounded-md p-4">
              <h3 className="text-sm font-bold text-cyan-400 mb-2">Lottery Moments</h3>
              <p className="text-xs text-neutral-400">
                Even Room 1 can spawn T5 materials!<br/>
                "Impossible! You've found traces of Dark Matter here!"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
