"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Table as TableIcon,
  RotateCcw,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

interface ParsedItem {
  name: string;
  quantity: number;
  unit?: string;
  unitCost: number;
  total: number;
  category?: string;
}

interface ParseResponse {
  success: boolean;
  items: ParsedItem[];
  totalINR: number;
  grandTotal: number;
  warnings?: string[];
  error?: string;
}

export function AiInventoryParserCard() {
  const [inputText, setInputText] = useState(
    "500 packets of emergency baby food at 80 rs each, 250 heavy duty tarpaulins at 450 rs, and 100 medical first aid kits at 320 rs."
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleParse = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/ngo/inventory/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to parse inventory text");
      }

      setResult(data);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error analyzing inventory with AI");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setInputText("");
    setResult(null);
    setErrorMsg(null);
  };

  return (
    <Card className="p-6 md:p-7 shadow-sm border-primary/20 bg-surface relative overflow-hidden">
      {/* Decorative top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-tertiary" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-outline-variant/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="PLATFORM" dot>
              Gemini AI Powered
            </Badge>
            <span className="text-[11px] font-mono text-on-surface-variant">
              Model: gemini-2.5-flash
            </span>
          </div>
          <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span>AI Inventory Budget Parser</span>
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Convert freeform needs notes, volunteer chats, or supplier lists into audited tabular line items.
          </p>
        </div>

        {result && (
          <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="text-xs">
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Input Textarea */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-on-surface mb-1.5 uppercase tracking-wider">
          Relief Requirements (Natural Text)
        </label>
        <textarea
          rows={3}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="e.g. Need 1000 drinking water cans at 80 INR each, 200 hygiene kits at 250 INR, and 50 shelter tents at 1200 INR..."
          className="w-full p-3 rounded-input bg-surface border border-outline-variant/80 focus:border-primary focus:ring-2 focus:ring-primary/20 text-xs text-on-surface outline-none transition-all leading-relaxed"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-primary" />
          <span>Extracts item names, counts, unit costs, and flags pricing anomalies</span>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleParse}
          disabled={loading || !inputText.trim()}
          isLoading={loading}
          className="text-xs font-bold shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          <span>Parse with AI</span>
        </Button>
      </div>

      {errorMsg && (
        <div className="p-3 mb-4 rounded-input bg-error-container/20 border border-urgent/30 text-xs text-urgent flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Parsed Result Table */}
      {result && result.items && result.items.length > 0 && (
        <div className="space-y-4 animate-in fade-in">
          {/* Warning Chips if any */}
          {result.warnings && result.warnings.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 rounded-input bg-secondary-container/20 border border-secondary/30">
              <div className="flex items-center gap-1.5 text-xs font-bold text-secondary-900 w-full mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-secondary" />
                <span>AI Anomaly Detection Warnings:</span>
              </div>
              {result.warnings.map((warning, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-surface border border-secondary/40 text-[11px] font-medium text-secondary-900 shadow-2xs"
                >
                  &bull; {warning}
                </span>
              ))}
            </div>
          )}

          {/* Structured Table */}
          <div className="overflow-x-auto rounded-card border border-outline-variant/60 bg-surface">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container/60 text-on-surface-variant uppercase tracking-wider font-mono text-[10px] border-b border-outline-variant/60">
                <tr>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-center">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Unit Cost (INR)</th>
                  <th className="py-2.5 px-3 text-right">Line Total (INR)</th>
                  <th className="py-2.5 px-3 text-center">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 font-medium">
                {result.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-surface-container/30 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-on-surface">
                      {item.name}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-on-surface-variant">
                      {item.quantity.toLocaleString()} {item.unit || "units"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-on-surface">
                      ₹{item.unitCost.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">
                      ₹{item.total.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] px-2 py-0.5 rounded-pill bg-surface-container font-mono text-on-surface-variant border border-outline-variant/60">
                        {item.category || "General Relief"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-surface-container/80 font-bold border-t border-outline-variant/60">
                <tr>
                  <td colSpan={3} className="py-3 px-3 text-on-surface text-right uppercase tracking-wider text-[11px]">
                    Audited Total Budget:
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm text-primary font-black">
                    ₹{(result.totalINR || result.grandTotal).toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1">
            <span className="flex items-center gap-1.5 text-tertiary font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified schema ready to attach to campaign budget
            </span>
            <span className="font-mono">{result.items.length} relief items parsed</span>
          </div>
        </div>
      )}
    </Card>
  );
}

