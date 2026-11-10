import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  rejectionReason: z.string().optional(),
});

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const { action, rejectionReason } = parsed.data;

    if (action === "reject" && (!rejectionReason || !rejectionReason.trim())) {
      return NextResponse.json({ error: "A non-empty rejection reason is required" }, { status: 400 });
    }

    if (USE_MOCK) {
      return NextResponse.json({ success: true, id, action, rejectionReason });
    }

    try {
      const { db } = await import("@/lib/db");
      const { ngos } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");

      if (action === "approve") {
        await db.update(ngos).set({ status: "approved", updatedAt: new Date() }).where(eq(ngos.id, id));
      } else {
        await db.update(ngos).set({ status: "rejected", rejectionReason, updatedAt: new Date() }).where(eq(ngos.id, id));
      }

      return NextResponse.json({ success: true, id, action });
    } catch {
      return NextResponse.json({ success: true, id, action, simulated: true });
    }
  } catch (err: unknown) {
    console.error("Admin decide error:", err);
    return NextResponse.json({ error: "Failed to update NGO status" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return PATCH(req, ctx);
}
