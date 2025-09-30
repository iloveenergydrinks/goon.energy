import type { ModuleType, SlotType, SlotCompatibility } from "@/types/fitting";
import { prisma } from "@/lib/prisma";
import type { CustomSlotType } from "@prisma/client";

// Cache for slot definitions
let slotDefinitionsCache: Record<string, SlotCompatibility> | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60000; // 1 minute cache

// Default definitions as fallback
const DEFAULT_SLOT_DEFINITIONS: Record<string, SlotCompatibility> = {
  // Base slots - only accept their own type
  "Power": { accepts: ["Power"], preferredType: "Power", bwMultiplier: 1 },
  "Ammo": { accepts: ["Ammo"], preferredType: "Ammo", bwMultiplier: 1 },
  "Utility": { accepts: ["Utility"], preferredType: "Utility", bwMultiplier: 1 },
  
  // Hybrid slots - accept multiple types
  "Hybrid-PA": { accepts: ["Power", "Ammo"], preferredType: "Power", bwMultiplier: 1.2 },
  "Hybrid-PU": { accepts: ["Power", "Utility"], preferredType: "Power", bwMultiplier: 1.2 },
  "Hybrid-AU": { accepts: ["Ammo", "Utility"], preferredType: "Ammo", bwMultiplier: 1.2 },
  "Hybrid-PAU": { accepts: ["Power", "Ammo", "Utility"], preferredType: undefined, bwMultiplier: 1.3 },
};

/**
 * Load slot definitions from database
 */
export async function loadSlotDefinitions(): Promise<Record<string, SlotCompatibility>> {
  try {
    const slots = await prisma.customSlotType.findMany({
      where: { isActive: true }
    });
    
    const definitions: Record<string, SlotCompatibility> = {};
    
    for (const slot of slots) {
      definitions[slot.id] = {
        accepts: slot.accepts as ModuleType[],
        preferredType: slot.preferredType as ModuleType | undefined,
        bwMultiplier: slot.bwMultiplier
      };
    }
    
    // Cache the results
    slotDefinitionsCache = definitions;
    cacheTimestamp = Date.now();
    
    return definitions;
  } catch (error) {
    console.error("Failed to load slot definitions from database:", error);
    return DEFAULT_SLOT_DEFINITIONS;
  }
}

/**
 * Get slot definitions with caching
 */
export async function getSlotDefinitions(): Promise<Record<string, SlotCompatibility>> {
  // Check if cache is still valid
  if (slotDefinitionsCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return slotDefinitionsCache;
  }
  
  // Load from database
  return await loadSlotDefinitions();
}

/**
 * Get slot definitions synchronously (uses cache or defaults)
 */
export function getSlotDefinitionsSync(): Record<string, SlotCompatibility> {
  if (slotDefinitionsCache) {
    return slotDefinitionsCache;
  }
  return DEFAULT_SLOT_DEFINITIONS;
}

// Export for backward compatibility
export const SLOT_DEFINITIONS = DEFAULT_SLOT_DEFINITIONS;

/**
 * Check if a module can fit in a slot
 */
export function canModuleFitInSlot(
  moduleType: ModuleType,
  slotType: SlotType,
  slotCompatibility?: SlotCompatibility
): boolean {
  // Use provided compatibility or look it up
  const definitions = getSlotDefinitionsSync();
  const compatibility = slotCompatibility || definitions[slotType];
  
  // If no compatibility info, fall back to exact match
  if (!compatibility) {
    return moduleType === slotType;
  }
  
  return compatibility.accepts.includes(moduleType);
}

/**
 * Get bandwidth multiplier for placing a module in a slot
 */
export function getSlotBandwidthMultiplier(
  moduleType: ModuleType,
  slotType: SlotType,
  slotCompatibility?: SlotCompatibility
): number {
  // Use provided compatibility or look it up
  const definitions = getSlotDefinitionsSync();
  const compatibility = slotCompatibility || definitions[slotType];
  
  // If no compatibility info, check for exact match
  if (!compatibility) {
    return moduleType === slotType ? 1 : 2; // Heavy penalty for mismatch
  }
  
  // Check if module can fit
  if (!compatibility.accepts.includes(moduleType)) {
    return 2; // Can't fit - heavy penalty
  }
  
  // If it's the preferred type, no penalty
  if (moduleType === compatibility.preferredType) {
    return 1;
  }
  
  // Otherwise use the defined multiplier
  return compatibility.bwMultiplier || 1.2;
}

/**
 * Get display color for a slot type
 */
export function getSlotColor(slotType: SlotType): string {
  switch (slotType) {
    case "Power": return "#3B82F6"; // Blue
    case "Ammo": return "#FB923C"; // Orange
    case "Utility": return "#10B981"; // Green
    case "Hybrid-PA": return "#8B5CF6"; // Purple (Power+Ammo)
    case "Hybrid-PU": return "#06B6D4"; // Cyan (Power+Utility)
    case "Hybrid-AU": return "#84CC16"; // Lime (Ammo+Utility)
    case "Hybrid-PAU": return "#EC4899"; // Pink (All three)
    case "Weapon": return "#DC2626"; // Red
    case "Engine": return "#F59E0B"; // Amber
    case "Shield": return "#0EA5E9"; // Sky blue
    case "Sensor": return "#14B8A6"; // Teal
    default: return "#6B7280"; // Gray for unknown
  }
}

/**
 * Get a human-readable name for a slot type
 */
export function getSlotDisplayName(slotType: SlotType): string {
  switch (slotType) {
    case "Hybrid-PA": return "Power/Ammo";
    case "Hybrid-PU": return "Power/Utility";
    case "Hybrid-AU": return "Ammo/Utility";
    case "Hybrid-PAU": return "Universal";
    default: return slotType;
  }
}

/**
 * Check if a slot is a hybrid type
 */
export function isHybridSlot(slotType: SlotType): boolean {
  return slotType.startsWith("Hybrid-");
}

/**
 * Get compatible module types for a slot
 */
export function getSlotAcceptedTypes(
  slotType: SlotType,
  slotCompatibility?: SlotCompatibility
): ModuleType[] {
  const definitions = getSlotDefinitionsSync();
  const compatibility = slotCompatibility || definitions[slotType];
  
  if (!compatibility) {
    // Assume it only accepts exact matches if unknown
    return [slotType as ModuleType];
  }
  
  return compatibility.accepts;
}
