import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaigns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth-guard";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["active", "paused", "completed"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireRole("admin");
  if (guard) return guard;

  try {
    const { id: campaignId } = await params;
    const body = await req.json();
    const parsed = statusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const { status } = parsed.data;

    const [updated] = await db.update(campaigns)
      .set({ status, updatedAt: new Date() })
      .where(eq(campaigns.id, campaignId))
      .returning({ id: campaigns.id });
    if (!updated) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    return NextResponse.json({
      success: true,
      campaignId,
      status,
      message: `Campaign status updated to ${status}`,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update campaign status" }, { status: 500 });
  }
}
