import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaigns, milestones, ngos, proofs } from "@/lib/db/schema";
import { requireRole, getSessionUser } from "@/lib/auth-guard";

const UUID = /^[0-9a-f-]{36}$/i;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireRole("admin");
  if (guard) return guard;
  const admin = await getSessionUser();
  if (!admin?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Invalid proof id" }, { status: 400 });

  let body: { action?: unknown; note?: unknown } = {};
  try { body = await req.json(); } catch { /* accept empty body for approve */ }
  const action = (body.action ?? "approve") as string;
  const note   = typeof body.note === "string" ? body.note.trim() : null;

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
  }

  try {
    const [proof] = await db.select().from(proofs).where(eq(proofs.id, id)).limit(1);
    if (!proof) return NextResponse.json({ error: "Proof not found" }, { status: 404 });

    if (action === "reject") {
      await db.update(proofs).set({ verified: false }).where(eq(proofs.id, id));
      return NextResponse.json({ ok: true, proofId: id, action: "rejected" });
    }

    // ── approve ───────────────────────────────────────────────────────────────
    if (proof.verified) return NextResponse.json({ ok: true, proofId: id, action: "already_verified" });

    // Mark proof verified
    await db.update(proofs).set({ verified: true }).where(eq(proofs.id, id));

    // Find the first pending milestone for this campaign and auto-approve it.
    // This triggers the escrow release for that milestone.
    const [pendingMs] = await db
      .select()
      .from(milestones)
      .where(eq(milestones.campaignId, proof.campaignId))
      .orderBy(milestones.createdAt)
      .limit(1);

    if (pendingMs && pendingMs.status === "pending") {
      // Approve milestone and record escrow disbursement atomically
      await db.execute(sql`
        WITH approved AS (
          UPDATE milestones
          SET status      = 'paid',
              approved_at = now()
          WHERE id = ${pendingMs.id}
            AND status = 'pending'
          RETURNING id, campaign_id, amount
        )
        INSERT INTO escrow_disbursements (id, milestone_id, campaign_id, amount, released_by, note, released_at)
        SELECT
          gen_random_uuid(),
          approved.id,
          approved.campaign_id,
          approved.amount,
          ${admin.id}::uuid,
          ${note ?? "Proof verified by admin"},
          now()
        FROM approved
      `);
    }

    // Load the NGO name for the response
    const [camp] = await db
      .select({ ngoName: ngos.name })
      .from(campaigns)
      .innerJoin(ngos, eq(campaigns.ngoId, ngos.id))
      .where(eq(campaigns.id, proof.campaignId))
      .limit(1);

    return NextResponse.json({
      ok:               true,
      proofId:          id,
      campaignId:       proof.campaignId,
      action:           "approved",
      milestoneReleased: pendingMs?.status === "pending" ? pendingMs.id : null,
      ngoName:           camp?.ngoName ?? null,
    });
  } catch (err) {
    console.error("POST /api/admin/proofs/[id]/verify", err);
    return NextResponse.json({ error: "Failed to process proof verification" }, { status: 500 });
  }
}
