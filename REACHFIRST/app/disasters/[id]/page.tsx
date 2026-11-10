import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin,
  ArrowLeft,
  Award,
  Users,
  AlertTriangle,
  ExternalLink,
  Map,
} from "lucide-react";
import { getDisaster, getRankedNgos } from "@/lib/api";
import { severityLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { NgoRankCard } from "@/components/disaster/NgoRankCard";

export const dynamic = "force-dynamic";

export default async function DisasterRankingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let disaster;
  let rankedNgos = [];

  try {
    disaster = await getDisaster(id);
    rankedNgos = await getRankedNgos(id);
  } catch (err) {
    console.error(`Failed to load disaster ${id}:`, err);
    notFound();
  }

  if (!disaster) {
    notFound();
  }

  const sev = severityLabel(disaster.severity);
  const badgeVariant =
    disaster.severity === 4
      ? "critical"
      : disaster.severity === 3
      ? "high"
      : "moderate";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* ── Breadcrumb & Back Action ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          href="/map"
          className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Live Disaster Map</span>
        </Link>
        <span className="font-mono text-xs text-outline">
          ID: {disaster.id.slice(0, 8)}...
        </span>
      </div>

      {/* ── Disaster Hero Banner ────────────────────────────────────────────── */}
      <Card className="p-6 md:p-8 bg-white border-outline-variant/70 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-outline-variant/60">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={badgeVariant} dot>
                {sev.label} Severity (Level {disaster.severity})
              </Badge>
              <span className="text-xs font-mono font-bold text-outline uppercase tracking-wider">
                {disaster.type}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              {disaster.name}
            </h1>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant font-mono">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span>
                Coordinates: {disaster.lat.toFixed(4)}° N, {disaster.lng.toFixed(4)}° E
              </span>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
            <Link href="/map">
              <Button variant="outline" size="sm" iconLeft={<Map className="w-4 h-4" />}>
                View on Map
              </Button>
            </Link>
            <a
              href="https://ndma.gov.in"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-outline hover:text-on-surface transition-colors"
            >
              <span>NDMA Emergency Feed</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Live Impact Counters Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 bg-surface-low rounded-card border border-outline-variant/60">
            <span className="text-outline text-[10px] block uppercase">Recorded Casualties</span>
            <span className="text-lg font-bold text-on-surface">
              {disaster.casualties > 0 ? disaster.casualties.toLocaleString("en-IN") : "Auditing"}
            </span>
          </div>

          <div className="p-3 bg-surface-low rounded-card border border-outline-variant/60">
            <span className="text-outline text-[10px] block uppercase">Relief Personnel</span>
            <span className="text-lg font-bold text-primary flex items-center gap-1">
              <Users className="w-4 h-4" />
              {disaster.teamsDeployed || 0} Teams
            </span>
          </div>

          <div className="p-3 bg-surface-low rounded-card border border-outline-variant/60">
            <span className="text-outline text-[10px] block uppercase">Accredited Responders</span>
            <span className="text-lg font-bold text-on-surface">
              {rankedNgos.length} NGOs
            </span>
          </div>

          <div className="p-3 bg-surface-low rounded-card border border-outline-variant/60">
            <span className="text-outline text-[10px] block uppercase">Escrow Release Policy</span>
            <span className="text-lg font-bold text-tertiary">
              Geotagged
            </span>
          </div>
        </div>

        {/* Institutional Ranking Methodology Banner */}
        <div className="p-3.5 rounded-input bg-surface-container/40 border border-outline-variant/60 flex items-start gap-2.5 text-xs text-on-surface-variant leading-relaxed">
          <Award className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <strong className="text-on-surface font-semibold">Algorithmic Ranking Policy Active: </strong>
            Organizations are scored 0–100 based on Turf.js proximity to epicenter (max 40), verified delivery completion rate (max 30), underfunded cap urgency (max 20), and government accreditation (+10 Govt / +6 Platform). AI provides human-readable explanations without modifying values.
          </div>
        </div>
      </Card>

      {/* ── Ranked NGOs Section ─────────────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <span>Priority Ranked Relief Organizations</span>
            <span className="text-xs bg-primary-container text-white px-2.5 py-0.5 rounded-pill font-mono font-bold">
              {rankedNgos.length} Active
            </span>
          </h2>
          <span className="text-xs font-mono text-outline hidden sm:block">
            Sorted by Autonomous Score
          </span>
        </div>

        {rankedNgos.length === 0 ? (
          <EmptyState
            icon={<AlertTriangle className="w-8 h-8 text-outline" />}
            title="No NGOs Currently Responding"
            description="No accredited relief organizations have launched campaigns for this specific crisis yet. NGOs can apply to respond."
            action={
              <Link href="/ngo/apply">
                <Button variant="primary" size="sm">
                  Register Response Team
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {rankedNgos.map((ngo, idx) => (
              <NgoRankCard
                key={ngo.campaignId || ngo.ngoId}
                ngo={ngo}
                rank={idx + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
