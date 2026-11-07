import type { InventoryBudget, RankExplainInput } from "./schemas";
export type { InventoryBudget, RankExplainInput } from "./schemas";

export async function parseInventory(_text: string): Promise<InventoryBudget> {
  return {
    items: [
      { name: "Rice", category: "food", quantity: 500, unit: "kg", unitCostINR: 60, totalINR: 30000 },
    ],
    totalINR: 30000,
    warnings: ["Stub data: real parser not wired yet"],
  };
}

export async function explainRank(input: RankExplainInput): Promise<string> {
  return `Ranked #${input.rank} of ${input.totalNgos} with a score of ${input.score}.`;
}