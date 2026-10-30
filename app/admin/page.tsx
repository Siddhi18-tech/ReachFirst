"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, ExternalLink, AlertCircle, Loader2, Building2, ChevronDown, ChevronUp } from "lucide-react";
import { cn, badgeLabel } from "@/lib/utils";

type NGORow = {
  id: string;
  name: string;
  badge: string;
  status: string;
  address: string | null;
  registrationNumber: string | null;
  docs: { certificate?: string; taxDoc?: string; disasterHistory?: string } | null;
  createdAt: string;
  userEmail: string | null;
  userName: string | null;
  rejectionReason: string | null;
};

function NGOCard({ ngo, onAction }: { ngo: NGORow; onAction: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [rejReason, setRejReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [error, setError] = useState("");

  const badge = badgeLabel(ngo.badge);

  async function act(action: "approve" | "reject") {
    if (action === "reject" && !rejReason.trim()) {
      setError("Please enter a rejection reason");
      return;
    }
    setProcessing(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/ngo/${ngo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectionReason: rejReason }),
      });
      if (!res.ok) throw new Error("Action failed");
      onAction();
    } catch {
      setError("Failed to process action. Try again.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="card overflow-hidden">
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-surface-low transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-card bg-surface-container flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-outline" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-on-surface">{ngo.name}</h3>
              <span className={cn("badge text-xs border", badge.bg, badge.color, badge.border)}>
                {badge.icon} {badge.label}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              {ngo.userEmail} · {ngo.address ?? "No address"} · Applied {new Date(ngo.createdAt).toLocaleDateString("en-IN")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge badge-severity-2 text-xs">Pending Review</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-outline" /> : <ChevronDown className="w-4 h-4 text-outline" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-outline-variant p-5 space-y-5 animate-slide-up">
          {/* Documents */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-outline mb-3">Submitted Documents</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: "certificate", label: "Registration Certificate" },
                { key: "taxDoc", label: "Tax Exemption" },
                { key: "disasterHistory", label: "Past Operations" },
              ].map((d) => {
                const url = ngo.docs?.[d.key as keyof typeof ngo.docs];
                return (
                  <div key={d.key} className={cn(
                    "p-3 rounded-card border text-sm",
                    url ? "bg-tertiary-50 border-tertiary-200" : "bg-surface-container border-outline-variant"
                  )}>
                    <p className={cn("font-medium text-xs mb-1.5", url ? "text-tertiary-700" : "text-outline")}>
                      {d.label}
                    </p>
                    {url ? (
                      <a
                        href={url} target="_blank" rel="noreferrer"
                        className="text-xs text-primary flex items-center gap-1 hover:underline"
                      >
                        View document <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <p className="text-xs text-outline italic">Not provided</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Registration number */}
          {ngo.registrationNumber && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-outline mb-2">Registration Number</h4>
              <p className="font-mono text-sm text-on-surface">{ngo.registrationNumber}</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-input text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Reject reason input */}
          {showRejectInput && (
            <div>
              <label className="label">Rejection Reason <span className="text-error">*</span></label>
              <textarea
                className="input !h-auto py-2.5"
                rows={3}
                placeholder="Explain why this application is being rejected..."
                value={rejReason}
                onChange={(e) => setRejReason(e.target.value)}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => act("approve")}
              className="btn-primary flex items-center gap-2"
              disabled={processing}
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Approve NGO
            </button>
            {!showRejectInput ? (
              <button
                onClick={() => setShowRejectInput(true)}
                className="btn-secondary text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            ) : (
              <button
                onClick={() => act("reject")}
                className="btn-danger"
                disabled={processing}
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Confirm Reject
              </button>
            )}
            {showRejectInput && (
              <button onClick={() => { setShowRejectInput(false); setRejReason(""); }} className="btn-secondary text-sm">
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [ngos, setNgos] = useState<NGORow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/ngos?status=${tab}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load NGO applications");
        return res.json();
      })
      .then((data) => { if (active) setNgos(data.ngos ?? []); })
      .catch(() => { if (active) setNgos([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [tab, refreshKey]);

  const tabs = [
    { key: "pending", label: "Pending Review", icon: Clock },
    { key: "approved", label: "Approved", icon: CheckCircle },
    { key: "rejected", label: "Rejected", icon: XCircle },
  ] as const;

  return (
    <div className="section animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Admin Console</h1>
          <p className="text-sm text-on-surface-variant mt-1">Review NGO applications and manage the platform</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-container rounded-card w-fit mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { if (t.key !== tab) setLoading(true); setTab(t.key); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-input text-sm font-medium transition-all",
              tab === t.key ? "bg-white text-on-surface shadow-card" : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : ngos.length === 0 ? (
        <div className="text-center py-20 text-on-surface-variant">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-outline opacity-50" />
          <p className="font-medium">No {tab} applications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ngos.map((ngo) => (
            <NGOCard key={ngo.id} ngo={ngo} onAction={() => { setLoading(true); setRefreshKey((key) => key + 1); }} />
          ))}
        </div>
      )}
    </div>
  );
}
