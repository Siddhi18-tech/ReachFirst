"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, Zap, ShieldCheck, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface HeroCounterProps {
  initialRaised?: number;
  initialDisasters?: number;
  initialNgos?: number;
  initialTeams?: number;
}

export function HeroCounter({
  initialRaised = 4250000,
  initialDisasters = 4,
  initialNgos = 18,
  initialTeams = 34,
}: HeroCounterProps) {
  const [raised, setRaised] = useState(0);
  const [disastersCount, setDisastersCount] = useState(0);
  const [ngosCount, setNgosCount] = useState(0);
  const [teamsCount, setTeamsCount] = useState(0);

  useEffect(() => {
    const duration = 1400; // ms
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      setRaised(Math.floor(ease * initialRaised));
      setDisastersCount(Math.floor(ease * initialDisasters));
      setNgosCount(Math.floor(ease * initialNgos));
      setTeamsCount(Math.floor(ease * initialTeams));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [initialRaised, initialDisasters, initialNgos, initialTeams]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
      {/* Metric 1 */}
      <div className="flex items-center gap-3.5 p-4 rounded-card bg-surface border border-outline-variant/60 shadow-xs">
        <div className="w-11 h-11 rounded-card bg-primary-50 flex items-center justify-center text-primary shrink-0 border border-primary/20">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-extrabold text-on-surface font-mono tabular tracking-tight">
            {formatCurrency(raised)}
          </p>
          <p className="text-xs text-on-surface-variant font-medium">Total Escrow Raised</p>
        </div>
      </div>

      {/* Metric 2 */}
      <div className="flex items-center gap-3.5 p-4 rounded-card bg-surface border border-outline-variant/60 shadow-xs">
        <div className="w-11 h-11 rounded-card bg-urgent-container flex items-center justify-center text-urgent shrink-0 border border-urgent/20">
          <Zap className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-extrabold text-urgent font-mono tabular tracking-tight">
            {disastersCount}
          </p>
          <p className="text-xs text-on-surface-variant font-medium">Active Crises</p>
        </div>
      </div>

      {/* Metric 3 */}
      <div className="flex items-center gap-3.5 p-4 rounded-card bg-surface border border-outline-variant/60 shadow-xs">
        <div className="w-11 h-11 rounded-card bg-tertiary-50 flex items-center justify-center text-tertiary shrink-0 border border-tertiary/20">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-extrabold text-on-surface font-mono tabular tracking-tight">
            {ngosCount}
          </p>
          <p className="text-xs text-on-surface-variant font-medium">Verified NGOs</p>
        </div>
      </div>

      {/* Metric 4 */}
      <div className="flex items-center gap-3.5 p-4 rounded-card bg-surface border border-outline-variant/60 shadow-xs">
        <div className="w-11 h-11 rounded-card bg-secondary-50 flex items-center justify-center text-secondary shrink-0 border border-secondary/20">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-extrabold text-on-surface font-mono tabular tracking-tight">
            {teamsCount}
          </p>
          <p className="text-xs text-on-surface-variant font-medium">Relief Teams Deployed</p>
        </div>
      </div>
    </div>
  );
}

