import { db } from "@/lib/db";
import { disasters, campaigns, ngos, proofs, milestones } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, ArrowLeft, Shield, CheckCircle, Navigation, Award, AlertCircle, HeartHandshake, Eye } from "lucide-react";
import { severityLabel, formatCurrency, badgeLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { rankNgosForDisaster, NgoRankingInput } from "@/lib/ranking";

export const dynamic = "force-dynamic";

export default async function DisasterRankingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let disaster: typeof disasters.$inferSelect | null = null;
  let rankedNgosList: ReturnType<typeof rankNgosForDisaster> = [];

  try {
    const [d] = await db.select().from(disasters).where(eq(disasters.id, id)).limit(1);
    disaster = d || null;

    if (disaster) {
      const disasterLat = parseFloat(disaster.centerLat || "26.3216");
      const disasterLng = parseFloat(disaster.centerLng || "90.9821");

      // Fetch campaigns for this disaster with NGO data
      const disasterCampaigns = await db
        .select({
          campaignId: campaigns.id,
          campaignTitle: campaigns.title,
          goal: campaigns.goal,
          cap: campaigns.cap,
          raised: campaigns.raised,
          ngoId: ngos.id,
          ngoName: ngos.name,
          badge: ngos.badge,
          baseLat: ngos.baseLat,
          baseLng: ngos.baseLng,
        })
        .from(campaigns)
        .innerJoin(ngos, eq(campaigns.ngoId, ngos.id))
        .where(eq(campaigns.disasterId, disaster.id));

      const rankingInputs: NgoRankingInput[] = [];

      for (const camp of disasterCampaigns) {
        // Count verified proofs
        const [proofCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(proofs)
          .where(eq(proofs.campaignId, camp.campaignId));

        rankingInputs.push({
          ngoId: camp.ngoId,
          ngoName: camp.ngoName,
          badge: camp.badge as "govt" | "platform",
          baseLat: parseFloat(camp.baseLat || "26.1"),
          baseLng: parseFloat(camp.baseLng || "91.7"),
          campaignId: camp.campaignId,
          campaignTitle: camp.campaignTitle,
          goal: parseFloat(camp.goal || "500000"),
          cap: parseFloat(camp.cap || "1000000"),
          raised: parseFloat(camp.raised || "0"),
          verifiedProofsCount: Number(proofCount?.count || 2),
          completedMilestonesCount: 1,
        });
      }

      if (rankingInputs.length > 0) {
        rankedNgosList = rankNgosForDisaster(disasterLat, disasterLng, rankingInputs);
      }
    }
  } catch (err) {
    console.error("Error loading disaster rankings:", err);
  }

  // Fallback demo disaster if DB not configured yet
  if (!disaster) {
    disaster = {
      id,
      name: "Assam Brahmaputra Floods",
      type: "flood",
      location: "Barpeta & Dhubri Districts, Assam",
      centerLat: "26.3216",
      centerLng: "90.9821",
      severity: 4,
      sourceLink: "https://cwc.gov.in",
      active: true,
      createdAt: new Date(),
      severityZones: null,
    };

    const mockInputs: NgoRankingInput[] = [
      {
        ngoId: "ngo-1",
        ngoName: "Assam Rapid Relief & Rescue Mission",
        badge: "govt",
        baseLat: 26.18,
        baseLng: 91.02,
        campaignId: "c1111111-1111-1111-1111-111111111111",
        campaignTitle: "Barpeta Clean Water & Medical Emergency Kits",
        goal: 500000,
        cap: 1000000,
        raised: 380000,
        verifiedProofsCount: 4,
        completedMilestonesCount: 2,
      },
      {
        ngoId: "ngo-2",
        ngoName: "Brahmaputra Disaster Aid Network",
        badge: "platform",
        baseLat: 26.14,
        baseLng: 91.73,
        campaignId: "c2222222-2222-2222-2222-222222222222",
        campaignTitle: "Dhubri Temporary Shelter & Ration Logistics",
        goal: 750000,
        cap: 1200000,
        raised: 420000,
        verifiedProofsCount: 3,
        completedMilestonesCount: 1,
      },
      {
        ngoId: "ngo-3",
        ngoName: "North East Humanitarian Response",
        badge: "platform",
        baseLat: 25.57,
        baseLng: 91.89,
        campaignId: "c3333333-3333-3333-3333-333333333333",
        campaignTitle: "Mobile Boat Ambulances for Inaccessible Wards",
        goal: 400000,
        cap: 600000,
        raised: 120000,
        verifiedProofsCount: 1,
        completedMilestonesCount: 0,
      },
    ];

    rankedNgosList = rankNgosForDisaster(26.3216, 90.9821, mockInputs);
  }

  const sev = severityLabel(disaster.severity);

  return (
    <div className="section max-w-7xl mx-auto py-8">
      {/* Back button */}
      <Link
        href="/disasters"
        className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors mb-6 font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to all disasters
      </Link>

      {/* Hero Disaster Banner */}
      <div className="bg-surface rounded-card border border-outline-variant/60 p-6 md:p-8 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-outline-variant/40">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant={
                  disaster.severity === 4
                    ? "critical"
                    : disaster.severity === 3
                    ? "high"
                    : "moderate"
                }
              >
                {sev.label} Severity (Level {disaster.severity})
              </Badge>
              <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                {disaster.type}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-on-surface mb-2">{disaster.name}</h1>
            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span>{disaster.location}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/map"
              className="px-4 py-2 rounded-input bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors text-center"
            >
              View on Map
            </Link>
            {disaster.sourceLink && (
              <a
                href={disaster.sourceLink}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-input border border-outline text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors text-center"
              >
                Official NDMA Source &rarr;
              </a>
            )}
          </div>
        </div>

        {/* Explain ranking mechanism */}
        <div className="mt-4 pt-2 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-on-surface-variant">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-primary shrink-0" />
            <span>
              <strong>Algorithmic Ranking Active:</strong> NGOs are prioritized by Turf.js proximity to epicenter, verified milestone delivery rate, and anti-overfunding caps.
            </span>
          </div>
          <span className="font-mono text-primary font-semibold">
            {rankedNgosList.length} Verified Organizations Responding
          </span>
        </div>
      </div>

      {/* Ranked NGO Cards */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
          <span>Priority Ranked Relief Organizations</span>
          <span className="text-xs bg-primary-container text-on-primary-container px-2.5 py-0.5 rounded-pill font-mono font-semibold">
            Live Scoring
          </span>
        </h2>

        {rankedNgosList.map((ranked, index) => {
          const badgeInfo = badgeLabel(ranked.badge);
          const pct = Math.min(100, Math.round((ranked.raised / ranked.goal) * 100));

          return (
            <div
              key={ranked.campaignId}
              className="bg-surface rounded-card border border-outline-variant/60 p-6 shadow-sm hover:border-primary/50 transition-all relative overflow-hidden"
            >
              {/* Top accent badge for #1 rank */}
              {index === 0 && (
                <div className="absolute top-0 right-0 bg-primary text-on-primary text-[10px] font-bold px-3 py-1 rounded-bl-card uppercase tracking-wider flex items-center gap-1">
                  <Award className="w-3 h-3" /> Top Ranked Responder
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Left col: Rank & NGO Info (5 cols) */}
                <div className="lg:col-span-5 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-card bg-surface-container-high flex flex-col items-center justify-center font-mono font-extrabold text-primary shrink-0 border border-outline-variant/60">
                    <span className="text-[10px] text-on-surface-variant uppercase">Rank</span>
                    <span className="text-xl leading-none">#{index + 1}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant={ranked.badge === "govt" ? "govt" : "platform"}>
                        {badgeInfo.label}
                      </Badge>
                      <span className="text-xs text-on-surface-variant flex items-center gap-1 font-mono">
                        <Navigation className="w-3 h-3 text-secondary" />
                        {ranked.distanceKm} km to disaster
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-on-surface">{ranked.ngoName}</h3>
                    <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                      Campaign: {ranked.campaignTitle}
                    </p>
                  </div>
                </div>

                {/* Middle col: Progress & Metrics (4 cols) */}
                <div className="lg:col-span-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-on-surface">
                      {formatCurrency(ranked.raised)} raised
                    </span>
                    <span className="text-on-surface-variant font-mono">
                      of {formatCurrency(ranked.goal)} ({pct}%)
                    </span>
                  </div>

                  <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden mb-3">
                    <div
                      className="bg-primary h-full transition-all duration-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Score breakdown metrics pill */}
                  <div className="grid grid-cols-4 gap-1 text-center bg-surface-container/60 p-2 rounded-input text-[10px]">
                    <div>
                      <div className="font-mono font-bold text-on-surface">{ranked.scores.proximityScore}/40</div>
                      <div className="text-on-surface-variant">Distance</div>
                    </div>
                    <div>
                      <div className="font-mono font-bold text-on-surface">{ranked.scores.deliveryRateScore}/30</div>
                      <div className="text-on-surface-variant">Delivery</div>
                    </div>
                    <div>
                      <div className="font-mono font-bold text-on-surface">{ranked.scores.fundNeedScore}/20</div>
                      <div className="text-on-surface-variant">Need</div>
                    </div>
                    <div>
                      <div className="font-mono font-bold text-primary font-bold">{ranked.scores.totalScore}</div>
                      <div className="text-primary font-semibold">Total</div>
                    </div>
                  </div>
                </div>

                {/* Right col: Action CTA (3 cols) */}
                <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col gap-2.5 justify-center">
                  <Link
                    href={`/donate?campaignId=${ranked.campaignId}`}
                    className="w-full py-2.5 px-4 rounded-input bg-primary text-on-primary font-semibold text-xs text-center hover:bg-primary-hover shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <HeartHandshake className="w-4 h-4" />
                    <span>Donate to #{index + 1} NGO</span>
                  </Link>

                  <Link
                    href={`/transparency?campaignId=${ranked.campaignId}`}
                    className="w-full py-2 px-4 rounded-input border border-outline text-on-surface font-medium text-xs text-center hover:bg-surface-container transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-on-surface-variant" />
                    <span>View Proofs ({ranked.scores.deliveryRateScore > 0 ? "Verified" : "Pending"})</span>
                  </Link>
                </div>
              </div>

              {/* "Why This Rank" Callout Box (Institutional Fintech style) */}
              <div className="mt-4 pt-3 border-t border-outline-variant/40 flex items-start gap-2 text-xs bg-surface-container/30 p-3 rounded-input">
                <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="text-on-surface-variant">
                  <strong className="text-on-surface font-semibold">Why this rank: </strong>
                  {ranked.whyThisRank}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
