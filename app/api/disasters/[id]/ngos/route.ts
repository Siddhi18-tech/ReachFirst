import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaigns, disasters, milestones, ngos, proofs } from "@/lib/db/schema";
import { rankNgosForDisaster, type NgoRankingInput } from "@/lib/ranking";
import type { RankedNgo } from "@/types/api";
import { explainRank } from "@/lib/ai";

const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Invalid disaster id" }, { status: 400 });

  try {
    const [d] = await db.select().from(disasters).where(eq(disasters.id, id)).limit(1);
    if (!d) return NextResponse.json({ error: "Disaster not found" }, { status: 404 });

    const rows = await db
      .select({ ngo: ngos, campaign: campaigns })
      .from(campaigns)
      .innerJoin(ngos, eq(campaigns.ngoId, ngos.id))
      .where(and(eq(campaigns.disasterId, id), eq(campaigns.status, "active"), eq(ngos.status, "approved")));

    const usable = rows.filter((r) => r.ngo.baseLat !== null && r.ngo.baseLng !== null);
    const ids = usable.map((r) => r.campaign.id);

    const proofRows = ids.length
      ? await db.select({ campaignId: proofs.campaignId }).from(proofs)
          .where(and(inArray(proofs.campaignId, ids), eq(proofs.verified, true)))
      : [];
    const msRows = ids.length
      ? await db.select({ campaignId: milestones.campaignId, status: milestones.status })
          .from(milestones).where(inArray(milestones.campaignId, ids))
      : [];

    const proofCount = new Map<string, number>();
    for (const p of proofRows) proofCount.set(p.campaignId, (proofCount.get(p.campaignId) ?? 0) + 1);
    const msTotal = new Map<string, number>();
    const msDone = new Map<string, number>();
    for (const m of msRows) {
      msTotal.set(m.campaignId, (msTotal.get(m.campaignId) ?? 0) + 1);
      if (m.status === "paid") msDone.set(m.campaignId, (msDone.get(m.campaignId) ?? 0) + 1);
    }

    const inputs: NgoRankingInput[] = usable.map(({ ngo, campaign }) => ({
      ngoId: ngo.id,
      ngoName: ngo.name,
      badge: ngo.badge,
      baseLat: Number(ngo.baseLat),
      baseLng: Number(ngo.baseLng),
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      goal: Number(campaign.goal),
      cap: Number(campaign.cap ?? campaign.goal),
      raised: Number(campaign.raised),
      verifiedProofsCount: proofCount.get(campaign.id) ?? 0,
      completedMilestonesCount: msDone.get(campaign.id) ?? 0,
      totalMilestonesCount: msTotal.get(campaign.id) ?? 0,
    }));

    const ranked = rankNgosForDisaster(Number(d.centerLat), Number(d.centerLng), inputs);

        const result: RankedNgo[] = await Promise.all(
      ranked.map(async (r, i) => ({
        ngoId: r.ngoId,
        name: r.ngoName,
        badge: (r.badge === "govt" ? "GOVT" : "PLATFORM") as "GOVT" | "PLATFORM",
        score: r.score,
        breakdown: r.breakdown,
        distanceKm: r.distanceKm,
        campaignId: r.campaignId,
        raised: r.raised,
        cap: r.cap,
        whyThisRank: await explainRank({
          ngoName: r.ngoName,
          rank: i + 1,
          totalNgos: ranked.length,
          score: r.score,
          distanceKm: r.distanceKm,
          deliveryRatePct: Math.round((r.breakdown.delivery / 30) * 100),
          capUtilizationPct: r.cap > 0 ? Math.min(100, Math.round((r.raised / r.cap) * 100)) : 0,
          badge: r.badge === "govt" ? "GOVT" : "PLATFORM",
          breakdown: r.breakdown,
        }),
      }))
    );

    return NextResponse.json(result);
  } catch (err) {
    console.warn(`GET /api/disasters/${id}/ngos fallback to mockRankedNgos:`, err);
    const { mockRankedNgos } = await import("@/lib/mock/data");
    return NextResponse.json(mockRankedNgos);
  }
}