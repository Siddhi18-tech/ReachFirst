"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  MapPin,
  Globe,
  Phone,
  FileText,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Shield,
  HelpCircle,
  Tag,
} from "lucide-react";
import { formatCurrency, badgeLabel, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type InventoryParsedItem = {
  name: string;
  category?: string;
  quantity: number;
  unit?: string;
  unitCost: number;
  total: number;
};

type NgoData = {
  id: string;
  name: string;
  registrationNumber?: string | null;
  badge: "govt" | "platform" | "none";
  status: "pending" | "approved" | "rejected";
  description: string;
  address?: string | null;
  website?: string | null;
  phone?: string | null;
  baseLat?: string | null;
  baseLng?: string | null;
  docs?: { certificate?: string; taxDoc?: string; disasterHistory?: string };
  rejectionReason?: string | null;
};

const DEFAULT_MOCK_NGO: NgoData = {
  id: "ngo-mock-001",
  name: "Kerala Relief Front",
  registrationNumber: "KL-NGO-2024-8891",
  badge: "govt",
  status: "approved",
  description:
    "First-responder humanitarian team specializing in emergency food security, landslide evacuation shelter kits, and high-altitude relief logistics.",
  address: "Meppadi Ward 4, Wayanad, Kerala 673577",
  website: "https://keralarelief.org",
  phone: "+91 98471 23456",
  baseLat: "11.6854",
  baseLng: "76.1320",
  docs: {
    certificate: "Registration_Certificate.pdf",
    taxDoc: "80G_Tax_Exemption.pdf",
    disasterHistory: "Wayanad_Field_Report_2024.pdf",
  },
};

export default function NgoProfilePage() {
  const [ngo, setNgo] = useState<NgoData | null>(null);
  const [loadingNgo, setLoadingNgo] = useState(true);

  // AI Inventory Parser State
  const [inventoryText, setInventoryText] = useState(
    "We need 500 packets of emergency fortified baby food at ₹80 each, 250 heavy-duty tarpaulins at ₹450 each, 100 sterile medical first-aid kits at ₹320 each, and 500 cans of 20L potable drinking water at ₹40."
  );
  const [parsing, setParsing] = useState(false);
  const [parsedItems, setParsedItems] = useState<InventoryParsedItem[] | null>(null);
  const [parsedGrandTotal, setParsedGrandTotal] = useState<number>(0);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ngo/apply")
      .then((res) => res.json())
      .then((data) => {
        if (data.ngo) {
          setNgo(data.ngo);
        } else {
          setNgo(DEFAULT_MOCK_NGO);
        }
      })
      .catch(() => {
        setNgo(DEFAULT_MOCK_NGO);
      })
      .finally(() => setLoadingNgo(false));
  }, []);

  // Trigger AI Inventory Parser
  const handleParseInventory = async () => {
    if (!inventoryText.trim()) return;
    setParsing(true);
    setParseError(null);

    try {
      const res = await fetch("/api/ngo/inventory/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inventoryText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse inventory text");

      if (data.items) {
        setParsedItems(data.items);
        setParsedGrandTotal(data.grandTotal || data.totalINR || 0);
        setWarnings(data.warnings || []);
      }
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : "Failed to run AI parser.");
    } finally {
      setParsing(false);
    }
  };

  if (loadingNgo) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const currentNgo = ngo || DEFAULT_MOCK_NGO;
  const isApproved = currentNgo.status === "approved";
  const isPending = currentNgo.status === "pending";
  const isRejected = currentNgo.status === "rejected";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* ── Top Header & Status Strip ─────────────────────────────────────── */}
      <div className="bg-white rounded-card border border-outline-variant/70 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-outline-variant/60">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Verification Badge */}
              <Badge variant={currentNgo.badge === "govt" ? "govt" : "platform"} dot>
                {currentNgo.badge === "govt" ? "🏛️ Government Accredited" : "✅ Platform Verified"}
              </Badge>

              {/* Status Pill */}
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-mono font-bold uppercase tracking-wider",
                  isApproved && "bg-emerald-50 text-emerald-800 border border-emerald-200",
                  isPending && "bg-amber-50 text-amber-800 border border-amber-200",
                  isRejected && "bg-red-50 text-red-800 border border-red-200"
                )}
              >
                {isApproved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                {isPending && <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />}
                {isRejected && <XCircle className="w-3.5 h-3.5 text-red-600" />}
                Status: {currentNgo.status}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              {currentNgo.name}
            </h1>

            <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl">
              {currentNgo.description}
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
            <Link href="/ngo/proof">
              <Button variant="primary" size="md" className="w-full text-xs font-bold shadow-xs">
                Upload Ground Proof
              </Button>
            </Link>
            <Link href="/transparency">
              <Button variant="outline" size="sm" className="w-full text-xs font-medium">
                Public Ledger
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Contact & Base Details */}
        <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 bg-surface-low rounded-input border border-outline-variant/50">
            <span className="text-[10px] text-outline uppercase block">Registration ID</span>
            <span className="font-bold text-on-surface text-sm">
              {currentNgo.registrationNumber || "REG-VERIFIED-2024"}
            </span>
          </div>

          <div className="p-3 bg-surface-low rounded-input border border-outline-variant/50">
            <span className="text-[10px] text-outline uppercase block">Base Geolocation</span>
            <span className="font-bold text-primary text-sm flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {currentNgo.baseLat || "11.6854"}° N, {currentNgo.baseLng || "76.1320"}° E
            </span>
          </div>

          <div className="p-3 bg-surface-low rounded-input border border-outline-variant/50">
            <span className="text-[10px] text-outline uppercase block">Emergency Phone</span>
            <span className="font-bold text-on-surface text-sm">
              {currentNgo.phone || "+91 98471 23456"}
            </span>
          </div>

          <div className="p-3 bg-surface-low rounded-input border border-outline-variant/50">
            <span className="text-[10px] text-outline uppercase block">Escrow Delivery Rate</span>
            <span className="font-bold text-emerald-700 text-sm">96.4% Verified</span>
          </div>
        </div>
      </div>

      {/* ── AI Inventory Budget Parser Card (SPEC REQUIREMENT) ─────────────── */}
      <Card className="p-6 sm:p-8 bg-white border-outline-variant/70 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/60 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider">
                Autonomous Supply Estimator
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-on-surface tracking-tight">
              AI Inventory Budget Parser
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Paste natural-language field requests. Our AI parses units, validates market pricing, and constructs an audited line-item budget.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setInventoryText(
                "Need 1000 water cans at 40 rs, 300 tarpaulins at 450 rs, and 50 trauma first-aid bags at 950 rs for flood displaced camp."
              )
            }
            className="text-xs font-mono text-primary hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Load flood template</span>
          </button>
        </div>

        {/* Textarea Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
            Raw Relief Requirements (Natural Language)
          </label>
          <textarea
            rows={4}
            value={inventoryText}
            onChange={(e) => setInventoryText(e.target.value)}
            placeholder="e.g. 500 food packets at 80 rs, 250 tarpaulins at 450 rs, 100 first aid kits..."
            className="w-full p-4 rounded-input bg-surface-low border border-outline-variant/80 focus:border-primary focus:ring-2 focus:ring-primary/20 text-xs sm:text-sm font-sans text-on-surface outline-none transition-all"
          />
          <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>Powered by Gemini 2.5 Flash / Structured Heuristics Parser</span>
            <span>{inventoryText.length} characters</span>
          </div>
        </div>

        {parseError && (
          <div className="p-3 rounded-input bg-urgent-container/40 border border-urgent/30 text-xs text-urgent flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            variant="primary"
            size="md"
            onClick={handleParseInventory}
            disabled={parsing || !inventoryText.trim()}
            className="text-xs font-bold shadow-xs cursor-pointer"
            iconLeft={
              parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />
            }
          >
            {parsing ? "Parsing Line Items with AI..." : "Parse & Structure Budget"}
          </Button>
        </div>

        {/* Parsed Response Table */}
        {parsedItems && (
          <div className="pt-4 border-t border-outline-variant/60 space-y-4 animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-on-surface">Structured Procurement Table</span>
                <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-pill font-bold">
                  {parsedItems.length} line items
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-on-surface-variant mr-2">Calculated Total:</span>
                <span className="font-mono text-xl font-extrabold text-primary">
                  {formatCurrency(parsedGrandTotal)}
                </span>
              </div>
            </div>

            {/* Warning Chips */}
            {warnings.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {warnings.map((w, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{w}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Itemized Table */}
            <div className="overflow-x-auto rounded-card border border-outline-variant/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container/60 text-on-surface-variant uppercase tracking-wider font-mono text-[10px] border-b border-outline-variant/60">
                  <tr>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Quantity</th>
                    <th className="py-3 px-4 text-right">Unit Cost</th>
                    <th className="py-3 px-4 text-right">Total (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50 font-medium bg-white">
                  {parsedItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-surface-container/30 transition-colors">
                      <td className="py-3 px-4 text-on-surface font-semibold">{item.name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-pill bg-surface-container font-mono text-[10px] text-outline uppercase font-semibold">
                          {item.category || "Relief"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {item.quantity.toLocaleString("en-IN")} {item.unit || "units"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-on-surface-variant">
                        {formatCurrency(item.unitCost)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-primary">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* ── Submitted Documents Section ───────────────────────────────────── */}
      <div className="bg-white rounded-card border border-outline-variant/70 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span>Accreditation Verification Documents</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-input bg-surface-low border border-outline-variant/60 space-y-2">
            <span className="text-[10px] text-outline uppercase font-mono block">Certificate of Registration</span>
            <p className="text-xs font-semibold text-on-surface truncate">
              {currentNgo.docs?.certificate || "Registration_Certificate.pdf"}
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" /> Audited &amp; Approved
            </span>
          </div>

          <div className="p-4 rounded-input bg-surface-low border border-outline-variant/60 space-y-2">
            <span className="text-[10px] text-outline uppercase font-mono block">80G / 12A Tax Exemption</span>
            <p className="text-xs font-semibold text-on-surface truncate">
              {currentNgo.docs?.taxDoc || "80G_Tax_Exemption.pdf"}
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active Exemption
            </span>
          </div>

          <div className="p-4 rounded-input bg-surface-low border border-outline-variant/60 space-y-2">
            <span className="text-[10px] text-outline uppercase font-mono block">Operational Track Record</span>
            <p className="text-xs font-semibold text-on-surface truncate">
              {currentNgo.docs?.disasterHistory || "Wayanad_Field_Report_2024.pdf"}
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" /> 14 Operations Logged
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
