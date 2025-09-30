import type { SlotType } from "@/types/fitting";
import { getSlotColorSync } from "@/lib/slotColors";

// Re-export the function with the same name for compatibility
export function getSlotColor(slotType: SlotType): string {
  return getSlotColorSync(slotType);
}

// Export default colors for backward compatibility
export const SLOT_COLORS: Record<string, string> = {
  // Base types
  Power: "#1E90FF",     // Blue
  Ammo: "#FF8C00",      // Orange
  Utility: "#32CD32",   // Green
  
  // Hybrid types
  "Hybrid-PA": "#8B5CF6",    // Purple (Power+Ammo)
  "Hybrid-PU": "#06B6D4",    // Cyan (Power+Utility)
  "Hybrid-AU": "#84CC16",    // Lime (Ammo+Utility)
  "Hybrid-PAU": "#EC4899",   // Pink (All three)
} as const;

