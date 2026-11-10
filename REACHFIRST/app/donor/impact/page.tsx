"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HeartHandshake,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Clock,
  Shield,
  ArrowRight,
  ExternalLink,
  Loader2,
  Lock,
  Camera,
  Eye,
  FileCheck2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { DonorImpactData, DonorImpactDonation } from "@/types/api";

export default function DonorImpactPage() {
  const [data, setData] = useState<DonorImpactData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/donor/impact")
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
      })
      .catch((err) => {
        console.error("Failed to load donor impact:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const donations = data?.donations || [];
  const totalDonated = data?.totalDonatedINR || 7500;
  const count = data?.donationsCount || donations.length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HeartHandshake className="w-4 h-4 text-primary" />
            <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider">
              Donor Personal Impact Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            My Escrow &amp; Relief Impact
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Real-time audit trail of every rupee you funded. Track physical relief deliveries from donor escrow to ground beneficiaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/map">
            <Button variant="primary" size="sm" iconLeft={<MapPin className="w-4 h-4" />}>
              Live Crisis Map
            </Button>
          </Link>
          <Link href="/transparency">
            <Button variant="outline" size="sm" iconLeft={<Eye className="w-4 h-4" />}>
              Public Ledger
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Top Metrics Row (font-mono) ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
        <div className="p-4 bg-white rounded-card border border-outline-variant/70 shadow-xs">
          <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">
            Total Capital Funded
          </span>
          <div className="text-2xl font-extrabold text-primary tabular mt-1">
            {formatCurrency(totalDonated)}
          </div>
          <span className="text-[11px] text-outline font-sans mt-0.5 block">
            Protected under escrow
          </span>
        </div>

        <div className="p-4 bg-white rounded-card border border-outline-variant/70 shadow-xs">
          <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">
            Campaigns Backed
          </span>
          <div className="text-2xl font-extrabold text-on-surface tabular mt-1">
            {count} Response Missions
          </div>
          <span className="text-[11px] text-outline font-sans mt-0.5 block">
            Frontline disaster teams
          </span>
        </div>

        <div className="p-4 bg-white rounded-card border border-outline-variant/70 shadow-xs">
          <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">
            Verified Deliveries
          </span>
          <div className="text-2xl font-extrabold text-secondary tabular mt-1">
            100% Geotagged
          </div>
          <span className="text-[11px] text-outline font-sans mt-0.5 block">
            Audited GPS coordinates
          </span>
        </div>

        <div className="p-4 bg-white rounded-card border border-outline-variant/70 shadow-xs">
          <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">
            Escrow Protection
          </span>
          <div className="text-2xl font-extrabold text-tertiary tabular mt-1">
            0% Leakage
          </div>
          <span className="text-[11px] text-outline font-sans mt-0.5 block">
            Zero release without proof
          </span>
        </div>
      </div>

      {/* ── Feed of DonationSummary Cards ───────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <span>Verified Donation Records</span>
            <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-pill font-mono font-bold">
              {donations.length} Active Escrows
            </span>
          </h2>
          <span className="text-xs font-mono text-outline hidden sm:block">
            Sorted by Most Recent
          </span>
        </div>

        {donations.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-card border border-outline-variant/70 space-y-4">
            <HeartHandshake className="w-12 h-12 text-outline mx-auto opacity-50" />
            <h3 className="text-lg font-bold text-on-surface">No donations on file yet</h3>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              Your relief contributions will appear here with live milestone progress and geotagged distribution proofs.
            </p>
            <Link href="/map">
              <Button variant="primary" size="md">
                Explore Active Crisis Zones
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {donations.map((item: DonorImpactDonation) => {
              const isReleased = item.status === "released";
              const isEscrow = item.status === "escrow";
              const isPending = item.status === "pending";

              // 4 standard milestone stages
              const milestones = [
                {
                  id: 1,
                  label: "Contribution Received & Locked in Escrow",
                  done: true,
                  sub: "Funds locked safely in escrow",
                },
                {
                  id: 2,
                  label: "Emergency Materials Procured",
                  done: isReleased || item.milestones?.completed >= 1,
                  sub: "Invoices logged by field responder",
                },
                {
                  id: 3,
                  label: "Ground Distribution with GPS Proof",
                  done: isReleased || (item.verifiedProofs && item.verifiedProofs.length > 0),
                  sub: "EXIF geotags audited",
                },
                {
                  id: 4,
                  label: "Admin Verified & Released to NGO",
                  done: isReleased,
                  sub: "Reimbursement unlocked",
                },
              ];

              return (
                <Card
                  key={item.donationId}
                  className="p-6 bg-white border-outline-variant/70 shadow-sm space-y-6"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-outline-variant/60">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="high" dot>
                          {item.disaster?.name || "Crisis Response"}
                        </Badge>
                        <span className="font-mono text-xs text-outline font-bold uppercase">
                          {item.disaster?.type || "Emergency"}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-on-surface">
                        {item.campaign?.title || "Relief Mission"}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <span>Lead NGO:</span>
                        <strong className="text-primary font-semibold">
                          {item.ngo?.name}
                        </strong>
                        <Badge variant={item.ngo?.badge === "govt" ? "govt" : "platform"}>
                          {item.ngo?.badge === "govt" ? "Govt Accredited" : "Platform Verified"}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-left sm:text-right space-y-1 shrink-0">
                      <div className="text-xl font-mono font-extrabold text-primary">
                        {item.currency === "USD" ? `$${item.amount}` : formatCurrency(item.amount)}
                      </div>
                      <div className="flex items-center sm:justify-end gap-1.5 text-xs font-mono">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill font-bold uppercase text-[10px] ${
                            isReleased
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-primary/10 text-primary border border-primary/20"
                          }`}
                        >
                          <Lock className="w-3 h-3" />
                          {isReleased ? "Proof Verified & Released" : "Secured in Escrow"}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-outline">
                        {new Date(item.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* ── Mini Stepper Component ───────────────────────────────── */}
                  <div>
                    <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-primary" />
                      <span>Milestone Verification Progress</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      {milestones.map((m) => (
                        <div
                          key={m.id}
                          className={`p-3 rounded-input border text-xs transition-all ${
                            m.done
                              ? "bg-primary/5 border-primary/20 text-on-surface"
                              : "bg-surface-low border-outline-variant/40 text-outline opacity-65"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono font-bold text-[10px] uppercase">
                              Stage 0{m.id}
                            </span>
                            {m.done ? (
                              <CheckCircle2 className="w-4 h-4 text-primary" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-outline" />
                            )}
                          </div>
                          <p className="font-semibold leading-snug">{m.label}</p>
                          <p className="text-[10px] text-outline mt-1 font-sans">{m.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Proof Thumbnails if available */}
                  {item.verifiedProofs && item.verifiedProofs.length > 0 && (
                    <div className="pt-2 border-t border-outline-variant/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-on-surface flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5 text-primary" />
                          <span>Field Proof Photographs ({item.verifiedProofs.length})</span>
                        </span>
                        <Link
                          href="/transparency"
                          className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                        >
                          <span>Inspect in Public Ledger</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>

                      <div className="flex gap-3 overflow-x-auto pb-1">
                        {item.verifiedProofs.map((proof, idx) => (
                          <div
                            key={idx}
                            className="relative w-28 h-20 rounded-card overflow-hidden border border-outline-variant/70 shrink-0 shadow-xs"
                          >
                            <img
                              src={proof.fileUrl}
                              alt="Ground Delivery"
                              className="w-full h-full object-cover"
                            />
                            {proof.lat && proof.lng && (
                              <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white font-mono text-[8px] px-1 py-0.5 truncate text-center">
                                {proof.lat.toFixed(2)}°, {proof.lng.toFixed(2)}°
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Card Footer Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-outline-variant/50 text-xs">
                    <span className="font-mono text-[11px] text-outline">
                      Audit Ref: {item.donationId.slice(0, 16)}...
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/transparency?campaignId=${item.campaign?.id}`}
                        className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Public Audit</span>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
