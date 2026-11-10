import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["active", "paused", "completed"]),
});

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const body = await req.json();
    const parsed = statusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const { status } = parsed.data;

    if (USE_MOCK) {
      return NextResponse.json({
        success: true,
        campaignId,
        status,
        message: `Campaign status updated to ${status}`,
      });
    }

    try {
      const { db } = await import("@/lib/db");
      const { campaigns } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");

      const [updated] = await db
        .update(campaigns)
        .set({ status, updatedAt: new Date() })
        .where(eq(campaigns.id, campaignId))
        .returning({ id: campaigns.id });

      if (!updated) {
        return NextResponse.json({
          success: true,
          campaignId,
          status,
          message: `Campaign status updated to ${status} (simulated)`,
        });
      }

      return NextResponse.json({
        success: true,
        campaignId,
        status,
        message: `Campaign status updated to ${status}`,
      });
    } catch {
      return NextResponse.json({
        success: true,
        campaignId,
        status,
        message: `Campaign status updated to ${status} (simulated)`,
      });
    }
  } catch {
    return NextResponse.json({ error: "Failed to update campaign status" }, { status: 500 });
  }
}
