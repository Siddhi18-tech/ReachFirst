import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ngos } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth-guard";

const bodySchema = z.object({
  decision: z.enum(["approve", "approved", "reject", "rejected"]),
  reason: z.string().trim().min(1).max(500).optional(),
});

// POST /api/admin/applications/[id]/decision  body: { decision, reason? }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireRole("admin");
  if (denied) return denied;

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid application id" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const approve = parsed.data.decision.startsWith("approve");
  const reason = parsed.data.reason;
  if (!approve && !reason) {
    return NextResponse.json({ error: "Rejection reason required" }, { status: 400 });
  }

  const [ngo] = await db.select({ id: ngos.id }).from(ngos).where(eq(ngos.id, id)).limit(1);
  if (!ngo) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const status = approve ? "approved" : "rejected";
  await db
    .update(ngos)
    .set({
      status,
      rejectionReason: approve ? null : reason,
      updatedAt: new Date(),
    })
    .where(eq(ngos.id, id));

  return NextResponse.json({ ok: true, id, decision: status, status });
}