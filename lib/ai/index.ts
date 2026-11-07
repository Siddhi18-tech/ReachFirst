import type { RankExplainInput } from "./schemas";
export type { InventoryBudget, RankExplainInput } from "./schemas";
export { parseInventory } from "./inventory";

export async function explainRank(input: RankExplainInput): Promise<string> {
  return `Ranked #${input.rank} of ${input.totalNgos} with a score of ${input.score}.`;
}