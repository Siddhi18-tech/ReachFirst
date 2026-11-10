"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Eye,
  Clock,
  Loader2,
  XCircle,
  Lock,
  HeartHandshake,
} from "lucide-react";
import { Stepper } from "@/components/ui/Stepper";
import { formatCurrency } from "@/lib/utils";
import type { Milestone } from "@/types/api";

// ── Default 4-step milestones (before server response) ────────────────────────
const DEFAULT_MILESTONES: (Milestone & { description: string })[] = [
  {
    step: 1,
    label: "Contribution Held in Escrow",
    description: "Funds received via PayPal and securely held — not yet released to any NGO.",
    done: false,
  },
  {
    step: 2,
    label: "Relief Supplies Purchased",
    description: "NGO procures verified emergency supplies with invoices lodged on-platform.",
    done: false,
  },
  {
    step: 3,
    label: "Field Distribution with GPS Proof",
    description: "Volunteers geo-tag distribution photos (EXIF-verified coordinates).",
    done: false,
  },
  {
    step: 4,
    label: "Admin Verification & Funds Released",
    description: "Admin audits EXIF metadata & receipts. Escrow released to NGO account.",
    done: false,
  },
];

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: "checking" | "confirmed" | "failed" }) {
  if (status === "checking") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-secondary uppercase tracking-wider">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Verifying payment...
      </span>
    );
  }
  if (status === "confirmed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-primary uppercase tracking-wider">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        Payment Confirmed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-urgent uppercase tracking-wider">
      <XCircle className="w-3.5 h-3.5" />
      Payment Not Confirmed
    </span>
  );
}

// ── Main confirmation content ─────────────────────────────────────────────────
function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("token") ?? searchParams.get("orderId");
  const amountStr = searchParams.get("amount") ?? "1000";
  const currency = (searchParams.get("currency") as "INR" | "USD") ?? "INR";
  const campaignId = searchParams.get("campaignId");
  const amount = parseFloat(amountStr) || 1000;

  const preConfirmed = searchParams.get("donationId");
  const isMockConfirmed = Boolean(preConfirmed && preConfirmed.startsWith("MOCK-"));

  const [status, setStatus] = useState<"checking" | "confirmed" | "failed">(() =>
    isMockConfirmed ? "confirmed" : orderId ? "checking" : "failed"
  );
  const [errorMessage, setErrorMessage] = useState(
    orderId ? "" : "No donation order was provided."
  );
  const [milestones, setMilestones] = useState<(Milestone & { description?: string })[]>(() =>
    isMockConfirmed
      ? [
          {
            step: 1,
            label: "Contribution Held in Escrow",
            description: "Funds received via PayPal and securely held — not yet released to any NGO.",
            done: true,
            at: new Date().toISOString(),
          },
          ...DEFAULT_MILESTONES.slice(1),
        ]
      : DEFAULT_MILESTONES
  );
  const [confirmedAt, setConfirmedAt] = useState<string | null>(() =>
    isMockConfirmed ? new Date().toISOString() : null
  );

  useEffect(() => {
    if (!orderId || isMockConfirmed) return;

    let active = true;
    fetch("/api/donations/capture-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    })
      .then(async (res) => {
        const result = await res.json();
        if (!res.ok) throw new Error(result.error ?? "Payment confirmation failed.");
        if (!active) return;

        setStatus("confirmed");
        setConfirmedAt(new Date().toISOString());

        // Merge server milestones if available
        if (result.summary?.milestones?.length) {
          setMilestones(
            result.summary.milestones.map(
              (m: Milestone, i: number) => ({
                ...m,
                description: DEFAULT_MILESTONES[i]?.description,
              })
            )
          );
        } else {
          setMilestones([
            {
              step: 1,
              label: "Contribution Held in Escrow",
              description: DEFAULT_MILESTONES[0].description,
              done: true,
              at: new Date().toISOString(),
            },
            ...DEFAULT_MILESTONES.slice(1),
          ]);
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        setErrorMessage(err instanceof Error ? err.message : "Payment confirmation failed.");
        setStatus("failed");
      });

    return () => {
      active = false;
    };
  }, [orderId, searchParams]);

  const amountDisplay =
    currency === "INR" ? formatCurrency(amount) : `$${amount}`;
  const doneCount = milestones.filter((m) => m.done).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* ── Hero Success Card ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-card border border-outline-variant/70 shadow-sm p-6 md:p-8 text-center">
        {/* Icon */}
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border ${
            status === "confirmed"
              ? "bg-primary/10 border-primary/20"
              : status === "checking"
              ? "bg-secondary-container/30 border-secondary/20"
              : "bg-urgent-container/40 border-urgent/20"
          }`}
        >
          {status === "checking" ? (
            <Loader2 className="w-8 h-8 text-secondary animate-spin" />
          ) : status === "confirmed" ? (
            <CheckCircle2 className="w-9 h-9 text-primary" />
          ) : (
            <XCircle className="w-9 h-9 text-urgent" />
          )}
        </div>

        <StatusPill status={status} />

        <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface mt-2 mb-2 tracking-tight">
          {status === "confirmed"
            ? "Thank you for your relief support! 🙏"
            : status === "checking"
            ? "Verifying your donation..."
            : "Payment Could Not Be Confirmed"}
        </h1>

        <p className="text-sm text-on-surface-variant max-w-md mx-auto">
          {status === "confirmed" ? (
            <>
              Your donation of{" "}
              <strong className="text-on-surface font-bold">{amountDisplay}</strong> has been
              recorded and is now held in escrow. Funds will be released to the NGO only after
              GPS-verified field proof is approved.
            </>
          ) : status === "checking" ? (
            "Please wait while we confirm your payment with PayPal..."
          ) : (
            errorMessage
          )}
        </p>

        {/* Transaction summary grid */}
        {status === "confirmed" && (
          <div className="mt-6 max-w-sm mx-auto bg-surface-container/50 rounded-card border border-outline-variant/50 p-4 grid grid-cols-2 gap-3 text-left text-xs">
            <div>
              <span className="text-on-surface-variant block text-[11px] uppercase tracking-wider mb-0.5">Order ID</span>
              <span className="font-mono font-bold text-on-surface text-[11px] break-all">
                {orderId?.slice(0, 20)}...
              </span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-[11px] uppercase tracking-wider mb-0.5">Confirmed At</span>
              <span className="font-mono text-on-surface text-[11px]">
                {confirmedAt
                  ? new Date(confirmedAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Just now"}
              </span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-[11px] uppercase tracking-wider mb-0.5">Escrow Status</span>
              <span className="font-semibold text-primary text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Funds Secured
              </span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-[11px] uppercase tracking-wider mb-0.5">Milestones Done</span>
              <span className="font-mono font-bold text-on-surface text-[11px]">
                {doneCount} / {milestones.length}
              </span>
            </div>
          </div>
        )}

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Link
            href="/donor/impact"
            className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-input bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-xs transition-colors"
          >
            <HeartHandshake className="w-4 h-4" />
            Track My Impact Dashboard
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/transparency"
            className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-input border border-outline-variant text-on-surface text-xs font-medium hover:bg-surface-container transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-on-surface-variant" />
            Public Transparency Ledger
          </Link>
        </div>
      </div>

      {/* ── 4-Step Escrow Milestone Stepper ───────────────────────────────── */}
      <div className="bg-white rounded-card border border-outline-variant/70 shadow-sm p-6 md:p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider">
                Escrow Milestone Tracker
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-on-surface tracking-tight">
              4-Step Verification Audit Trail
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Track your funds from escrow lock to field distribution and admin-verified release.
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-extrabold text-primary">{doneCount}/{milestones.length}</div>
            <div className="text-[11px] text-on-surface-variant font-medium">Steps Complete</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-surface-container rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${(doneCount / milestones.length) * 100}%` }}
          />
        </div>

        {/* Stepper component (vertical) */}
        <Stepper steps={milestones} orientation="vertical" />

        {/* Descriptions below */}
        <div className="mt-6 space-y-3">
          {milestones.map((m, i) => (
            <div
              key={m.step}
              className={`flex items-start gap-3 p-3 rounded-input text-xs transition-all ${
                m.done
                  ? "bg-primary/5 border border-primary/15"
                  : i === doneCount
                  ? "bg-secondary-container/20 border border-secondary/20"
                  : "bg-surface-low border border-outline-variant/40 opacity-60"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  m.done
                    ? "bg-primary text-white"
                    : i === doneCount
                    ? "bg-secondary-container text-secondary-900"
                    : "bg-surface-container text-outline border border-outline-variant"
                }`}
              >
                {m.done ? (
                  <ShieldCheck className="w-3.5 h-3.5" />
                ) : i === doneCount ? (
                  <Clock className="w-3.5 h-3.5" />
                ) : (
                  <span className="font-mono font-bold text-[10px]">{m.step}</span>
                )}
              </div>
              <div>
                <p className={`font-semibold ${m.done ? "text-primary" : i === doneCount ? "text-secondary" : "text-on-surface-variant"}`}>
                  Step {m.step}: {m.label}
                </p>
                {"description" in m && m.description && (
                  <p className="text-on-surface-variant mt-0.5 leading-relaxed">
                    {m.description as string}
                  </p>
                )}
                {m.at && (
                  <p className="font-mono text-outline mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(m.at).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Back to disasters ─────────────────────────────────────────────── */}
      <div className="text-center">
        <Link
          href={campaignId ? `/disasters/${campaignId.split("-")[0]}` : "/disasters"}
          className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors font-semibold"
        >
          View other active disasters & NGOs
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function DonationConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[500px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-on-surface-variant font-medium">
              Loading confirmation...
            </span>
          </div>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
