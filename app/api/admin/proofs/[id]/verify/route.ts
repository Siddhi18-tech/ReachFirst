import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, asc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaigns, milestones, ngos, proofs } from "@/lib/db/schema";
import { getSessionUser, requireRole } from "@/lib/auth-guard";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireRole("admin");
  if (denied) return denied;

  const admin = await getSessionUser();
  if (!admin?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid proof id" }, { status: 400 });
  }

  let body: { action?: unknown; note?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // accept empty body for default approve
  }
  const action = (body.action ?? "approve") as string;
  const note = typeof body.note === "string" ? body.note.trim() : null;

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
  }

  const [proof] = await db.select().from(proofs).where(eq(proofs.id, id)).limit(1);
  if (!proof) return NextResponse.json({ error: "Proof not found" }, { status: 404 });

  if (action === "reject") {
    await db.update(proofs).set({ verified: false }).where(eq(proofs.id, id));
    return NextResponse.json({ ok: true, proofId: id, action: "rejected" });
  }

  // Idempotent: already verified means no second release
  if (proof.verified) {
    return NextResponse.json({
      ok: true,
      proofId: id,
      alreadyVerified: true,
      action: "already_verified",
      released: null,
    });
  }

  const [row] = await db
    .select({ raised: campaigns.raised, ngoStatus: ngos.status, ngoName: ngos.name })
    .from(campaigns)
    .innerJoin(ngos, eq(ngos.id, campaigns.ngoId))
    .where(eq(campaigns.id, proof.campaignId))
    .limit(1);
  if (!row) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  if (row.ngoStatus !== "approved") {
    return NextResponse.json({ error: "NGO is not approved" }, { status: 409 });
  }

  // Next unpaid milestone (oldest first)
  const [next] = await db
    .select()
    .from(milestones)
    .where(and(eq(milestones.campaignId, proof.campaignId), ne(milestones.status, "paid")))
    .orderBy(asc(milestones.createdAt), asc(milestones.id))
    .limit(1);

  if (next) {
    // Escrow invariant: never release more than has been raised
    const [paid] = await db
      .select({ total: sql<string>`coalesce(sum(${milestones.amount}), 0)` })
      .from(milestones)
      .where(and(eq(milestones.campaignId, proof.campaignId), eq(milestones.status, "paid")));
    if (Number(paid?.total ?? 0) + Number(next.amount) > Number(row.raised) + 0.005) {
      return NextResponse.json(
        { error: "Campaign has not raised enough to release this milestone" },
        { status: 409 }
      );
    }
  }

  const releaseNote = note ?? "Released on proof verification";

  // One atomic statement: verify proof, pay next milestone, record disbursement.
  // The WHERE verified = false guard makes a concurrent double-click a no-op.
  await db.execute(sql`
    WITH p AS (
      UPDATE proofs SET verified = true
      WHERE id = ${id}::uuid AND verified = false
      RETURNING campaign_id
    ),
    m AS (
      SELECT id FROM milestones
      WHERE campaign_id IN (SELECT campaign_id FROM p) AND status <> 'paid'
      ORDER BY created_at, id
      LIMIT 1
      FOR UPDATE
    ),
    upd AS (
      UPDATE milestones SET status = 'paid', approved_at = now()
      WHERE id IN (SELECT id FROM m)
      RETURNING id, campaign_id, amount
    ),
    ins AS (
      INSERT INTO escrow_disbursements (milestone_id, campaign_id, amount, released_by, note)
      SELECT id, campaign_id, amount, ${admin.id}::uuid, ${releaseNote}
      FROM upd
      RETURNING id
    )
    SELECT count(*) FROM ins
  `);

  let released: { milestoneId: string; title: string; amount: number } | null = null;
  if (next) {
    const [after] = await db.select().from(milestones).where(eq(milestones.id, next.id)).limit(1);
    if (after?.status === "paid") {
      released = { milestoneId: after.id, title: after.title, amount: Number(after.amount) };
    }
  }

  return NextResponse.json({
    ok: true,
    proofId: id,
    campaignId: proof.campaignId,
    alreadyVerified: false,
    action: "approved",
    released,
    milestoneReleased: released?.milestoneId ?? null,
    ngoName: row.ngoName ?? null,
  });
}
