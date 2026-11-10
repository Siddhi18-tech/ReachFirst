import distance from "@turf/distance";
import { point } from "@turf/helpers";

export interface NgoRankingInput {
  ngoId: string;
  ngoName: string;
  badge: "govt" | "platform";
  baseLat: number;
  baseLng: number;
  campaignId: string;
  campaignTitle: string;
  goal: number;
  cap: number;
  raised: number;
  verifiedProofsCount: number;
  completedMilestonesCount: number;
  totalMilestonesCount?: number;
}

export interface RankedNgo {
  ngoId: string;
  ngoName: string;
  badge: "govt" | "platform";
  campaignId: string;
  campaignTitle: string;
  goal: number;
  cap: number;
  raised: number;
  distanceKm: number;
  score: number;
  breakdown: { proximity: number; delivery: number; capUtilization: number; badgeBonus: number };
  scores: {
    proximityScore: number;
    deliveryRateScore: number;
    fundNeedScore: number;
    badgeScore: number;
    totalScore: number;
  };
  whyThisRank: string;
}

/** Spec: proximity 40, delivery 30, cap utilization 20, badge +10 govt / +6 platform. */
export function rankNgosForDisaster(
  disasterLat: number,
  disasterLng: number,
  ngosData: NgoRankingInput[]
): RankedNgo[] {
  const disasterPoint = point([disasterLng, disasterLat]);

  const scored = ngosData.map((item) => {
    const dist = distance(disasterPoint, point([item.baseLng, item.baseLat]), { units: "kilometers" });

    const proximity = Math.round(40 * Math.max(0, 1 - dist / 500));

    const total = item.totalMilestonesCount ?? 0;
    const deliveryRate = total > 0
      ? item.completedMilestonesCount / total
      : Math.min(1, item.verifiedProofsCount / 3);
    const delivery = Math.round(30 * Math.min(1, Math.max(0, deliveryRate)));

    const capBase = item.cap > 0 ? item.cap : item.goal > 0 ? item.goal : 100000;
    const utilization = Math.min(1, Math.max(0, item.raised / capBase));
    const capUtilization = Math.round(20 * (1 - utilization));

    const badgeBonus = item.badge === "govt" ? 10 : 6;
    const totalScore = Math.min(100, proximity + delivery + capUtilization + badgeBonus);

    const whyThisRank = `${item.badge === "govt" ? "Government Accredited" : "Platform Verified"} NGO stationed ${Math.round(dist)} km from the crisis epicenter. ${item.verifiedProofsCount} verified field deliveries on record, ${Math.round(utilization * 100)}% of campaign cap used.`;

    return {
      ngoId: item.ngoId,
      ngoName: item.ngoName,
      badge: item.badge,
      campaignId: item.campaignId,
      campaignTitle: item.campaignTitle,
      goal: item.goal,
      cap: item.cap,
      raised: item.raised,
      distanceKm: Math.round(dist),
      score: totalScore,
      breakdown: { proximity, delivery, capUtilization, badgeBonus },
      scores: {
        proximityScore: proximity,
        deliveryRateScore: delivery,
        fundNeedScore: capUtilization,
        badgeScore: badgeBonus,
        totalScore,
      },
      whyThisRank,
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}