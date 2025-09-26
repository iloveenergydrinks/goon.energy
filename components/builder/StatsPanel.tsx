"use client";
import { useFittingStore } from "@/store/useFittingStore";

// Stat categories for organized display
const statCategories = {
  "Combat": ["damage", "range", "rateOfFire", "tracking", "traverseSpeed", "lockTime", "criticalChance", "armorPenetration"],
  "Defense": ["hull", "armor", "evasion", "pointDefense", "ecm"],
  "Power": ["powerDraw", "powerCapacity", "powerGen"],
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
  const negativeStats = ["lockTime", "powerDraw"];
  
  if (negativeStats.includes(key)) {
    if (value <= 50) return "text-green-400";
    if (value <= 100) return "text-yellow-400";
    return "text-red-400";
  }
  
  // For positive stats, higher is better
  if (value >= 100) return "text-green-400";
  if (value >= 50) return "text-yellow-400";
  if (value >= 0) return "text-neutral-400";
  return "text-red-400";
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
  
  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[calc(100vh-20rem)]">
      {/* Bandwidth */}
      <div>
        <div className="font-medium text-sm mb-2 text-neutral-400">Bandwidth</div>
        <div className="space-y-2">
          {(() => {
            const bwTotal = derived["BW_total"] || 0;
            const bwLimit = derived["BW_limit"] || 0;
            const bwBonus = derived["BW_limitBonus"] || 0;
            const bwPct = derived["BW_limitPct"] || 0;
            const over = Math.max(0, bwTotal - bwLimit);
            const resp = derived["responsivenessMult"] || 1;
            const pct = bwLimit > 0 ? Math.min(100, Math.round((bwTotal / bwLimit) * 100)) : 0;
            const color = pct <= 90 ? "bg-green-500" : pct <= 100 ? "bg-yellow-500" : "bg-red-500";
            return (
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span className="text-neutral-500">BW Usage</span>
                  <span className={pct > 100 ? "text-red-400 font-medium" : "text-neutral-300"}>
                    {bwTotal} / {bwLimit}
                  </span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`${color} h-2 transition-all`} 
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {bwPct !== 0 && (
                  <div className="text-xs text-neutral-400 mt-1">
                    BW Limit Increase: +{bwPct}%
                  </div>
                )}
                {bwBonus !== 0 && (
                  <div className="text-xs text-neutral-400 mt-1">
                    BW Limit Bonus (flat): +{bwBonus}
                  </div>
                )}
                {over > 0 && (
                  <div className="text-xs text-red-400 mt-1">
                    Overloaded by {over} - Responsiveness: {Math.round(resp * 100)}%
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Module Count */}
      <div>
        <div className="font-medium text-sm mb-2 text-neutral-400">Module Status</div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-500">Modules Placed</span>
          <span className="font-medium">{placed.length}</span>
        </div>
        {derived["BW_mismatchAvg"] > 0 && (
          <div className="flex justify-between text-sm mt-1">
            <span className="text-neutral-500">Slot Mismatch</span>
            <span className="text-yellow-400">{derived["BW_mismatchAvg"]}%</span>
          </div>
        )}
      </div>

      {/* Derived Stats */}
      {Object.entries(statCategories).map(([category, statKeys]) => {
        const relevantStats = statKeys.filter(key => derived[key] !== undefined && derived[key] !== 0);
        if (relevantStats.length === 0) return null;
        
        return (
          <div key={category}>
            <div className="font-medium text-sm mb-2 text-neutral-400">{category}</div>
            <div className="space-y-1">
              {relevantStats.map(key => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-neutral-500">{statNames[key] || key}</span>
                  <span className={getStatColor(key, derived[key])}>
                    {formatStat(key, derived[key])}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      
      {/* Raw Stats (for any unmatched keys) */}
      {(() => {
        const allCategoryKeys = Object.values(statCategories).flat();
        const uncategorized = Object.keys(derived).filter(
          key => !allCategoryKeys.includes(key) && 
                 !key.startsWith("BW_") && 
                 key !== "responsivenessMult" &&
                 derived[key] !== 0
        );
        
        if (uncategorized.length === 0) return null;
        
        return (
          <div>
            <div className="font-medium text-sm mb-2 text-neutral-400">Other</div>
            <div className="space-y-1">
              {uncategorized.map(key => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-neutral-500">{statNames[key] || key}</span>
                  <span className="text-neutral-300">{formatStat(key, derived[key])}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}