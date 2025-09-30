import { prisma } from "@/lib/prisma";
import type { SlotType } from "@/types/fitting";

// Cache for slot colors
let slotColorsCache: Record<string, string> | null = null;
let colorCacheTimestamp = 0;
const CACHE_DURATION = 60000; // 1 minute cache

// Default colors as fallback
const DEFAULT_SLOT_COLORS: Record<string, string> = {
  // Base types
  Power: "#1E90FF",     // Blue
  Ammo: "#FF8C00",      // Orange
  Utility: "#32CD32",   // Green
  
  // Hybrid types
  "Hybrid-PA": "#8B5CF6",    // Purple (Power+Ammo)
  "Hybrid-PU": "#06B6D4",    // Cyan (Power+Utility)
  "Hybrid-AU": "#84CC16",    // Lime (Ammo+Utility)
  "Hybrid-PAU": "#EC4899",   // Pink (All three)
};

/**
 * Load slot colors from database
 */
export async function loadSlotColors(): Promise<Record<string, string>> {
  try {
    const slots = await prisma.customSlotType.findMany({
      where: { isActive: true },
      select: { id: true, color: true }
    });
    
    const colors: Record<string, string> = {};
    
    for (const slot of slots) {
      colors[slot.id] = slot.color;
    }
    
    // Cache the results
    slotColorsCache = colors;
    colorCacheTimestamp = Date.now();
    
    return colors;
  } catch (error) {
    console.error("Failed to load slot colors from database:", error);
    return DEFAULT_SLOT_COLORS;
  }
}

/**
 * Get slot colors with caching
 */
export async function getSlotColors(): Promise<Record<string, string>> {
  // Check if cache is still valid
  if (slotColorsCache && Date.now() - colorCacheTimestamp < CACHE_DURATION) {
    return slotColorsCache;
  }
  
  // Load from database
  return await loadSlotColors();
}

/**
 * Get slot colors synchronously (uses cache or defaults)
 */
export function getSlotColorsSync(): Record<string, string> {
  if (slotColorsCache) {
    return slotColorsCache;
  }
  return DEFAULT_SLOT_COLORS;
}

/**
 * Get color for a specific slot type
 */
export function getSlotColorSync(slotType: SlotType): string {
  const colors = getSlotColorsSync();
  return colors[slotType] || "#6B7280"; // Gray fallback for unknown
}
