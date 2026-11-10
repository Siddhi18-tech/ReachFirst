import { NextRequest, NextResponse } from "next/server";
import { parseInventory } from "@/lib/ai";
import { requireRole } from "@/lib/auth-guard";
import { z } from "zod";

const schema = z.object({ text: z.string().min(5).max(4000) });

export async function POST(req: NextRequest) {
  const guard = await requireRole(["ngo", "admin"]);
  if (guard) return guard;

  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Text must be between 5 and 4000 characters" }, { status: 400 });
    }

    const budget = await parseInventory(parsed.data.text);
    const items = budget.items.map((i) => ({
      ...i,
      item: i.name,
      unitCost: i.unitCostINR,
      totalCost: i.totalINR,
    }));

    return NextResponse.json({
      success: true,
      items,
      grandTotal: budget.totalINR,
      totalINR: budget.totalINR,
      warnings: budget.warnings,
    });
  } catch (err) {
    console.error("inventory-ai error:", err);
    return NextResponse.json({ error: "Failed to parse inventory" }, { status: 500 });
  }
}