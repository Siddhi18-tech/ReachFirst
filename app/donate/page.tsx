"use client";

import { useState, useMemo, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import {
  ShieldCheck,
  ArrowLeft,
  Check,
  Loader2,
  Sparkles,
  AlertCircle,
  Droplets,
  PackageCheck,
  Home,
  Heart,
  ExternalLink,
  Info,
  Zap,
  LogIn,
} from "lucide-react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Toast, ToastProps } from "@/components/ui/Toast";
import type { DonationSummary } from "@/types/api";

// Preset contribution amounts
const PRESETS_INR = [500, 1000, 2500, 5000];
const PRESETS_USD = [10, 25, 50, 100];

interface ToastState extends Omit<ToastProps, "onClose"> {
  id: string;
}

function DonationCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status: authStatus } = useSession();

  // Campaign ID from URL query
  const campaignId =
    searchParams.get("campaignId") || "c1000000-0000-0000-0000-000000000001";

  // Form states
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [addTip, setAddTip] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDemoProcessing, setIsDemoProcessing] = useState(false);
  const [isDemoLoggingIn, setIsDemoLoggingIn] = useState(false);

  // Toast notification state
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const toastCountRef = useRef(0);

  const addToast = (toast: Omit<ToastState, "id">) => {
    toastCountRef.current += 1;
    const id = `toast-${toastCountRef.current}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const presets = currency === "INR" ? PRESETS_INR : PRESETS_USD;

  // Tip calculation (5% optional platform tip)
  const tipAmount = addTip ? Math.round(amount * 0.05 * 100) / 100 : 0;
  const totalAmount = Math.round((amount + tipAmount) * 100) / 100;
  const isValidAmount = !isNaN(amount) && amount > 0 && amount <= 1000000;

  // Normalized INR equivalent for supply calculation (USD @ ₹83)
  const inrEquivalent = currency === "INR" ? amount : amount * 83;

  // Proportional supply breakdown calculations
  const supplyBreakdown = useMemo(() => {
    const val = inrEquivalent;
    const waterCans = Math.max(1, Math.floor(val / 80)); // ₹80 per 20L can
    const foodPackets = Math.max(1, Math.floor(val / 150)); // ₹150 per family packet
    const tarpaulins = Math.floor(val / 350); // ₹350 per weatherproof sheet
    const hygieneKits = Math.floor(val / 250); // ₹250 per hygiene kit

    return {
      waterCans,
      foodPackets,
      tarpaulins,
      hygieneKits,
      litersWater: waterCans * 20,
    };
  }, [inrEquivalent]);

  // Handle preset selection
  const handlePresetSelect = (val: number) => {
    setAmount(val);
    setCustomAmount("");
  };

  // Handle custom amount input
  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmount(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(parsed);
    } else if (val === "") {
      setAmount(0);
    }
  };

  // Handle currency toggle
  const handleCurrencyToggle = (c: "INR" | "USD") => {
    if (c === currency) return;
    setCurrency(c);
    setCustomAmount("");
    if (c === "INR") {
      setAmount(1000);
    } else {
      setAmount(25);
    }
  };

  // Quick 1-click login as demo donor
  const handleQuickDemoLogin = async () => {
    setIsDemoLoggingIn(true);
    try {
      const res = await signIn("credentials", {
        email: "donor@demo.com",
        password: "demo1234",
        redirect: false,
      });
      if (res?.error) {
        addToast({
          type: "error",
          title: "Sign in Failed",
          message: res.error,
        });
      } else {
        addToast({
          type: "success",
          title: "Signed In as Demo Donor",
          message: "You can now complete your donation with full escrow tracking.",
        });
      }
    } catch {
      addToast({
        type: "error",
        title: "Sign in Failed",
        message: "Could not authenticate demo donor account.",
      });
    } finally {
      setIsDemoLoggingIn(false);
    }
  };

  // 1. Create order on server
  const handleCreateOrder = async (): Promise<string> => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/donations/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          amount,
          tipAmount,
          currency,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.orderId) {
        if (res.status === 401) {
          addToast({
            type: "warning",
            title: "Authentication Required",
            message: "Please sign in as a donor before initiating a donation.",
          });
          throw new Error("Please sign in as a donor");
        }
        throw new Error(data.error || "Failed to create donation order");
      }

      return data.orderId;
    } catch (err: unknown) {
      setIsProcessing(false);
      const msg = err instanceof Error ? err.message : "Failed to initiate payment";
      addToast({
        type: "error",
        title: "Order Creation Failed",
        message: msg,
      });
      throw err;
    }
  };

  // 2. On approve, capture on server and redirect to confirmation
  const handleApprove = async (data: { orderID: string }) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/donations/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.orderID }),
      });

      const summary: DonationSummary = await res.json();
      if (!res.ok) {
        const errorMsg =
          (summary as unknown as { error?: string })?.error ||
          "Failed to capture donation.";
        throw new Error(errorMsg);
      }

      addToast({
        type: "success",
        title: "Payment Captured",
        message: "Escrow deposit locked successfully. Redirecting to audit trail...",
      });

      // Route to confirmation screen with donation ID
      router.push(
        `/donate/confirmation?id=${encodeURIComponent(summary.id)}&orderId=${encodeURIComponent(
          data.orderID
        )}&amount=${encodeURIComponent(summary.amount)}&currency=${encodeURIComponent(
          summary.currency
        )}&campaignId=${encodeURIComponent(campaignId)}`
      );
    } catch (err: unknown) {
      setIsProcessing(false);
      const msg = err instanceof Error ? err.message : "Capture failed";
      addToast({
        type: "error",
        title: "Capture Error",
        message: msg,
      });
    }
  };

  // Fast simulated instant escrow checkout (for seamless hackathon demo runs)
  const handleFastDemoCheckout = async () => {
    if (!isValidAmount || isDemoProcessing) return;
    setIsDemoProcessing(true);

    try {
      // Create order
      const createRes = await fetch("/api/donations/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          amount,
          tipAmount,
          currency,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok || !createData.orderId) {
        if (createRes.status === 401) {
          // If not logged in, auto-login demo donor and retry
          const signRes = await signIn("credentials", {
            email: "donor@demo.com",
            password: "demo1234",
            redirect: false,
          });
          if (signRes?.ok) {
            const retryRes = await fetch("/api/donations/create-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                campaignId,
                amount,
                tipAmount,
                currency,
              }),
            });
            const retryData = await retryRes.json();
            if (!retryRes.ok || !retryData.orderId) {
              throw new Error(retryData.error || "Failed to create order");
            }
            return await executeCapture(retryData.orderId);
          }
        }
        throw new Error(createData.error || "Failed to initialize order");
      }

      await executeCapture(createData.orderId);
    } catch (err: unknown) {
      setIsDemoProcessing(false);
      const msg = err instanceof Error ? err.message : "Instant checkout error";
      addToast({
        type: "error",
        title: "Checkout Error",
        message: msg,
      });
    }
  };

  const executeCapture = async (orderId: string) => {
    const captureRes = await fetch("/api/donations/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });

    const summary: DonationSummary = await captureRes.json();
    if (!captureRes.ok) {
      throw new Error(
        (summary as unknown as { error?: string })?.error ||
          "Failed to capture donation"
      );
    }

    router.push(
      `/donate/confirmation?id=${encodeURIComponent(summary.id)}&orderId=${encodeURIComponent(
        orderId
      )}&amount=${encodeURIComponent(summary.amount)}&currency=${encodeURIComponent(
        summary.currency
      )}&campaignId=${encodeURIComponent(campaignId)}`
    );
  };

  return (
    <div className="section max-w-5xl mx-auto py-8">
      {/* Toast Notification Container */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} onClose={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>

      {/* Breadcrumb / Back Link */}
      <div className="mb-6">
        <Link
          href="/map"
          className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Live Disaster Map</span>
        </Link>
      </div>

      {/* Guest Notice Banner if not logged in */}
      {authStatus === "unauthenticated" && (
        <div className="mb-6 p-4 rounded-card bg-secondary-container/30 border border-secondary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-secondary shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-on-surface">Donating as Guest:</span>{" "}
              <span className="text-on-surface-variant">
                Sign in with the demo donor account to track this donation on your
                impact dashboard.
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleQuickDemoLogin}
            isLoading={isDemoLoggingIn}
            className="shrink-0 text-xs font-semibold"
          >
            <LogIn className="w-3.5 h-3.5 mr-1.5" />
            Quick Sign In (donor@demo.com)
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Donation Form & Checkout (7 Cols) */}
        <div className="lg:col-span-7 bg-surface rounded-card border border-outline-variant/60 p-6 md:p-8 shadow-sm">
          {/* Form Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-outline-variant/40">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="PLATFORM" dot>
                  Verified Escrow
                </Badge>
                <span className="text-[11px] font-mono text-on-surface-variant">
                  Campaign #{campaignId.slice(0, 8)}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
                Crisis Relief Donation
              </h1>
            </div>

            {/* Currency Toggle */}
            <div className="flex bg-surface-container rounded-pill p-1 border border-outline-variant/60 text-xs font-mono font-bold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => handleCurrencyToggle("INR")}
                className={`px-3 py-1.5 rounded-pill transition-all cursor-pointer ${
                  currency === "INR"
                    ? "bg-primary text-white shadow-xs font-extrabold"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                ₹ INR
              </button>
              <button
                type="button"
                onClick={() => handleCurrencyToggle("USD")}
                className={`px-3 py-1.5 rounded-pill transition-all cursor-pointer ${
                  currency === "USD"
                    ? "bg-primary text-white shadow-xs font-extrabold"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                $ USD
              </button>
            </div>
          </div>

          <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
            Every rupee is locked in a cryptographic smart escrow vault. Funds are only
            disbursed in tranches after field volunteers upload verified GPS-tagged
            proof of aid distribution.
          </p>

          {/* Preset Buttons */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2.5">
              Select Preset Contribution
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
              {presets.map((val) => {
                const isSelected = amount === val && !customAmount;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handlePresetSelect(val)}
                    className={`py-3 px-3 rounded-card text-center font-mono font-bold text-sm transition-all border cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary text-white shadow-xs ring-2 ring-primary/20 scale-[1.02]"
                        : "border-outline-variant/80 bg-surface text-on-surface hover:bg-surface-container/60 hover:border-outline"
                    }`}
                  >
                    {currency === "INR" ? `₹${val.toLocaleString()}` : `$${val}`}
                  </button>
                );
              })}
            </div>

            {/* Custom Amount Input */}
            <div>
              <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                Or enter custom amount ({currency})
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono font-bold text-on-surface-variant">
                  {currency === "INR" ? "₹" : "$"}
                </span>
                <input
                  type="number"
                  placeholder={
                    currency === "INR"
                      ? "Custom amount (e.g. 7500)"
                      : "Custom amount (e.g. 75)"
                  }
                  value={customAmount}
                  onChange={handleCustomChange}
                  min="1"
                  max="1000000"
                  step="any"
                  className="w-full pl-8 pr-4 py-2.5 rounded-input bg-surface border border-outline-variant/80 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm font-mono text-on-surface outline-none transition-all"
                />
              </div>
              {!isValidAmount && (
                <p className="text-[11px] text-error mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Please enter a valid contribution amount greater than 0.
                </p>
              )}
            </div>
          </div>

          {/* Live "Your ₹X provides..." Supply Breakdown */}
          <div className="bg-primary-container/10 border border-primary/20 rounded-card p-4 md:p-5 mb-6">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>
                Your {currency === "INR" ? `₹${amount.toLocaleString()}` : `$${amount}`}{" "}
                Provides Direct Relief:
              </span>
            </div>

            <p className="text-xs text-on-surface font-medium leading-relaxed mb-3">
              {inrEquivalent >= 5000
                ? "Immediate emergency survival package covering nutrition, shelter, and medical essentials for multiple displaced families:"
                : inrEquivalent >= 2500
                ? "High-impact protection kit providing weatherproof shelter, hygiene security, and clean drinking water:"
                : inrEquivalent >= 1000
                ? "Emergency nutrition and hydration supply kits for stranded crisis survivors:"
                : "Essential daily hydration and emergency antiseptic hygiene packs:"}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-primary/10">
              <div className="bg-surface/80 rounded-md p-2 border border-outline-variant/40 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="font-mono font-bold text-xs text-on-surface truncate">
                    {supplyBreakdown.litersWater}L
                  </div>
                  <div className="text-[10px] text-on-surface-variant leading-tight">
                    Clean Water
                  </div>
                </div>
              </div>

              <div className="bg-surface/80 rounded-md p-2 border border-outline-variant/40 flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-secondary shrink-0" />
                <div className="min-w-0">
                  <div className="font-mono font-bold text-xs text-on-surface truncate">
                    {supplyBreakdown.foodPackets} pkts
                  </div>
                  <div className="text-[10px] text-on-surface-variant leading-tight">
                    Food Rations
                  </div>
                </div>
              </div>

              <div className="bg-surface/80 rounded-md p-2 border border-outline-variant/40 flex items-center gap-2">
                <Home className="w-4 h-4 text-tertiary shrink-0" />
                <div className="min-w-0">
                  <div className="font-mono font-bold text-xs text-on-surface truncate">
                    {supplyBreakdown.tarpaulins > 0
                      ? `${supplyBreakdown.tarpaulins} tarps`
                      : "Shelter kit"}
                  </div>
                  <div className="text-[10px] text-on-surface-variant leading-tight">
                    Weatherproof
                  </div>
                </div>
              </div>

              <div className="bg-surface/80 rounded-md p-2 border border-outline-variant/40 flex items-center gap-2">
                <Heart className="w-4 h-4 text-urgent shrink-0" />
                <div className="min-w-0">
                  <div className="font-mono font-bold text-xs text-on-surface truncate">
                    {supplyBreakdown.hygieneKits > 0
                      ? `${supplyBreakdown.hygieneKits} kits`
                      : "Sanitation"}
                  </div>
                  <div className="text-[10px] text-on-surface-variant leading-tight">
                    Hygiene Kits
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Optional 5% Platform Tip Checkbox */}
          <div className="p-4 rounded-input bg-surface-container/40 border border-outline-variant/60 mb-6 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <input
                id="tip-checkbox"
                type="checkbox"
                checked={addTip}
                onChange={(e) => setAddTip(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-primary rounded accent-primary cursor-pointer shrink-0"
              />
              <label htmlFor="tip-checkbox" className="text-xs text-on-surface cursor-pointer select-none">
                <span className="font-semibold block text-on-surface">
                  Add 5% voluntary platform tip
                </span>
                <span className="text-[11px] text-on-surface-variant block mt-0.5">
                  Helps ReliefTrack maintain zero transaction fees for field NGOs and
                  run real-time EXIF geolocation audits.
                </span>
              </label>
            </div>
            <div className="text-right shrink-0">
              <span className="font-mono font-bold text-xs text-primary block">
                +{currency === "INR" ? `₹${tipAmount.toLocaleString()}` : `$${tipAmount}`}
              </span>
              <span className="text-[10px] text-on-surface-variant uppercase font-mono">
                Optional
              </span>
            </div>
          </div>

          {/* PayPal Checkout Section */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Secure Payment Options</span>
              <span className="text-[11px] font-normal text-on-surface-variant font-mono">
                256-Bit Escrow Vault
              </span>
            </div>

            {/* Official PayPal Buttons Container */}
            <div
              className={`p-3 rounded-card border border-outline-variant/60 bg-surface-container/20 transition-all ${
                !isValidAmount ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <PayPalScriptProvider
                key={currency}
                options={{
                  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
                  currency: "USD", // PayPal Sandbox standard currency for sandbox testing
                  intent: "capture",
                }}
              >
                <PayPalButtons
                  style={{
                    layout: "vertical",
                    color: "gold",
                    shape: "rect",
                    label: "paypal",
                    height: 44,
                  }}
                  disabled={!isValidAmount || isProcessing || isDemoProcessing}
                  createOrder={handleCreateOrder}
                  onApprove={handleApprove}
                  onError={(err) => {
                    console.error("PayPal Error:", err);
                    addToast({
                      type: "error",
                      title: "PayPal Sandbox Notice",
                      message:
                        "PayPal Sandbox could not complete with mock credentials. Use the instant demo button below.",
                    });
                  }}
                  onCancel={() => {
                    addToast({
                      type: "warning",
                      title: "Donation Cancelled",
                      message: "Payment was cancelled. Your account was not charged.",
                    });
                  }}
                />
              </PayPalScriptProvider>
            </div>

            {/* Fast 1-Click Demo Escrow Button for Judges & Offline Testing */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-outline-variant/60"></div>
              <span className="flex-shrink mx-3 text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">
                or hackathon instant checkout
              </span>
              <div className="flex-grow border-t border-outline-variant/60"></div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleFastDemoCheckout}
              disabled={!isValidAmount || isProcessing || isDemoProcessing}
              isLoading={isDemoProcessing}
              className="w-full text-xs font-bold tracking-wide"
            >
              <Zap className="w-4 h-4 mr-1.5 text-secondary-container" />
              <span>
                Instant Escrow Deposit (Demo Mode) —{" "}
                {currency === "INR"
                  ? `₹${totalAmount.toLocaleString()}`
                  : `$${totalAmount}`}
              </span>
            </Button>
          </div>

          {/* Security Guarantee Pill */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-on-surface-variant mt-4 text-center">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>
              100% Escrow Protected • Disbursed Only Upon Verified Field Delivery
            </span>
          </div>
        </div>

        {/* Right Column: Order Summary & Guarantee (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Order Summary Card */}
          <div className="bg-surface rounded-card border border-outline-variant/60 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-on-surface mb-4 uppercase tracking-wider flex items-center justify-between">
              <span>Financial Allocation</span>
              <Badge variant="platform">100% Direct Relief</Badge>
            </h3>

            <div className="space-y-3 text-xs border-b border-outline-variant/40 pb-4 mb-4">
              <div className="flex justify-between items-center text-on-surface-variant">
                <span>Relief Fund Escrow</span>
                <span className="font-mono text-on-surface font-bold text-sm">
                  {currency === "INR" ? `₹${amount.toLocaleString()}` : `$${amount}`}
                </span>
              </div>

              {addTip && (
                <div className="flex justify-between items-center text-on-surface-variant">
                  <span>Platform Operations Tip (5%)</span>
                  <span className="font-mono text-on-surface font-semibold">
                    {currency === "INR" ? `₹${tipAmount.toLocaleString()}` : `$${tipAmount}`}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-on-surface-variant">
                <span>Escrow Fee & Processing</span>
                <span className="font-mono text-tertiary font-bold">₹0 (Free)</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-base font-extrabold text-on-surface">
              <span>Total Payable</span>
              <span className="font-mono text-xl text-primary font-black">
                {currency === "INR"
                  ? `₹${totalAmount.toLocaleString()}`
                  : `$${totalAmount}`}
              </span>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-1.5">
              Held safely in escrow until photo & GPS verified delivery.
            </p>
          </div>

          {/* ReliefTrack Escrow Guarantee Card */}
          <div className="bg-surface-container/60 rounded-card border border-outline-variant/60 p-6">
            <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5 mb-3 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>The ReliefTrack Trust Guarantee</span>
            </h4>

            <ul className="space-y-3 text-xs text-on-surface-variant">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-on-surface font-semibold">Tranche-Based Release:</strong>{" "}
                  NGOs receive funds only after field volunteers deliver supplies and upload EXIF-stamped photos.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-on-surface font-semibold">Audited Geolocation:</strong>{" "}
                  Every relief parcel is logged with satellite latitude, longitude, and ground timestamps.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-on-surface font-semibold">Public Transparency:</strong>{" "}
                  Every rupee appears on the immutable public ledger for total donor accountability.
                </span>
              </li>
            </ul>

            <div className="mt-4 pt-3 border-t border-outline-variant/40 flex items-center justify-between text-[11px]">
              <Link
                href="/transparency"
                className="text-primary hover:underline font-semibold inline-flex items-center gap-1"
              >
                <span>View public ledger</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <span className="font-mono text-on-surface-variant">Zero leakage</span>
            </div>
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
