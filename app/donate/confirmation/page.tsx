"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, MapPin, ArrowRight, Download, Clock, PackageCheck, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("token") || searchParams.get("orderId");
  const amountStr = searchParams.get("amount") || "1000";
  const currency = searchParams.get("currency") || "INR";
  const amount = parseFloat(amountStr) || 1000;
  const [status, setStatus] = useState<"checking" | "confirmed" | "failed">(() => orderId ? "checking" : "failed");
  const [errorMessage, setErrorMessage] = useState(() => orderId ? "" : "No donation order was provided.");

  useEffect(() => {
    if (!orderId) return;
    let active = true;
    fetch("/api/donations/capture-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    }).then(async (res) => {
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Payment confirmation failed.");
      if (active) setStatus("confirmed");
    }).catch((error: unknown) => {
      if (active) {
        setErrorMessage(error instanceof Error ? error.message : "Payment confirmation failed.");
        setStatus("failed");
      }
    });
    return () => { active = false; };
  }, [orderId]);

  return (
    <div className="section max-w-3xl mx-auto py-10">
      {/* Success Card */}
      <div className="bg-surface rounded-card border border-outline-variant/60 p-6 md:p-8 shadow-sm text-center mb-8">
        <div className="w-16 h-16 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
          {status === "checking" ? <Clock className="w-8 h-8 animate-pulse text-primary" /> : <CheckCircle2 className="w-10 h-10 text-primary" />}
        </div>

        <span className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
          {status === "checking" ? "Verifying payment" : status === "confirmed" ? "Payment captured" : "Payment not confirmed"}
        </span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface mt-1 mb-2">
          Thank you for your relief support!
        </h1>
        <p className="text-sm text-on-surface-variant max-w-lg mx-auto mb-6">
          {status === "confirmed" ? "Your donation of" : "Donation amount"}{" "}
          <strong className="text-on-surface font-bold">
            {currency === "INR" ? `₹${amount.toLocaleString()}` : `$${amount}`}
          </strong>{" "}
          {status === "confirmed" ? "has been recorded for this campaign." : status === "checking" ? "is being verified with PayPal." : errorMessage}
        </p>

        {/* Transaction Summary Box */}
        <div className="bg-surface-container/60 rounded-card p-4 border border-outline-variant/40 max-w-md mx-auto grid grid-cols-2 gap-3 text-left text-xs mb-6">
          <div>
            <span className="text-on-surface-variant block text-[11px]">PayPal Order ID</span>
            <span className="font-mono font-bold text-on-surface truncate block">{orderId || "—"}</span>
          </div>
          <div>
            <span className="text-on-surface-variant block text-[11px]">Timestamp</span>
            <span className="font-mono text-on-surface">{status === "confirmed" ? "Confirmed" : "Pending verification"}</span>
          </div>
          <div>
            <span className="text-on-surface-variant block text-[11px]">Escrow Status</span>
            <span className={`font-semibold ${status === "confirmed" ? "text-primary" : "text-on-surface-variant"}`}>{status === "confirmed" ? "● Payment confirmed" : "● Awaiting confirmation"}</span>
          </div>
          <div>
            <span className="text-on-surface-variant block text-[11px]">Audit Track ID</span>
            <span className="font-mono text-on-surface">{orderId?.slice(-12) || "—"}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/donor/impact"
            className="py-2.5 px-5 rounded-input bg-primary text-on-primary text-xs font-bold hover:bg-primary-hover shadow-sm transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <span>Track in My Impact Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            href="/transparency"
            className="py-2.5 px-5 rounded-input border border-outline text-on-surface text-xs font-medium hover:bg-surface-container transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-on-surface-variant" />
            <span>View Public Transparency Feed</span>
          </Link>
        </div>
      </div>

      {/* Real-Time Milestone Verification Timeline */}
      <div className="bg-surface rounded-card border border-outline-variant/60 p-6 shadow-sm">
        <h2 className="text-base font-bold text-on-surface mb-1 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span>4-Step Milestone Audit Trail</span>
        </h2>
        <p className="text-xs text-on-surface-variant mb-6">
          Track the live progression of your funds from donor escrow to ground beneficiary.
        </p>

        <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-outline-variant/60 before:h-[80%]">
          {/* Step 1 */}
          <div className="flex items-start gap-4 relative">
            <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold shrink-0 z-10">
              ✓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-on-surface">1. Contribution Confirmed & Held in Escrow</h4>
                <span className="text-[10px] font-mono bg-primary-container text-on-primary-container px-2 py-0.5 rounded-pill font-bold">
                  Completed
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Funds received via PayPal Sandbox and assigned to responding disaster team.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-4 relative">
            <div className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-xs font-bold shrink-0 z-10">
              2
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-on-surface">2. Relief Material Procurement & Packaging</h4>
                <span className="text-[10px] font-mono bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-pill font-bold">
                  In Progress
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                NGO team is purchasing emergency food rations and medical supplies with proof invoice.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-4 relative">
            <div className="w-7 h-7 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center text-xs font-bold shrink-0 z-10">
              3
            </div>
            <div>
              <h4 className="text-sm font-bold text-on-surface">3. Field Distribution with GPS & Timestamp Proof</h4>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Volunteers take geo-tagged photos during distribution to affected families.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start gap-4 relative">
            <div className="w-7 h-7 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center text-xs font-bold shrink-0 z-10">
              4
            </div>
            <div>
              <h4 className="text-sm font-bold text-on-surface">4. Admin Audit Verification & Escrow Payout</h4>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Admin checks EXIF metadata and receipts before releasing reimbursement to NGO.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DonationConfirmationPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading confirmation...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
