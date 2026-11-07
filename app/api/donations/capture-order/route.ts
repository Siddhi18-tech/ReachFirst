import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, getSessionUser } from "@/lib/auth-guard";
import { captureOrder } from "@/lib/capture";
import { buildDonationSummary } from "@/lib/donation-summary";

const schema = z.object({ orderId: z.string().min(1).max(128) });

export async function POST(req: NextRequest) {
  const guard = await requireRole(["donor", "admin"]);
  if (guard) return guard;
  const user = await getSessionUser();
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });

  try {
    const result = await captureOrder(parsed.data.orderId, { id: user.id, role: user.role });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const summary = await buildDonationSummary(result.donationId);
    return NextResponse.json({
      success: true,
      orderId: parsed.data.orderId,
      status: "confirmed",
      donationId: result.donationId,
      summary,
    });
  } catch (error) {
    console.error("Capture order error:", error);
    return NextResponse.json({ error: "Failed to capture donation" }, { status: 500 });
  }
}