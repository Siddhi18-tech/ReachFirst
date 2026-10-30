"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, HeartHandshake, ArrowLeft, Check, Lock, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

function DonationCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const campaignId = searchParams.get("campaignId") || "c1111111-1111-1111-1111-111111111111";

  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [addTip, setAddTip] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Preset amounts in INR
  const presetsINR = [500, 1000, 2500, 5000];
  const presetsUSD = [10, 25, 50, 100];

  const presets = currency === "INR" ? presetsINR : presetsUSD;

  // Impact explanation calculation
  const getImpactDescription = (amt: number, curr: string) => {
    const valINR = curr === "INR" ? amt : amt * 83;
    if (valINR >= 5000) {
      return "2 Comprehensive Relief Packs: Tarpaulin shelters, food rations for 2 families (10 days), and medical first-aid kits.";
    } else if (valINR >= 2500) {
      return "1 Emergency Weatherproof Tarpaulin + Mosquito Nets + Solar Lantern for displaced flood survivors.";
    } else if (valINR >= 1000) {
      return "2 Emergency Food Ration Packs containing rice, pulses, oil, and clean halogen water tablets.";
    } else {
      return "1 Family Hygiene Kit: Soap, antiseptic wipes, sanitary napkins, and water purification sachets.";
    }
  };

  const tipAmount = addTip ? Math.round(amount * 0.05) : 0;
  const totalAmount = amount + tipAmount;

  const handlePresetSelect = (val: number) => {
    setAmount(val);
    setCustomAmount("");
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmount(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(parsed);
    }
  };

  const handleCurrencyToggle = (c: "INR" | "USD") => {
    setCurrency(c);
    setAmount(c === "INR" ? 1000 : 25);
    setCustomAmount("");
  };

  const handlePaypalCheckout = async () => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // 1. Create server-side order
      const createRes = await fetch("/api/donations/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          amount: totalAmount,
          currency,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok || !createData.orderId) {
        throw new Error(createData.error || "Failed to initiate payment");
      }

      if (createData.approvalUrl) {
        window.location.assign(createData.approvalUrl);
        return;
      }

      // 2. Capture server-side order
      const captureRes = await fetch("/api/donations/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: createData.orderId,
          campaignId,
          amount,
        }),
      });

      const captureData = await captureRes.json();
      if (!captureRes.ok) {
        throw new Error(captureData.error || "Failed to confirm payment");
      }

      // 3. Redirect to donation confirmation screen
      router.push(
        `/donate/confirmation?orderId=${encodeURIComponent(createData.orderId)}&campaignId=${campaignId}&amount=${amount}&currency=${currency}`
      );
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong processing your donation.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="section max-w-4xl mx-auto py-8">
      {/* Back button */}
      <Link
        href="/disasters"
        className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors mb-6 font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to relief ranking
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left col: Donation Form (7 cols) */}
        <div className="md:col-span-7 bg-surface rounded-card border border-outline-variant/60 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-on-surface">Donation Checkout</h1>
            {/* Currency toggle */}
            <div className="flex bg-surface-container rounded-pill p-1 border border-outline-variant/60 text-xs font-mono font-bold">
              <button
                type="button"
                onClick={() => handleCurrencyToggle("INR")}
                className={`px-3 py-1 rounded-pill transition-all ${
                  currency === "INR" ? "bg-primary text-on-primary shadow-xs" : "text-on-surface-variant"
                }`}
              >
                ₹ INR
              </button>
              <button
                type="button"
                onClick={() => handleCurrencyToggle("USD")}
                className={`px-3 py-1 rounded-pill transition-all ${
                  currency === "USD" ? "bg-primary text-on-primary shadow-xs" : "text-on-surface-variant"
                }`}
              >
                $ USD
              </button>
            </div>
          </div>

          <p className="text-xs text-on-surface-variant mb-6">
            100% of your relief contribution is deposited into verified escrow and disbursed upon GPS-tagged delivery proof.
          </p>

          {/* Amount presets */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">
              Select Contribution Amount
            </label>
            <div className="grid grid-cols-4 gap-2.5 mb-3">
              {presets.map((val) => {
                const isSelected = amount === val && !customAmount;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handlePresetSelect(val)}
                    className={`py-3 px-2 rounded-card text-center font-mono font-bold text-sm transition-all border ${
                      isSelected
                        ? "border-primary bg-primary text-on-primary shadow-sm"
                        : "border-outline-variant/80 bg-surface text-on-surface hover:bg-surface-container/60"
                    }`}
                  >
                    {currency === "INR" ? `₹${val.toLocaleString()}` : `$${val}`}
                  </button>
                );
              })}
            </div>

            {/* Custom amount input */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono font-bold text-on-surface-variant">
                {currency === "INR" ? "₹" : "$"}
              </span>
              <input
                type="number"
                placeholder="Or enter custom amount"
                value={customAmount}
                onChange={handleCustomChange}
                className="w-full pl-8 pr-4 py-2.5 rounded-input bg-surface border border-outline-variant/80 focus:border-primary text-sm font-mono text-on-surface outline-none"
              />
            </div>
          </div>

          {/* Impact conversion display */}
          <div className="bg-primary-container/10 border border-primary/20 rounded-card p-4 mb-6">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-World Impact Breakdown:</span>
            </div>
            <p className="text-xs text-on-surface font-medium leading-relaxed">
              {getImpactDescription(amount, currency)}
            </p>
          </div>

          {/* Platform tip toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-input bg-surface-container/40 border border-outline-variant/40 mb-6">
            <div className="flex items-center gap-2">
              <input
                id="tip-checkbox"
                type="checkbox"
                checked={addTip}
                onChange={(e) => setAddTip(e.target.checked)}
                className="w-4 h-4 text-primary rounded accent-primary cursor-pointer"
              />
              <label htmlFor="tip-checkbox" className="text-xs text-on-surface cursor-pointer">
                Add 5% to this campaign ({currency === "INR" ? `₹${tipAmount}` : `$${tipAmount}`})
              </label>
            </div>
            <span className="text-[11px] font-mono text-on-surface-variant">Optional</span>
          </div>

          {/* Error display */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-input bg-error-container text-on-error-container text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* PayPal Checkout Button */}
          <button
            type="button"
            onClick={handlePaypalCheckout}
            disabled={isProcessing || amount <= 0}
            className="w-full py-3.5 px-4 rounded-input bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Sandbox Payment...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>
                  Pay with PayPal ({currency === "INR" ? `₹${totalAmount.toLocaleString()}` : `$${totalAmount}`})
                </span>
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-[11px] text-on-surface-variant mt-3">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>PayPal Sandbox Verified • 256-Bit SSL Escrow Protected</span>
          </div>
        </div>

        {/* Right col: Order Summary & Guarantee (5 cols) */}
        <div className="md:col-span-5 flex flex-col gap-4">
          <div className="bg-surface rounded-card border border-outline-variant/60 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-on-surface mb-3 uppercase tracking-wider">
              Allocation Summary
            </h3>

            <div className="space-y-2 text-xs border-b border-outline-variant/40 pb-3 mb-3">
              <div className="flex justify-between text-on-surface-variant">
                <span>Direct Relief Fund</span>
                <span className="font-mono text-on-surface font-semibold">
                  {currency === "INR" ? `₹${amount.toLocaleString()}` : `$${amount}`}
                </span>
              </div>
              {addTip && (
                <div className="flex justify-between text-on-surface-variant">
                  <span>Additional campaign donation (5%)</span>
                  <span className="font-mono text-on-surface font-semibold">
                    {currency === "INR" ? `₹${tipAmount}` : `$${tipAmount}`}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-on-surface-variant">
                <span>Escrow Processing Fee</span>
                <span className="font-mono text-primary font-semibold">₹0 (Free)</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm font-bold text-on-surface">
              <span>Total Payable</span>
              <span className="font-mono text-lg text-primary">
                {currency === "INR" ? `₹${totalAmount.toLocaleString()}` : `$${totalAmount}`}
              </span>
            </div>
          </div>

          {/* ReliefTrack Proof Guarantee Card */}
          <div className="bg-surface-container/60 rounded-card border border-outline-variant/60 p-5">
            <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5 mb-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>The ReliefTrack Trust Guarantee</span>
            </h4>
            <ul className="space-y-2 text-[11px] text-on-surface-variant">
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span>Funds released in tranches only after geo-tagged delivery audit.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span>Track exact GPS coordinates of supply distributions in your impact feed.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span>100% tax receipt generated instantly upon confirmation.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DonationCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <DonationCheckoutContent />
    </Suspense>
  );
}
