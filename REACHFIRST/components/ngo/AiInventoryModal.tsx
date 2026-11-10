"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type InventoryItem = { item: string; quantity: number; unitCost: number; totalCost: number };

export function AiInventoryModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState(
    "We need 500 packets of emergency baby food at 80 rs each, 250 heavy duty tarpaulins at 450 rs, and 100 medical first aid kits at 320 rs."
  );
  const [loading, setLoading] = useState(false);
  const [parsedItems, setParsedItems] = useState<InventoryItem[] | null>(null);
  const [grandTotal, setGrandTotal] = useState<number>(0);
  const handleParse = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ngo/inventory-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });
      const data = await res.json();
      if (data.items) {
        setParsedItems(data.items);
        setGrandTotal(data.grandTotal);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full py-2.5 px-3 rounded-input bg-primary-container text-on-primary-container text-xs font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>AI Inventory Budget Parser</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-card border border-outline-variant/60 max-w-lg w-full p-6 shadow-xl animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-base font-bold text-on-surface">Gemini AI Needs Parser</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-on-surface-variant hover:text-on-surface text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-on-surface-variant mb-4">
              Paste raw relief requirements in natural text. Gemini will structure it into an itemized budget table.
            </p>

            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full p-3 rounded-input bg-surface border border-outline-variant/80 text-xs text-on-surface outline-none focus:border-primary mb-4"
              placeholder="e.g. 500 food packets at 80 rs, 200 blankets at 250 rs..."
            />

            <div className="flex justify-end gap-2 mb-4">
              <button
                type="button"
                disabled={loading || !inputText.trim()}
                onClick={handleParse}
                className="py-2 px-4 rounded-input bg-primary text-on-primary text-xs font-bold hover:bg-primary-hover transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Structured Budget</span>
                  </>
                )}
              </button>
            </div>

            {parsedItems && (
              <div className="bg-surface-container/60 rounded-card p-4 border border-outline-variant/40 animate-fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-on-surface mb-2">
                  <span>Structured Itemization:</span>
                  <span className="font-mono text-primary font-extrabold">
                    Total: {formatCurrency(grandTotal)}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs max-h-48 overflow-y-auto">
                  {parsedItems.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1 px-2 rounded bg-surface border border-outline-variant/30 text-[11px]"
                    >
                      <span className="font-medium text-on-surface">{it.item}</span>
                      <span className="font-mono text-on-surface-variant">
                        {it.quantity} × ₹{it.unitCost} ={" "}
                        <strong className="text-on-surface">₹{it.totalCost.toLocaleString()}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
