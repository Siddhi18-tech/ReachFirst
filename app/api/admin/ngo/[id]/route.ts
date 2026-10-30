import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ngos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth-guard";
import { z } from "zod";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  rejectionReason: z.string().optional(),
});

// PATCH /api/admin/ngo/[id] — approve or reject
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireRole("admin");
  if (guard) return guard;

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { action, rejectionReason } = parsed.data;

  const [ngo] = await db.select({ id: ngos.id }).from(ngos).where(eq(ngos.id, id)).limit(1);
  if (!ngo) {
    return NextResponse.json({ error: "NGO not found" }, { status: 404 });
  }

  if (action === "approve") {
    await db.update(ngos).set({ status: "approved", updatedAt: new Date() }).where(eq(ngos.id, id));
  } else {
    if (!rejectionReason) {
      return NextResponse.json({ error: "Rejection reason required" }, { status: 400 });
    }
    await db.update(ngos).set({ status: "rejected", rejectionReason, updatedAt: new Date() }).where(eq(ngos.id, id));
  }

  return NextResponse.json({ success: true, action });
}

// GET /api/admin/ngo/[id] — get single NGO details
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireRole("admin");
  if (guard) return guard;

  const { id } = await params;
  const [ngo] = await db.select().from(ngos).where(eq(ngos.id, id)).limit(1);
  if (!ngo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ngo });
}
