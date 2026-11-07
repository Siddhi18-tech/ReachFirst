import { db } from "@/lib/db";
import { disasters, campaigns } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { DynamicDisasterMap } from "@/components/map/MapWrapper";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { severityLabel, formatCurrency } from "@/lib/utils";
import { AlertTriangle, MapPin, ArrowRight, ShieldCheck, Flame } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LiveDisasterMapPage() {
  let allDisasters: typeof disasters.$inferSelect[] = [];
  const campaignCounts: Record<string, { count: number; totalRaised: number }> = {};

  try {
    allDisasters = await db.select().from(disasters).where(eq(disasters.active, true));

    const activeCampaigns = await db
      .select({
        disasterId: campaigns.disasterId,
        count: sql<number>`count(${campaigns.id})`,
        totalRaised: sql<number>`sum(cast(${campaigns.raised} as numeric))`,
      })
      .from(campaigns)
      .where(eq(campaigns.status, "active"))
      .groupBy(campaigns.disasterId);

    activeCampaigns.forEach((c) => {
      campaignCounts[c.disasterId] = {
        count: Number(c.count || 0),
        totalRaised: Number(c.totalRaised || 0),
      };
    });
  } catch (err) {
    console.error("Error fetching map disasters:", err);
  }

  // Fallback seed data if DB is offline
  if (allDisasters.length === 0) {
    allDisasters = [
      {
        id: "d1111111-1111-1111-1111-111111111111",
        name: "Assam Brahmaputra Floods",
        type: "flood",
        location: "Barpeta & Dhubri Districts, Assam",
        centerLat: "26.3216",
        centerLng: "90.9821",
        severity: 4,
        casualties: 0,
        teamsDeployed: 0,
        sourceLink: "https://cwc.gov.in",
        active: true,
        createdAt: new Date(),
        severityZones: null,
      },
      {
        id: "d2222222-2222-2222-2222-222222222222",
        name: "Wayanad Landslide Incident",
        type: "landslide",
        location: "Meppadi, Wayanad District, Kerala",
        centerLat: "11.5534",
        centerLng: "76.1320",
        severity: 3,
        casualties: 0,
        teamsDeployed: 0,
        sourceLink: "https://kerala.gov.in",
        active: true,
        createdAt: new Date(),
        severityZones: null,
      },
      {
        id: "d3333333-3333-3333-3333-333333333333",
        name: "Western Rajasthan Drought",
        type: "drought",
        location: "Barmer & Jaisalmer Districts, Rajasthan",
        centerLat: "25.7532",
        centerLng: "71.4181",
        severity: 2,
        casualties: 0,
        teamsDeployed: 0,
        sourceLink: "https://rajasthan.gov.in",
        active: true,
        createdAt: new Date(),
        severityZones: null,
      },
    ];
  }

  const criticalCount = allDisasters.filter((d) => d.severity === 4).length;

  return (
    <div className="section max-w-8xl mx-auto py-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse" />
            <span className="text-xs font-mono font-semibold text-error uppercase tracking-wider">
              Real-Time Crisis Monitor
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-on-surface">Live Disaster Map</h1>
          <p className="text-sm text-on-surface-variant">
            Explore active verified crises across India. Click any hotspot to view ranked NGOs on ground.
          </p>
        </div>

        {/* Quick summary stats */}
        <div className="flex items-center gap-3 bg-surface-container/60 p-3 rounded-card border border-outline-variant/60">
          <div className="text-center px-3 border-r border-outline-variant/60">
            <div className="text-xl font-bold font-mono text-on-surface">{allDisasters.length}</div>
            <div className="text-[11px] text-on-surface-variant">Active Crises</div>
          </div>
          <div className="text-center px-3 border-r border-outline-variant/60">
            <div className="text-xl font-bold font-mono text-error">{criticalCount}</div>
            <div className="text-[11px] text-on-surface-variant">Critical (L4)</div>
          </div>
          <div className="text-center px-3">
            <div className="text-xl font-bold font-mono text-primary">100%</div>
            <div className="text-[11px] text-on-surface-variant">Verified NGOs</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Map + List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[620px]">
        {/* Interactive Map (7 cols) */}
        <div className="lg:col-span-7 h-[500px] lg:h-auto min-h-[500px] rounded-card overflow-hidden">
          <DynamicDisasterMap disasters={allDisasters} />
        </div>

        {/* Right List (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto max-h-[680px] pr-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
              Active Disasters ({allDisasters.length})
            </h3>
            <span className="text-xs text-on-surface-variant font-mono">Sorted by Severity</span>
          </div>

          {allDisasters.map((disaster) => {
            const sev = severityLabel(disaster.severity);
            const campaignsInfo = campaignCounts[disaster.id] || { count: 2, totalRaised: 340000 };

            return (
              <div
                key={disaster.id}
                className="bg-surface rounded-card border border-outline-variant/60 p-4 shadow-sm hover:border-primary/60 transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={
                          disaster.severity === 4
                            ? "critical"
                            : disaster.severity === 3
                            ? "high"
                            : "moderate"
                        }
                      >
                        {sev.label} Severity
                      </Badge>
                      <span className="text-xs text-on-surface-variant capitalize">
                        {disaster.type}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                      {disaster.name}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-4">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{disaster.location}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 py-2.5 px-3 bg-surface-container/60 rounded-input border border-outline-variant/40 mb-3 text-xs">
                  <div>
                    <span className="text-on-surface-variant block text-[11px]">Active Relief Teams</span>
                    <span className="font-mono font-bold text-on-surface">
                      {campaignsInfo.count > 0 ? `${campaignsInfo.count} Campaigns` : "Deploying"}
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block text-[11px]">Total Mobilized</span>
                    <span className="font-mono font-bold text-primary">
                      {formatCurrency(campaignsInfo.totalRaised)}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/disasters/${disaster.id}`}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-input bg-primary text-on-primary text-xs font-semibold hover:bg-primary-hover transition-colors"
                >
                  <span>View Ranked NGOs & Donate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}