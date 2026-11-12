import { NextResponse } from "next/server";
import { eq, inArray, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaigns, disasters, donations, milestones, ngos, proofs } from "@/lib/db/schema";
import { requireRole, getSessionUser } from "@/lib/auth-guard";

export async function GET() {
  const guard = await requireRole(["donor", "admin"]);
  if (guard) return guard;
  const user = await getSessionUser();
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // All donations by this donor
    const donationRows = await db
      .select({ donation: donations, campaign: campaigns, ngo: ngos, disaster: disasters })
      .from(donations)
      .innerJoin(campaigns, eq(donations.campaignId, campaigns.id))
      .innerJoin(ngos,      eq(campaigns.ngoId,      ngos.id))
      .innerJoin(disasters, eq(campaigns.disasterId, disasters.id))
      .where(eq(donations.donorId, user.id))
      .orderBy(desc(donations.createdAt));

    const campaignIds = [...new Set(donationRows.map((r) => r.campaign.id))];

    const msRows = campaignIds.length
      ? await db
          .select({ campaignId: milestones.campaignId, status: milestones.status })
          .from(milestones)
          .where(inArray(milestones.campaignId, campaignIds))
      : [];

    const proofRows = campaignIds.length
      ? await db
          .select({ campaignId: proofs.campaignId, fileUrl: proofs.fileUrl, exifGps: proofs.exifGps })
          .from(proofs)
          .where(inArray(proofs.campaignId, campaignIds))
      : [];

    // Build lookup maps
    const msTotal   = new Map<string, number>();
    const msDone    = new Map<string, number>();
    for (const m of msRows) {
      msTotal.set(m.campaignId, (msTotal.get(m.campaignId) ?? 0) + 1);
      if (m.status === "paid") msDone.set(m.campaignId, (msDone.get(m.campaignId) ?? 0) + 1);
    }
    const proofsByCampaign = new Map<string, { fileUrl: string; lat?: number; lng?: number }[]>();
    for (const p of proofRows) {
      if (!p.exifGps) continue; // only include geotagged proofs in the map view
      const arr = proofsByCampaign.get(p.campaignId) ?? [];
      arr.push({ fileUrl: p.fileUrl, lat: p.exifGps.lat, lng: p.exifGps.lng });
      proofsByCampaign.set(p.campaignId, arr);
    }

    let totalDonatedINR = 0;
    let totalDonatedUSD = 0;

    const donationList = donationRows.map(({ donation, campaign, ngo, disaster }) => {
      const amountNum = Number(donation.amount);
      if (donation.currency === "USD") totalDonatedUSD += amountNum;
      else totalDonatedINR += amountNum;

      const escrowStatus: "pending" | "escrow" | "released" | "failed" =
        donation.status === "failed"    ? "failed"
        : donation.status === "pending" ? "pending"
        : (msDone.get(campaign.id) ?? 0) > 0 ? "released"
        : "escrow";

      return {
        donationId:  donation.id,
        amount:      amountNum,
        tipAmount:   Number(donation.tipAmount ?? 0),
        currency:    donation.currency,
        status:      escrowStatus,
        createdAt:   donation.createdAt.toISOString(),
        confirmedAt: donation.confirmedAt ? donation.confirmedAt.toISOString() : null,
        campaign: {
          id:     campaign.id,
          title:  campaign.title,
          raised: Number(campaign.raised),
          cap:    Number(campaign.cap ?? campaign.goal),
          goal:   Number(campaign.goal),
          status: campaign.status,
        },
        ngo: { id: ngo.id, name: ngo.name, badge: ngo.badge },
        disaster: { id: disaster.id, name: disaster.name, type: disaster.type, severity: disaster.severity },
        milestones: {
          total:     msTotal.get(campaign.id) ?? 0,
          completed: msDone.get(campaign.id)  ?? 0,
        },
        verifiedProofs: proofsByCampaign.get(campaign.id) ?? [],
      };
    });

    return NextResponse.json({
      totalDonatedINR,
      totalDonatedUSD,
      donationsCount: donationList.length,
      donations: donationList,
    });
  } catch (err) {
    console.error("GET /api/donor/impact", err);
    return NextResponse.json({ error: "Failed to load donor impact" }, { status: 500 });
  }
}
