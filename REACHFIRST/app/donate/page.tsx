"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowLeft,
  Check,
  Lock,
  Sparkles,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { formatCurrency } from "@/lib/utils";

// ── Impact breakdown copy ──────────────────────────────────────────────────────
const IMPACT_TIERS = [
  {
    minINR: 5000,
    emoji: "🏠",
    title: "2 Comprehensive Relief Packs",
    items: [
      "Weatherproof tarpaulin shelters (2 families)",
      "10-day food rations: rice, pulses, oil",
      "Complete first-aid kit + antiseptic supplies",
      "Solar lantern for each family",
    ],
  },
  {
    minINR: 2500,
    emoji: "🛡️",
    title: "Full Emergency Shelter Kit",
    items: [
      "Heavy-duty 12×18 ft tarpaulin",
      "Mosquito nets (pack of 4)",
      "7-day food ration for 1 family",
      "Water purification tablets (100-pack)",
    ],
  },
  {
    minINR: 1000,
    emoji: "🍚",
    title: "2 Emergency Food Ration Packs",
    items: [
      "Fortified rice + pulses (5 days supply)",
      "Edible oil & spice pack",
      "Halogen water purification sachets",
      "ORS (Oral Rehydration Salts) packets",
    ],
  },
  {
    minINR: 0,
    emoji: "🧼",
    title: "1 Family Hygiene Kit",
    items: [
      "Antiseptic soap & hand sanitizer",
      "Sanitary napkins (pack of 20)",
      "Toothbrush + toothpaste",
      "Water purification sachets",
    ],
  },
];

function getImpactTier(amountINR: number) {
  return IMPACT_TIERS.find((t) => amountINR >= t.minINR) ?? IMPACT_TIERS[IMPACT_TIERS.length - 1];
}

// ── Preset amounts ─────────────────────────────────────────────────────────────
const PRESETS_INR = [500, 1000, 2500, 5000];
const PRESETS_USD = [10, 25, 50, 100];

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test";

// ── Main Checkout Component ───────────────────────────────────────────────────
function DonationCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const campaignId =
    searchParams.get("campaignId") ?? "c1000000-0000-0000-0000-000000000001";

  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [addTip, setAddTip] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const presets = currency === "INR" ? PRESETS_INR : PRESETS_USD;
  const tipAmount = addTip ? Math.round(amount * 0.05) : 0;
  const totalAmount = amount + tipAmount;
  const totalINR = currency === "USD" ? totalAmount * 83 : totalAmount;
  const impactTier = getImpactTier(totalINR);

  const handlePreset = (val: number) => {
    setAmount(val);
    setCustomAmount("");
    setErrorMsg(null);
  };

  const handleCurrencyToggle = (c: "INR" | "USD") => {
    setCurrency(c);
    setAmount(c === "INR" ? 1000 : 25);
    setCustomAmount("");
    setErrorMsg(null);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmount(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) setAmount(parsed);
  };

  // ── PayPal createOrder — Opens official PayPal checkout window ──────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createOrder = useCallback((_data: Record<string, unknown>, actions: any) => {
    setErrorMsg(null);
    const usdValue = currency === "USD" ? totalAmount : totalAmount / 83;
    const safeUsd = Math.max(1, Number(usdValue.toFixed(2))).toString();

    if (actions?.order) {
      return actions.order.create({
        intent: "CAPTURE",
        purchase_units: [
          {
            description: `ReliefTrack Escrow Donation (${currency === "INR" ? `₹${totalAmount}` : `$${totalAmount}`})`,
            amount: {
              currency_code: "USD",
              value: safeUsd,
            },
          },
        ],
      });
    }

    // Fallback to server creation if actions is missing
    return fetch("/api/donations/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignId,
        amount: totalAmount,
        tipAmount,
        currency,
      }),
    })
      .then((res) => res.json())
      .then((d) => d.orderId as string);
  }, [campaignId, totalAmount, tipAmount, currency]);

  // ── PayPal onApprove — Captures and redirects to confirmation ────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onApprove = useCallback(
    async (data: { orderID: string }, actions: any) => {
      try {
        if (actions?.order) {
          await actions.order.capture();
        }
      } catch (e) {
        console.warn("Client-side capture note:", e);
      }

      try {
        await fetch("/api/donations/capture-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: data.orderID }),
        });
      } catch (e) {
        console.warn("Server-side capture note:", e);
      }

      router.push(
        `/donate/confirmation?orderId=${encodeURIComponent(data.orderID)}&campaignId=${campaignId}&amount=${totalAmount}&currency=${currency}`
      );
    },
    [campaignId, totalAmount, currency, router]
  );

  const onError = useCallback((err: Record<string, unknown>) => {
    console.error("PayPal error:", err);
    setErrorMsg("PayPal encountered a connection error. Please try again or open PayPal directly.");
  }, []);

  return (
    <PayPalScriptProvider
      options={{
        clientId: PAYPAL_CLIENT_ID,
        currency: "USD",
        intent: "capture",
        components: "buttons",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/disasters"
          className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors mb-6 font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to relief rankings
        </Link>

        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-primary" />
            <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider">
              Escrow-Protected Checkout
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            Donate to Active Relief Campaign
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Funds are locked in escrow until GPS-verified field proof is submitted and admin-approved.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── Left: Donation Form (7 cols) ───────────────────────────────── */}
          <div className="lg:col-span-7 space-y-5">
            {/* Currency Toggle */}
            <div className="flex items-center justify-between p-4 bg-white rounded-card border border-outline-variant/70 shadow-xs">
              <span className="text-sm font-bold text-on-surface">Select Currency</span>
              <div className="flex bg-surface-container rounded-pill p-1 border border-outline-variant/60 text-xs font-mono font-bold gap-1">
                {(["INR", "USD"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleCurrencyToggle(c)}
                    className={`px-4 py-1.5 rounded-pill transition-all cursor-pointer ${
                      currency === c
                        ? "bg-primary text-white shadow-xs"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {c === "INR" ? "₹ INR" : "$ USD"}
                  </button>
                ))}
              </div>
            </div>

            {/* Preset Amounts */}
            <div className="p-5 bg-white rounded-card border border-outline-variant/70 shadow-xs space-y-4">
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                Select Contribution Amount
              </label>

              <div className="grid grid-cols-4 gap-2.5">
                {presets.map((val) => {
                  const isSelected = amount === val && !customAmount;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handlePreset(val)}
                      className={`py-3.5 px-2 rounded-card text-center font-mono font-bold text-sm transition-all border cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary text-white shadow-sm scale-[1.02]"
                          : "border-outline-variant/80 bg-surface text-on-surface hover:bg-surface-container/60 hover:border-primary/50"
                      }`}
                    >
                      {currency === "INR" ? `₹${val.toLocaleString("en-IN")}` : `$${val}`}
                    </button>
                  );
                })}
              </div>

              {/* Custom amount */}
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                  Or enter a custom amount
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono font-bold text-on-surface-variant select-none">
                    {currency === "INR" ? "₹" : "$"}
                  </span>
                  <input
                    type="number"
                    min="1"
                    placeholder={currency === "INR" ? "e.g. 1500" : "e.g. 20"}
                    value={customAmount}
                    onChange={handleCustomChange}
                    className="w-full pl-9 pr-4 py-2.5 rounded-input bg-surface border border-outline-variant/80 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm font-mono text-on-surface outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Platform Tip */}
            <div className="p-4 bg-white rounded-card border border-outline-variant/70 shadow-xs">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    id="tip-toggle"
                    type="checkbox"
                    checked={addTip}
                    onChange={(e) => setAddTip(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-surface-container border border-outline-variant/80 rounded-full peer-checked:bg-primary transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-xs transition-transform peer-checked:translate-x-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-on-surface">
                      Add 5% platform tip
                    </span>
                    {addTip && (
                      <span className="text-xs font-mono font-bold text-primary">
                        +{currency === "INR" ? `₹${tipAmount}` : `$${tipAmount}`}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Helps cover transparency infrastructure, audit tools & platform costs.
                  </p>
                </div>
              </label>
            </div>

            {/* Impact Breakdown */}
            <div className="p-5 bg-primary-container/10 border border-primary/20 rounded-card">
              <div className="flex items-center gap-2 text-xs font-bold text-primary mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  Your {currency === "INR" ? formatCurrency(totalINR) : `$${totalAmount}`} provides...
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{impactTier.emoji}</span>
                <div>
                  <p className="text-sm font-bold text-on-surface mb-2">{impactTier.title}</p>
                  <ul className="space-y-1">
                    {impactTier.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-on-surface-variant">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Error display */}
            {errorMsg && (
              <div className="p-3.5 rounded-input bg-urgent-container/40 border border-urgent/30 text-xs text-urgent flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            {/* ── Official PayPal Buttons (Opens PayPal checkout page / popup) ── */}
            <div className="rounded-card border border-outline-variant/70 overflow-hidden bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  Official PayPal Checkout
                </p>
                <span className="text-xs font-mono font-extrabold text-primary">
                  {currency === "INR" ? formatCurrency(totalAmount) : `$${totalAmount}`}
                </span>
              </div>

              <p className="text-xs text-on-surface-variant leading-relaxed">
                Clicking the PayPal button below launches the <strong>official PayPal checkout page</strong> where you can sign in to your PayPal account or pay securely with a card.
              </p>

              {/* Real PayPal Buttons Component from @paypal/react-paypal-js */}
              <div className="min-h-[100px] flex flex-col justify-center">
                <PayPalButtons
                  style={{
                    layout: "vertical",
                    color: "gold",
                    shape: "rect",
                    label: "paypal",
                    height: 48,
                  }}
                  createOrder={createOrder}
                  onApprove={onApprove}
                  onError={onError}
                  disabled={amount <= 0}
                />
              </div>

              {/* Direct Link to PayPal Sandbox Portal */}
              <div className="pt-2 border-t border-outline-variant/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                <span className="text-[11px] text-on-surface-variant font-mono">
                  PayPal Sandbox Gateway Active
                </span>
                <a
                  href="https://www.sandbox.paypal.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline font-bold"
                >
                  <span>Open PayPal Sandbox in new window</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-on-surface-variant pt-1 border-t border-outline-variant/40">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>PayPal SSL Verified • Zero-fee Escrow Protection</span>
              </div>
            </div>
          </div>

          {/* ── Right: Order Summary + Guarantee (5 cols) ──────────────────── */}
          <div className="lg:col-span-5 flex flex-col gap-4 lg:sticky lg:top-20">
            {/* Order Summary */}
            <div className="bg-white rounded-card border border-outline-variant/70 p-5 shadow-xs">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-4">
                Allocation Summary
              </h3>

              <div className="space-y-2.5 text-xs border-b border-outline-variant/40 pb-3 mb-3">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Direct Relief Fund</span>
                  <span className="font-mono text-on-surface font-semibold">
                    {currency === "INR" ? formatCurrency(amount) : `$${amount}`}
                  </span>
                </div>
                {addTip && (
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Platform tip (5%)</span>
                    <span className="font-mono text-on-surface font-semibold">
                      {currency === "INR" ? formatCurrency(tipAmount) : `$${tipAmount}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-on-surface-variant">
                  <span>Escrow Processing Fee</span>
                  <span className="font-mono text-primary font-semibold">FREE</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-on-surface">Total Payable</span>
                <span className="font-mono text-xl font-extrabold text-primary">
                  {currency === "INR" ? formatCurrency(totalAmount) : `$${totalAmount}`}
                </span>
              </div>

              {currency === "USD" && (
                <p className="text-[11px] text-on-surface-variant font-mono mt-1 text-right">
                  ≈ {formatCurrency(totalINR)} INR
                </p>
              )}
            </div>

            {/* Escrow Guarantee */}
            <div className="bg-surface-container/50 rounded-card border border-outline-variant/60 p-5">
              <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5 mb-3">
                <ShieldCheck className="w-4 h-4 text-primary" />
                ReliefTrack Escrow Guarantee
              </h4>
              <ul className="space-y-2.5">
                {[
                  "Funds released in tranches only after GPS-tagged delivery audit.",
                  "Every proof photo is verified for EXIF coordinates by admin.",
                  "Track real-time disbursements on the public transparency ledger.",
                  "Zero upfront release — NGO gets paid only for verified work.",
                ].map((point, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-on-surface-variant">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Campaign ID badge */}
            <div className="p-3 rounded-input bg-surface border border-outline-variant/60 text-[11px] font-mono text-on-surface-variant">
              <span className="font-bold text-on-surface">Campaign ID: </span>
              {campaignId.slice(0, 18)}...
            </div>
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}

export default function DonationCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[500px] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DonationCheckoutContent />
    </Suspense>
  );
}
