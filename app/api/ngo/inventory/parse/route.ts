import { NextRequest, NextResponse } from "next/server";
import { parseInventory } from "@/lib/ai";
import { z } from "zod";

const schema = z.object({ text: z.string().min(3).max(4000) });

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Text must be between 3 and 4000 characters" },
        { status: 400 }
      );
    }

    if (USE_MOCK) {
      const { mockInventoryBudget } = await import("@/lib/mock/data");
      return NextResponse.json({
        success: true,
        items: mockInventoryBudget.items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          unitCost: i.unitCostINR,
          unitCostINR: i.unitCostINR,
          total: i.totalINR,
          totalINR: i.totalINR,
          category: i.category,
        })),
        totalINR: mockInventoryBudget.totalINR,
        grandTotal: mockInventoryBudget.totalINR,
        warnings: mockInventoryBudget.warnings,
      });
    }

    const budget = await parseInventory(parsed.data.text);
    const items = budget.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unit: i.unit,
      unitCost: i.unitCostINR,
      unitCostINR: i.unitCostINR,
      total: i.totalINR,
      totalINR: i.totalINR,
      category: i.category,
    }));

    return NextResponse.json({
      success: true,
      items,
      totalINR: budget.totalINR,
      grandTotal: budget.totalINR,
      warnings: budget.warnings,
    });
  } catch (err) {
    console.warn("Inventory parse error, falling back to mock:", err);
    const { mockInventoryBudget } = await import("@/lib/mock/data");
    return NextResponse.json({
      success: true,
      items: mockInventoryBudget.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        unitCost: i.unitCostINR,
        unitCostINR: i.unitCostINR,
        total: i.totalINR,
        totalINR: i.totalINR,
        category: i.category,
      })),
      totalINR: mockInventoryBudget.totalINR,
      grandTotal: mockInventoryBudget.totalINR,
      warnings: mockInventoryBudget.warnings,
    });
  }
}

