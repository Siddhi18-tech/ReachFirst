import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaigns, donations, milestones, ngos, proofs } from "@/lib/db/schema";
import type { ProofItem } from "@/types/api";

export async function GET() {
  try {
    const [donationAgg, proofAgg, releasedAgg, campaignAgg, proofRows, paidRows] = await Promise.all([
      db
        .select({
          totalInr: sql<string>`coalesce(sum(case when ${donations.currency} = 'USD' then ${donations.amount} * 83 else ${donations.amount} end), 0)`,
          donationCount: sql<number>`count(*)::int`,
          donorCount: sql<number>`count(distinct ${donations.donorId})::int`,
        })
        .from(donations)
        .where(eq(donations.status, "confirmed")),
      db.select({ n: sql<number>`count(*)::int` }).from(proofs).where(eq(proofs.verified, true)),
      db
        .select({ total: sql<string>`coalesce(sum(${milestones.amount}), 0)` })
        .from(milestones)
        .where(eq(milestones.status, "paid")),
      db.select({ n: sql<number>`count(*)::int` }).from(campaigns).where(eq(campaigns.status, "active")),
      db
        .select({
          id: proofs.id,
          fileUrl: proofs.fileUrl,
          gps: proofs.exifGps,
          takenAt: proofs.exifTime,
          ngoName: ngos.name,
        })
        .from(proofs)
        .innerJoin(campaigns, eq(proofs.campaignId, campaigns.id))
        .innerJoin(ngos, eq(campaigns.ngoId, ngos.id))
        .where(eq(proofs.verified, true))
        .orderBy(desc(proofs.createdAt))
        .limit(24),
      db
        .select({
          id: milestones.id,
          title: milestones.title,
          amount: milestones.amount,
          approvedAt: milestones.approvedAt,
          payoutId: milestones.payoutId,
          campaignTitle: campaigns.title,
          ngoName: ngos.name,
        })
        .from(milestones)
        .innerJoin(campaigns, eq(milestones.campaignId, campaigns.id))
        .innerJoin(ngos, eq(campaigns.ngoId, ngos.id))
        .where(eq(milestones.status, "paid"))
        .orderBy(sql`${milestones.approvedAt} desc nulls last`)
        .limit(20),
    ]);

    const proofsOut: ProofItem[] = proofRows.map((p) => ({
      id: p.id,
      imageUrl: p.fileUrl,
      lat: p.gps?.lat,
      lng: p.gps?.lng,
      takenAt: p.takenAt ? p.takenAt.toISOString() : undefined,
      ngoName: p.ngoName,
      verified: true,
    }));

    const disbursements = paidRows.map((m) => ({
      id: m.id,
      ngoName: m.ngoName,
      campaignTitle: m.campaignTitle,
      milestone: m.title,
      amount: Number(m.amount),
      releasedAt: m.approvedAt ? m.approvedAt.toISOString() : null,
      payoutId: m.payoutId,
    }));

    return NextResponse.json({
      metrics: {
        totalDonated: Number(donationAgg[0]?.totalInr ?? 0),
        donationCount: donationAgg[0]?.donationCount ?? 0,
        donorCount: donationAgg[0]?.donorCount ?? 0,
        verifiedProofs: proofAgg[0]?.n ?? 0,
        fundsReleased: Number(releasedAgg[0]?.total ?? 0),
        activeCampaigns: campaignAgg[0]?.n ?? 0,
      },
      proofs: proofsOut,
      disbursements,
    });
  } catch (err) {
    console.error("GET /api/transparency", err);
    return NextResponse.json({ error: "Failed to load transparency data" }, { status: 500 });
  }
}