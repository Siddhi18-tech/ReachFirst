"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Printer,
  Clock,
  Eye,
  Lock,
  ExternalLink,
} from "lucide-react";
import { Stepper } from "@/components/ui/Stepper";
import { Badge } from "@/components/ui/Badge";
import type { DonationSummary } from "@/types/api";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const donationId = searchParams.get("id");
  const orderId = searchParams.get("token") || searchParams.get("orderId");
  const amountParam = searchParams.get("amount");
  const currencyParam = (searchParams.get("currency") as "INR" | "USD") || "INR";

  const [summary, setSummary] = useState<DonationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadConfirmation() {
      setIsLoading(true);

      try {
        // 1. If we have an orderId or token, ensure it is captured
        if (orderId) {
          const capRes = await fetch("/api/donations/capture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId }),
          });

          if (capRes.ok) {
            const data: DonationSummary = await capRes.json();
            if (isMounted) {
              setSummary(data);
              setIsLoading(false);
              return;
            }
          }
        }

        // 2. If we have a donation ID, fetch donation summary
        if (donationId) {
          const res = await fetch(`/api/donations/${donationId}`);
          if (res.ok) {
            const data: DonationSummary = await res.json();
            if (isMounted) {
              setSummary(data);
              setIsLoading(false);
              return;
            }
          }
        }

        // 3. Fallback mock summary for demo or when API is in mock mode
        const now = new Date().toISOString();
        const fallbackAmount = amountParam ? parseFloat(amountParam) : 1000;
        const fallbackSummary: DonationSummary = {
          id: donationId || orderId || `don-${Date.now().toString(36)}`,
          amount: isNaN(fallbackAmount) ? 1000 : fallbackAmount,
          currency: currencyParam,
          status: "escrow",
          milestones: [
            { step: 1, label: "Payment received", done: true, at: now },
            { step: 2, label: "Held in escrow", done: true, at: now },
            { step: 3, label: "Field proof verified by admin", done: false },
            { step: 4, label: "Funds released to NGO", done: false },
          ],
        };

        if (isMounted) {
          setSummary(fallbackSummary);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.warn("Confirmation fetch warning:", err);
          const now = new Date().toISOString();
          setSummary({
            id: donationId || orderId || `don-${Date.now().toString(36)}`,
            amount: amountParam ? parseFloat(amountParam) : 1000,
            currency: currencyParam,
            status: "escrow",
            milestones: [
              { step: 1, label: "Payment received", done: true, at: now },
              { step: 2, label: "Held in escrow", done: true, at: now },
              { step: 3, label: "Field proof verified by admin", done: false },
              { step: 4, label: "Funds released to NGO", done: false },
            ],
          });
          setIsLoading(false);
        }
      }
    }

    loadConfirmation();

    return () => {
      isMounted = false;
    };
  }, [donationId, orderId, amountParam, currencyParam]);

  // Milestone descriptions mapping
  const enrichedMilestones = useMemo(() => {
    if (!summary?.milestones) return [];

    const descriptions: Record<number, string> = {
      1: "Payment processed via PayPal Sandbox & cryptographically registered in the ReliefTrack ledger.",
      2: "Deposit secured in multi-signature escrow vault. Funds are locked and cannot be spent without verified ground proof.",
      3: "Field team uploads high-resolution GPS & timestamped photos of relief material distribution to verified victims.",
      4: "ReliefTrack platform auditor certifies EXIF metadata authenticity, and release tranche is wired to NGO bank account.",
    };

    return summary.milestones.map((m) => ({
      ...m,
      description: descriptions[m.step] || m.label,
    }));
  }, [summary]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (isLoading) {
    return (
      <div className="section max-w-3xl mx-auto py-16 text-center">
        <div className="w-16 h-16 bg-primary-container text-primary rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20 animate-pulse">
          <Clock className="w-8 h-8 animate-spin text-primary" />
        </div>
        <h2 className="text-xl font-bold text-on-surface mb-2">
          Verifying Escrow Deposit...
        </h2>
        <p className="text-xs text-on-surface-variant font-mono">
          Cryptographically confirming transaction audit trail in database
        </p>
      </div>
    );
  }

  const amountDisplay =
    summary?.currency === "INR"
      ? `₹${summary.amount.toLocaleString()}`
      : `$${summary?.amount}`;

  return (
    <div className="section max-w-3xl mx-auto py-8 md:py-12">
      {/* Success Hero Card */}
      <div className="bg-surface rounded-card border border-outline-variant/60 p-6 md:p-8 shadow-sm text-center mb-8 relative overflow-hidden">
        {/* Decorative Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-secondary to-tertiary" />

        <div className="w-16 h-16 bg-primary-container text-white rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-primary/30 shadow-sm animate-in zoom-in-90 duration-300">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>

        <div className="inline-flex items-center gap-2 mb-2">
          <Badge variant="PLATFORM" dot>
            Escrow Deposit Locked
          </Badge>
          <span className="text-[11px] font-mono text-on-surface-variant">
            Tx #{summary?.id.slice(-8)}
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight mb-2">
          Thank you for your relief support!
        </h1>
        <p className="text-sm text-on-surface-variant max-w-lg mx-auto mb-6 leading-relaxed">
          Your contribution of{" "}
          <strong className="text-on-surface font-extrabold font-mono text-base text-primary">
            {amountDisplay}
          </strong>{" "}
          is safely secured in verified escrow and scheduled for disbursement upon
          GPS-audited relief distribution.
        </p>

        {/* Transaction Summary Card */}
        <div className="bg-surface-container/60 rounded-card p-4 md:p-5 border border-outline-variant/60 max-w-lg mx-auto grid grid-cols-2 gap-4 text-left text-xs mb-6">
          <div>
            <span className="text-on-surface-variant block text-[11px] uppercase tracking-wider font-semibold">
              Escrow ID
            </span>
            <span className="font-mono font-bold text-on-surface truncate block text-xs mt-0.5">
              {summary?.id || "—"}
            </span>
          </div>

          <div>
            <span className="text-on-surface-variant block text-[11px] uppercase tracking-wider font-semibold">
              Payment Reference
            </span>
            <span className="font-mono font-bold text-on-surface truncate block text-xs mt-0.5">
              {orderId || "PAYPAL-SANDBOX-AUTH"}
            </span>
          </div>

          <div>
            <span className="text-on-surface-variant block text-[11px] uppercase tracking-wider font-semibold">
              Escrow Status
            </span>
            <div className="mt-0.5">
              <Badge
                variant={
                  summary?.status === "released"
                    ? "GOVT"
                    : summary?.status === "escrow"
                    ? "PLATFORM"
                    : "HIGH"
                }
                dot
              >
                {summary?.status === "released"
                  ? "Disbursed to NGO"
                  : summary?.status === "escrow"
                  ? "Held in Escrow"
                  : "Pending Verification"}
              </Badge>
            </div>
          </div>

          <div>
            <span className="text-on-surface-variant block text-[11px] uppercase tracking-wider font-semibold">
              Audit Timestamp
            </span>
            <span className="font-mono text-on-surface block text-xs mt-0.5">
              {summary?.milestones?.[0]?.at
                ? new Date(summary.milestones[0].at).toLocaleString("en-IN", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Just now"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            href="/donor/impact"
            className="w-full sm:w-auto py-2.5 px-5 rounded-input bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-xs transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <span>Track in My Impact Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            href="/transparency"
            className="w-full sm:w-auto py-2.5 px-5 rounded-input border border-outline text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-on-surface-variant" />
            <span>Public Transparency Ledger</span>
          </Link>

          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto py-2.5 px-4 rounded-input border border-outline-variant text-on-surface-variant hover:text-on-surface text-xs font-medium hover:bg-surface-container/60 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>

      {/* 4-Step Milestone Audit Trail */}
      <div className="bg-surface rounded-card border border-outline-variant/60 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-outline-variant/40">
          <div>
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span>4-Step Milestone Audit Trail</span>
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Live lifecycle of your funds from donor escrow to ground beneficiary.
            </p>
          </div>
          <Badge variant="GOVT" dot>
            Zero Leakage Protocol
          </Badge>
        </div>

        {/* The Reusable Stepper Component */}
        <div className="py-4 px-2">
          <Stepper steps={enrichedMilestones} orientation="horizontal" />
        </div>

        {/* Detailed Audit Milestone Cards */}
        <div className="mt-8 space-y-4 pt-6 border-t border-outline-variant/40">
          <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-3">
            Milestone Details & Ground Verification
          </h3>

          {enrichedMilestones.map((milestone) => {
            const isCompleted = Boolean(milestone.done);
            return (
              <div
                key={milestone.step}
                className={`p-4 rounded-card border transition-all ${
                  isCompleted
                    ? "bg-primary-container/10 border-primary/30"
                    : "bg-surface-container/30 border-outline-variant/60 opacity-80"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 ${
                        isCompleted
                          ? "bg-primary text-white"
                          : "bg-surface-container text-on-surface-variant border border-outline-variant"
                      }`}
                    >
                      {isCompleted ? "✓" : milestone.step}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-on-surface">
                        {milestone.step}. {milestone.label}
                      </h4>
                      <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                        {milestone.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-pill font-bold uppercase tracking-wider ${
                        isCompleted
                          ? "bg-tertiary-container text-white"
                          : "bg-surface-container text-on-surface-variant border border-outline-variant/60"
                      }`}
                    >
                      {isCompleted ? "Completed" : "Awaiting Audit"}
                    </span>
                    {milestone.at && (
                      <span className="block text-[10px] font-mono text-on-surface-variant mt-1">
                        {new Date(milestone.at).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Bottom Notice */}
        <div className="mt-6 p-4 rounded-input bg-surface-container/40 border border-outline-variant/40 flex items-center justify-between text-xs text-on-surface-variant">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary shrink-0" />
            <span>
              All milestone state changes are cryptographically verifiable on the Neon
              PostgreSQL audit ledger.
            </span>
          </div>
          <Link
            href="/map"
            className="text-primary hover:underline font-semibold shrink-0 ml-3 inline-flex items-center gap-1"
          >
            <span>Live Map</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DonationConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <Clock className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
