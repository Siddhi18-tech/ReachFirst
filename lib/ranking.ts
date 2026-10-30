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
  scores: {
    proximityScore: number;    // max 40
    deliveryRateScore: number; // max 30
    fundNeedScore: number;     // max 20
    badgeScore: number;        // max 10
    totalScore: number;        // max 100
  };
  whyThisRank: string;
}

/**
 * Calculates priority score and ranking for NGOs responding to a disaster.
 * Turf.js is run server-side to calculate true geodesic distance.
 */
export function rankNgosForDisaster(
  disasterLat: number,
  disasterLng: number,
  ngosData: NgoRankingInput[]
): RankedNgo[] {
  const disasterPoint = point([disasterLng, disasterLat]);

  const scored = ngosData.map((item) => {
    // 1. Distance via Turf.js (geodesic distance in kilometers)
    const ngoPoint = point([item.baseLng, item.baseLat]);
    const dist = Math.round(distance(disasterPoint, ngoPoint, { units: "kilometers" }));

    // Proximity score (0 to 40 pts) - closer is higher
    // < 50km: 40pts, < 150km: 32pts, < 300km: 24pts, < 600km: 15pts, else: 8pts
    let proximityScore = 8;
    if (dist < 50) proximityScore = 40;
    else if (dist < 150) proximityScore = 32;
    else if (dist < 300) proximityScore = 24;
    else if (dist < 600) proximityScore = 15;

    // 2. Past delivery / verified proofs score (0 to 30 pts)
    const deliveryScore = Math.min(30, (item.verifiedProofsCount * 10) + (item.completedMilestonesCount * 5));

    // 3. Fund need / cap utilization score (0 to 20 pts)
    // Avoids over-concentrating donations. If < 50% raised, highest need.
    const utilization = item.cap > 0 ? (item.raised / item.cap) : (item.raised / (item.goal || 100000));
    let fundNeedScore = 20;
    if (utilization >= 0.95) fundNeedScore = 2; // nearly full cap
    else if (utilization >= 0.75) fundNeedScore = 8;
    else if (utilization >= 0.5) fundNeedScore = 14;
    else fundNeedScore = 20;

    // 4. Badge score (0 to 10 pts)
    const badgeScore = item.badge === "govt" ? 10 : 6;

    const totalScore = Math.min(100, proximityScore + deliveryScore + fundNeedScore + badgeScore);

    // Rule-based deterministic explanation
    const whyThisRank = `${item.badge === "govt" ? "Government Accredited" : "Platform Verified"} NGO stationed ${dist} km from crisis epicenter. Has ${item.verifiedProofsCount} verified field deliveries on record with ${Math.round(utilization * 100)}% campaign cap utilization.`;

    return {
      ngoId: item.ngoId,
      ngoName: item.ngoName,
      badge: item.badge,
      campaignId: item.campaignId,
      campaignTitle: item.campaignTitle,
      goal: item.goal,
      cap: item.cap,
      raised: item.raised,
      distanceKm: dist,
      scores: {
        proximityScore,
        deliveryRateScore: deliveryScore,
        fundNeedScore,
        badgeScore,
        totalScore,
      },
      whyThisRank,
    };
  });

  // Sort descending by totalScore (closest and most verified first)
  return scored.sort((a, b) => b.scores.totalScore - a.scores.totalScore);
}
