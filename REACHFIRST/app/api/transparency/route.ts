import { NextResponse } from "next/server";
import { mockTransparency } from "@/lib/mock/data";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export async function GET() {
  if (USE_MOCK) {
    return NextResponse.json(mockTransparency);
  }

  try {
    const { desc, eq, sql } = await import("drizzle-orm");
    const { db } = await import("@/lib/db");
    const { campaigns, donations, milestones, ngos, proofs } = await import("@/lib/db/schema");

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

    const proofsOut = proofRows.map((p) => ({
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
      milestoneTitle: m.title,
      amount: Number(m.amount),
      amountINR: Number(m.amount),
      releasedAt: m.approvedAt ? m.approvedAt.toISOString() : null,
      payoutId: m.payoutId,
    }));

    return NextResponse.json({
      metrics: {
        totalDonated: Number(donationAgg[0]?.totalInr ?? mockTransparency.metrics.totalDonated),
        totalRaisedINR: Number(donationAgg[0]?.totalInr ?? mockTransparency.metrics.totalRaisedINR),
        donationCount: donationAgg[0]?.donationCount ?? mockTransparency.metrics.donationCount,
        donorCount: donationAgg[0]?.donorCount ?? mockTransparency.metrics.donorCount,
        verifiedProofs: proofAgg[0]?.n ?? mockTransparency.metrics.verifiedProofs,
        fundsReleased: Number(releasedAgg[0]?.total ?? mockTransparency.metrics.fundsReleased),
        activeCampaigns: campaignAgg[0]?.n ?? mockTransparency.metrics.activeCampaigns,
      },
      proofs: proofsOut.length > 0 ? proofsOut : mockTransparency.proofs,
      disbursements: disbursements.length > 0 ? disbursements : mockTransparency.disbursements,
    });
  } catch {
    return NextResponse.json(mockTransparency);
  }
}
