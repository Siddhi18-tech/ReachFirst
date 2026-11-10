import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaigns } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth-guard";

// "closed" is accepted as an alias for "completed"
const bodySchema = z.object({
  status: z.enum(["active", "paused", "completed", "closed"]),
});

// POST /api/admin/campaigns/[id]/status  body: { status }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireRole("admin");
  if (denied) return denied;

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid campaign id" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
  }

  const status = parsed.data.status === "closed" ? "completed" : parsed.data.status;

  const [updated] = await db
    .update(campaigns)
    .set({ status, updatedAt: new Date() })
    .where(eq(campaigns.id, id))
    .returning({ id: campaigns.id });
  if (!updated) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    success: true,
    campaignId: id,
    status,
    message: `Campaign status updated to ${status}`,
  });
}