import { NextResponse } from "next/server";
import { eq, inArray, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaigns, disasters, milestones, ngos, proofs } from "@/lib/db/schema";
import { requireRole, getSessionUser } from "@/lib/auth-guard";

export async function GET() {
  const guard = await requireRole(["ngo", "admin"]);
  if (guard) return guard;
  const user = await getSessionUser();
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [ngo] = await db.select().from(ngos).where(eq(ngos.userId, user.id)).limit(1);
    if (!ngo) return NextResponse.json({ error: "NGO profile not found" }, { status: 404 });

    const campaignRows = await db
      .select({ campaign: campaigns, disaster: disasters })
      .from(campaigns)
      .innerJoin(disasters, eq(campaigns.disasterId, disasters.id))
      .where(eq(campaigns.ngoId, ngo.id))
      .orderBy(desc(campaigns.createdAt));

    const campaignIds = campaignRows.map((r) => r.campaign.id);

    const msRows = campaignIds.length
      ? await db
          .select({
            campaignId: milestones.campaignId,
            title:      milestones.title,
            amount:     milestones.amount,
            status:     milestones.status,
            approvedAt: milestones.approvedAt,
          })
          .from(milestones)
          .where(inArray(milestones.campaignId, campaignIds))
      : [];

    const proofRows = campaignIds.length
      ? await db
          .select({
            id:         proofs.id,
            campaignId: proofs.campaignId,
            fileUrl:    proofs.fileUrl,
            caption:    proofs.caption,
            verified:   proofs.verified,
            createdAt:  proofs.createdAt,
            exifGps:    proofs.exifGps,
          })
          .from(proofs)
          .where(inArray(proofs.campaignId, campaignIds))
          .orderBy(desc(proofs.createdAt))
      : [];

    // Build per-campaign lookups
    const msMap    = new Map<string, typeof msRows>();
    const proofMap = new Map<string, typeof proofRows>();
    for (const m of msRows) {
      const arr = msMap.get(m.campaignId) ?? [];
      arr.push(m);
      msMap.set(m.campaignId, arr);
    }
    for (const p of proofRows) {
      const arr = proofMap.get(p.campaignId) ?? [];
      arr.push(p);
      proofMap.set(p.campaignId, arr);
    }

    const campaignDetails = campaignRows.map(({ campaign, disaster }) => ({
      id:          campaign.id,
      title:       campaign.title,
      description: campaign.description,
      goal:        Number(campaign.goal),
      cap:         Number(campaign.cap ?? campaign.goal),
      raised:      Number(campaign.raised),
      status:      campaign.status,
      createdAt:   campaign.createdAt.toISOString(),
      disaster: {
        id:       disaster.id,
        name:     disaster.name,
        type:     disaster.type,
        severity: disaster.severity,
      },
      milestones: (msMap.get(campaign.id) ?? []).map((m) => ({
        title:      m.title,
        amount:     Number(m.amount),
        status:     m.status,
        approvedAt: m.approvedAt ? m.approvedAt.toISOString() : null,
      })),
      proofs: (proofMap.get(campaign.id) ?? []).map((p) => ({
        id:         p.id,
        fileUrl:    p.fileUrl,
        caption:    p.caption,
        verified:   p.verified,
        lat:        p.exifGps?.lat,
        lng:        p.exifGps?.lng,
        uploadedAt: p.createdAt.toISOString(),
      })),
    }));

    return NextResponse.json({
      ngo: {
        id:                 ngo.id,
        name:               ngo.name,
        registrationNumber: ngo.registrationNumber,
        description:        ngo.description,
        badge:              ngo.badge,
        status:             ngo.status,
        rejectionReason:    ngo.rejectionReason,
        baseLat:            ngo.baseLat !== null ? Number(ngo.baseLat) : null,
        baseLng:            ngo.baseLng !== null ? Number(ngo.baseLng) : null,
        address:            ngo.address,
        website:            ngo.website,
        phone:              ngo.phone,
      },
      campaigns: campaignDetails,
    });
  } catch (err) {
    console.error("GET /api/ngo/profile", err);
    return NextResponse.json({ error: "Failed to load NGO profile" }, { status: 500 });
  }
}
