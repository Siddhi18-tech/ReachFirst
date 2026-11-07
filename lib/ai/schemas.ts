import { z } from "zod";

export const InventoryItem = z.object({
  name: z.string(),
  category: z.enum(["food", "water", "medical", "shelter", "clothing", "hygiene", "logistics", "other"]),
  quantity: z.number().positive(),
  unit: z.string(),
  unitCostINR: z.number().nonnegative(),
  totalINR: z.number().nonnegative(),
});

export const InventoryBudget = z.object({
  items: z.array(InventoryItem),
  totalINR: z.number().nonnegative(),
  warnings: z.array(z.string()),
});
export type InventoryBudget = z.infer<typeof InventoryBudget>;

export type RankExplainInput = {
  ngoName: string; rank: number; totalNgos: number; score: number;
  distanceKm: number; deliveryRatePct: number; capUtilizationPct: number;
  badge: "GOVT" | "PLATFORM" | "NONE";
  breakdown: { proximity: number; delivery: number; capUtilization: number; badgeBonus: number };
};