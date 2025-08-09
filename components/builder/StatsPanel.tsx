"use client";
import { useFittingStore } from "@/store/useFittingStore";

// Stat categories for organized display
const statCategories = {
  "Combat": ["damage", "range", "rateOfFire", "tracking", "traverseSpeed", "lockTime", "criticalChance", "armorPenetration"],
  "Defense": ["hull", "armor", "evasion", "pointDefense", "ecm"],
  "Power & Heat": ["powerDraw", "powerCapacity", "powerGen", "heatGeneration", "heatCapacity", "heatSink"],
  "Ammo & Logistics": ["ammoCapacity", "ammoCap", "reloadBonus", "repairRate"],
  "Mobility": ["speed", "mobility", "arcBonus"],
  "Sensors & Control": ["sensorStrength", "lockRange", "lockStrength", "disruption", "droneCapacity", "droneControl", "droneAI", "droneRepair"]
};

// Stat display names
const statNames: Record<string, string> = {
  damage: "Damage",
  range: "Range",
  rateOfFire: "Rate of Fire",
  tracking: "Tracking",
  traverseSpeed: "Traverse Speed",
  lockTime: "Lock Time (s)",
  criticalChance: "Critical Chance",
  armorPenetration: "Armor Pen",
  hull: "Hull HP",
  armor: "Armor",
  evasion: "Evasion",
  pointDefense: "Point Defense",
  ecm: "ECM Strength",
  powerDraw: "Power Draw",
  powerCapacity: "Power Capacity",
  powerGen: "Power Generation",
  heatGeneration: "Heat Generation",
  heatCapacity: "Heat Capacity",
  heatSink: "Heat Dissipation",
  ammoCapacity: "Ammo Capacity",
  ammoCap: "Ammo Storage",
  reloadBonus: "Reload Bonus %",
  repairRate: "Repair Rate",
  speed: "Speed",
  mobility: "Mobility",
  arcBonus: "Arc Bonus %",
  sensorStrength: "Sensor Strength",
  lockRange: "Lock Range",
  lockStrength: "Lock Strength",
  disruption: "Disruption",
  droneCapacity: "Drone Capacity",
  droneControl: "Drone Control",
  droneAI: "Drone AI",
  droneRepair: "Drone Repair",
  rofBonus: "RoF Bonus %",
  trackingBonus: "Tracking Bonus %",
  capBuffer: "Capacitor Buffer"
};

// Get color for stat value (green = good, yellow = medium, red = bad)
function getStatColor(key: string, value: number): string {
  // For negative stats, lower is worse
  const negativeStats = ["lockTime", "powerDraw", "heatGeneration"];
  
  if (negativeStats.includes(key)) {
    if (value <= 50) return "text-green-600";
    if (value <= 100) return "text-yellow-600";
    return "text-red-600";
  }
  
  // For positive stats, higher is better
  if (value >= 100) return "text-green-600";
  if (value >= 50) return "text-yellow-600";
  if (value >= 0) return "text-neutral-600";
  return "text-red-600";
}

// Format stat value
function formatStat(key: string, value: number): string {
  if (key === "lockTime") return `${value.toFixed(1)}s`;
  if (key.includes("Bonus") || key.includes("Chance")) return `${value > 0 ? '+' : ''}${value}%`;
  return value.toString();
}

export default function StatsPanel() {
  const derived = useFittingStore((s) => s.derivedStats);
  const placed = useFittingStore((s) => s.placed);
  const primaryId = useFittingStore((s) => s.primaryId);
  const secondaryIds = useFittingStore((s) => s.secondaryIds);
  const sizeId = useFittingStore((s) => s.sizeId);
  
  return (
    <div className="space-y-4 h-full overflow-y-auto">
      {/* Ship Configuration */}
      <div>
        <div className="font-semibold mb-2 text-lg text-neutral-900">Ship Configuration</div>
        <div className="space-y-1 text-sm bg-neutral-100 border border-neutral-200 p-3 rounded">
          <div className="flex justify-between">
            <span className="text-neutral-600">Class:</span>
            <span className="font-medium text-neutral-900">{sizeId || "None"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Primary:</span>
            <span className="font-medium text-xs text-neutral-900">{primaryId || "None"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Secondaries:</span>
            <span className="font-medium text-xs text-neutral-900">{secondaryIds.length > 0 ? secondaryIds.join(", ") : "None"}</span>
          </div>
        </div>
      </div>

      {/* Global Ship Stats */}
      <div>
        <div className="font-semibold mb-2 text-lg text-neutral-900">Ship Stats</div>
        {Object.keys(derived).length === 0 ? (
          <div className="text-sm text-neutral-500">Configure ship to see stats</div>
        ) : (
          <div className="space-y-3">
            {Object.entries(statCategories).map(([category, stats]) => {
              const categoryStats = stats.filter(stat => stat in derived);
              if (categoryStats.length === 0) return null;
              
              return (
                <div key={category}>
                  <div className="text-xs font-medium text-neutral-500 mb-1">{category}</div>
                  <div className="space-y-1 bg-neutral-100 border border-neutral-200 p-2 rounded">
                    {categoryStats.map(stat => {
                      const value = derived[stat];
                      const displayName = statNames[stat] || stat;
                      return (
                        <div key={stat} className="flex justify-between items-center">
                          <span className="text-xs text-neutral-600">{displayName}:</span>
                          <span className={`text-sm font-medium ${getStatColor(stat, value)}`}>
                            {formatStat(stat, value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            
            {/* Any uncategorized stats */}
            {(() => {
              const allCategorized = Object.values(statCategories).flat();
              const uncategorized = Object.keys(derived).filter(k => !allCategorized.includes(k));
              if (uncategorized.length === 0) return null;
              
              return (
                <div>
                  <div className="text-xs font-medium text-neutral-500 mb-1">Other</div>
                  <div className="space-y-1 bg-neutral-100 border border-neutral-200 p-2 rounded">
                    {uncategorized.map(stat => {
                      const value = derived[stat];
                      const displayName = statNames[stat] || stat;
                      return (
                        <div key={stat} className="flex justify-between items-center">
                          <span className="text-xs text-neutral-600">{displayName}:</span>
                          <span className={`text-sm font-medium ${getStatColor(stat, value)}`}>
                            {formatStat(stat, value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Placed Modules */}
      <div>
        <div className="font-semibold mb-2 text-lg text-neutral-900">Fitted Modules ({placed.length})</div>
        <div className="space-y-1 text-sm">
          {placed.length === 0 ? (
            <div className="text-neutral-500">No modules fitted</div>
          ) : (
            <div className="bg-neutral-100 border border-neutral-200 p-2 rounded space-y-1">
              {placed.map((p, idx) => {
                return (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="w-6 font-mono text-neutral-500">#{idx + 1}</span>
                    <span className="flex-1 text-neutral-900">{p.moduleId}</span>
                    <span className="text-neutral-500">@{p.anchor.r},{p.anchor.c}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}