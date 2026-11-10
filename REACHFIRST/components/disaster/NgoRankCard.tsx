"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Navigation,
  HeartHandshake,
  ChevronDown,
  ChevronUp,
  Award,
  Sparkles,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatCurrency } from "@/lib/utils";
import type { RankedNgo } from "@/types/api";

interface ScoreRingProps {
  score: number;
}

export function ScoreRing({ score }: ScoreRingProps) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  return (
    <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 52 52">
        <circle
          cx="26"
          cy="26"
          r={radius}
          className="stroke-surface-container"
          strokeWidth="4"
          fill="transparent"
        />
        <circle
          cx="26"
          cy="26"
          r={radius}
          className="stroke-primary transition-all duration-700 ease-out"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="font-mono text-base font-extrabold text-on-surface leading-none">
          {score}
        </span>
        <span className="text-[9px] font-mono text-outline font-semibold uppercase">
          Score
        </span>
      </div>
    </div>
  );
}

interface NgoRankCardProps {
  ngo: RankedNgo;
  rank: number;
}

export function NgoRankCard({ ngo, rank }: NgoRankCardProps) {
  const [expanded, setExpanded] = useState(rank === 1); // Expand top rank by default

  const cap = ngo.cap > 0 ? ngo.cap : 1000000;
  const raised = ngo.raised || 0;
  const pct = Math.min(100, Math.round((raised / cap) * 100));

  const badgeVariant =
    ngo.badge === "GOVT"
      ? "govt"
      : ngo.badge === "PLATFORM"
      ? "platform"
      : "none";

  return (
    <Card hover className="relative overflow-hidden p-5 sm:p-6 shadow-xs border-outline-variant/70">
      {/* Top accent pill for #1 rank */}
      {rank === 1 && (
        <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-card uppercase tracking-wider flex items-center gap-1 shadow-xs">
          <Award className="w-3.5 h-3.5 text-secondary-container" />
          <span>Priority Responder</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Section: Rank + Score Ring + NGO Details */}
        <div className="flex items-start gap-4 flex-1">
          {/* Rank Badge */}
          <div className="w-11 h-11 rounded-card bg-surface-container flex flex-col items-center justify-center text-primary font-mono shrink-0 border border-outline-variant/70">
            <span className="text-[9px] text-outline font-bold uppercase">Rank</span>
            <span className="text-lg font-extrabold leading-none">#{rank}</span>
          </div>

          {/* Score Ring */}
          <ScoreRing score={ngo.score} />

          {/* NGO Info */}
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={badgeVariant} dot>
                {ngo.badge === "GOVT"
                  ? "Government Accredited"
                  : ngo.badge === "PLATFORM"
                  ? "Platform Verified"
                  : "Unaccredited"}
              </Badge>

              <span className="inline-flex items-center gap-1 text-xs font-mono text-outline">
                <Navigation className="w-3 h-3 text-secondary" />
                <span>{ngo.distanceKm} km from epicenter</span>
              </span>
            </div>

            <h3 className="text-lg font-bold text-on-surface tracking-tight truncate">
              {ngo.name}
            </h3>

            {/* Campaign Cap Progress */}
            <div className="pt-2 max-w-md">
              <div className="flex items-center justify-between text-xs mb-1 font-mono">
                <span className="font-semibold text-primary">
                  {formatCurrency(raised)}
                </span>
                <span className="text-outline text-[11px]">
                  Cap: {formatCurrency(cap)} ({pct}%)
                </span>
              </div>
              <ProgressBar value={raised} max={cap} size="sm" variant="primary" />
            </div>
          </div>
        </div>

        {/* Action Button: Donate & Transparency */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 justify-center min-w-[190px]">
          <Link href={`/donate?campaignId=${encodeURIComponent(ngo.campaignId)}`}>
            <Button
              variant="primary"
              size="md"
              className="w-full text-xs font-bold shadow-xs"
              iconLeft={<HeartHandshake className="w-4 h-4" />}
            >
              Donate in Escrow
            </Button>
          </Link>

          <Link href={`/transparency?campaignId=${encodeURIComponent(ngo.campaignId)}`}>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs font-semibold"
              iconLeft={<Eye className="w-3.5 h-3.5" />}
            >
              Field Proofs
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Expandable 'Why this rank' Section ─────────────────────────────────── */}
      <div className="mt-5 pt-4 border-t border-outline-variant/60">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full text-left cursor-pointer group"
          aria-expanded={expanded}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-on-surface uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Why This Rank</span>
            <span className="text-[11px] font-normal text-outline normal-case font-mono">
              (Algorithmic Scoring Rationale)
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-primary font-semibold group-hover:underline">
            <span>{expanded ? "Hide Breakdown" : "View Breakdown"}</span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {expanded && (
          <div className="mt-3 space-y-3.5 animate-slide-up">
            {/* AI / Rationale Narrative */}
            <div className="p-3.5 rounded-input bg-surface-container/40 border border-outline-variant/60 text-xs text-on-surface-variant leading-relaxed">
              <strong className="text-on-surface font-semibold">Audit Rationale: </strong>
              {ngo.whyThisRank ||
                `${ngo.name} is stationed ${ngo.distanceKm} km from the disaster zone with audited delivery records and remaining capacity under its funding cap.`}
            </div>

            {/* 4 Scoring Breakdown Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
              {/* Proximity /40 */}
              <div className="p-3 rounded-input bg-surface border border-outline-variant/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant text-[11px]">Proximity</span>
                  <span className="font-bold text-on-surface">
                    {ngo.breakdown.proximity}/40
                  </span>
                </div>
                <ProgressBar value={ngo.breakdown.proximity} max={40} size="sm" variant="primary" />
                <span className="text-[10px] text-outline font-sans block">
                  Geodesic Turf.js distance
                </span>
              </div>

              {/* Delivery /30 */}
              <div className="p-3 rounded-input bg-surface border border-outline-variant/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant text-[11px]">Delivery Rate</span>
                  <span className="font-bold text-on-surface">
                    {ngo.breakdown.delivery}/30
                  </span>
                </div>
                <ProgressBar value={ngo.breakdown.delivery} max={30} size="sm" variant="primary" />
                <span className="text-[10px] text-outline font-sans block">
                  Completed milestones
                </span>
              </div>

              {/* Cap Utilization /20 */}
              <div className="p-3 rounded-input bg-surface border border-outline-variant/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant text-[11px]">Cap Utilization</span>
                  <span className="font-bold text-on-surface">
                    {ngo.breakdown.capUtilization}/20
                  </span>
                </div>
                <ProgressBar value={ngo.breakdown.capUtilization} max={20} size="sm" variant="secondary" />
                <span className="text-[10px] text-outline font-sans block">
                  Underfunded urgency bias
                </span>
              </div>

              {/* Badge Bonus /10 */}
              <div className="p-3 rounded-input bg-surface border border-outline-variant/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant text-[11px]">Badge Bonus</span>
                  <span className="font-bold text-tertiary">
                    +{ngo.breakdown.badgeBonus}/10
                  </span>
                </div>
                <ProgressBar value={ngo.breakdown.badgeBonus} max={10} size="sm" variant="tertiary" />
                <span className="text-[10px] text-outline font-sans block">
                  {ngo.badge === "GOVT" ? "Govt (+10)" : "Platform (+6)"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
