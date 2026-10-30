import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-guard";
import { z } from "zod";

const reportSchema = z.object({
  reason: z.string().min(5).max(500),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const body = await req.json();
    const parsed = reportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid report reason" }, { status: 400 });
    }

    const user = await getSessionUser();

    await db.insert(reports).values({
      campaignId,
      donorId: user?.id || null,
      reason: parsed.data.reason,
    });

    return NextResponse.json({
      success: true,
      message: "Report submitted for admin investigation",
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
