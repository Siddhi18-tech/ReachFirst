import { NextRequest, NextResponse } from "next/server";
import { parseInventoryText } from "@/lib/gemini";
import { requireRole } from "@/lib/auth-guard";
import { z } from "zod";

const schema = z.object({
  text: z.string().min(5),
});

export async function POST(req: NextRequest) {
  const guard = await requireRole(["ngo", "admin"]);
  if (guard) return guard;

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Text must be at least 5 characters" }, { status: 400 });
    }

    const items = await parseInventoryText(parsed.data.text);
    const grandTotal = items.reduce((acc, curr) => acc + curr.totalCost, 0);

    return NextResponse.json({
      success: true,
      items,
      grandTotal,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to parse inventory" }, { status: 500 });
  }
}
