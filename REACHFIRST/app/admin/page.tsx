"use client";

import { useState, useEffect } from "react";
import {
  SlidersHorizontal,
  CheckCircle,
  XCircle,
  ExternalLink,
  AlertCircle,
  Loader2,
  Building2,
  ChevronDown,
  ChevronUp,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type NGORow = {
  id: string;
  name: string;
  badge: "govt" | "platform" | "none";
  status: "pending" | "approved" | "rejected";
  address: string | null;
  registrationNumber: string | null;
  docs: { certificate?: string; taxDoc?: string; disasterHistory?: string } | null;
  createdAt: string;
  userEmail: string | null;
  userName: string | null;
  rejectionReason: string | null;
};

type Campaign = {
  id: string;
  title: string;
  disaster: string;
  ngo: string;
  raised: number;
  cap: number;
  status: "active" | "paused";
};

const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: "c1000000-0000-0000-0000-000000000001",
    title: "Emergency Meal Kits & Tarpaulins",
    disaster: "Wayanad Landslides Crisis",
    ngo: "Kerala Relief Front",
    raised: 280000,
    cap: 1000000,
    status: "active",
  },
  {
    id: "c1000000-0000-0000-0000-000000000002",
    title: "Brahmaputra Flood Evacuation & Clean Water",
    disaster: "Assam Brahmaputra Inundation",
    ngo: "Rapid Response India",
    raised: 150000,
    cap: 800000,
    status: "active",
  },
  {
    id: "c1000000-0000-0000-0000-000000000003",
    title: "Coastal Storm Surge Medical Relief",
    disaster: "Coastal Odisha Cyclone Storm Surge",
    ngo: "Seva Bharati Disaster Cell",
    raised: 420000,
    cap: 1200000,
    status: "paused",
  },
];

export default function AdminPage() {
  const [ngos, setNgos] = useState<NGORow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedNgoForReject, setSelectedNgoForReject] = useState<NGORow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState("");

  // Campaign Optimistic UI state
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [togglingCampaignId, setTogglingCampaignId] = useState<string | null>(null);
  const [campaignNotice, setCampaignNotice] = useState<string | null>(null);

  // Fetch applications
  const fetchApplications = () => {
    setLoading(true);
    fetch(`/api/admin/ngos?status=${statusFilter}`)
      .then((res) => res.json())
      .then((data) => {
        setNgos(data.ngos || []);
      })
      .catch((err) => {
        console.error("Failed to load applications:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/ngos?status=${statusFilter}`)
      .then((res) => res.json())
      .then((data) => {
        if (active) setNgos(data.ngos || []);
      })
      .catch((err) => {
        console.error("Failed to load applications:", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [statusFilter]);

  // Handle Approve
  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/ngo/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (res.ok) {
        setNgos((prev) =>
          prev.map((n) => (n.id === id ? { ...n, status: "approved" } : n))
        );
      }
    } catch (err) {
      console.error("Approve failed:", err);
    }
  };

  // Open Reject Modal
  const openRejectModal = (ngo: NGORow) => {
    setSelectedNgoForReject(ngo);
    setRejectReason("");
    setRejectError("");
    setRejectModalOpen(true);
  };

  // Confirm Reject
  const handleConfirmReject = async () => {
    if (!selectedNgoForReject) return;
    if (!rejectReason.trim()) {
      setRejectError("A valid rejection reason is required for legal transparency.");
      return;
    }

    setRejecting(true);
    setRejectError("");

    try {
      const res = await fetch(`/api/admin/ngo/${selectedNgoForReject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          rejectionReason: rejectReason.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to reject application");
      }

      setNgos((prev) =>
        prev.map((n) =>
          n.id === selectedNgoForReject.id
            ? { ...n, status: "rejected", rejectionReason: rejectReason.trim() }
            : n
        )
      );

      setRejectModalOpen(false);
      setSelectedNgoForReject(null);
    } catch (err: unknown) {
      setRejectError(err instanceof Error ? err.message : "Rejection failed.");
    } finally {
      setRejecting(false);
    }
  };

  // Optimistic UI Campaign Toggle
  const handleToggleCampaignStatus = async (campaign: Campaign) => {
    const nextStatus = campaign.status === "active" ? "paused" : "active";
    setTogglingCampaignId(campaign.id);
    setCampaignNotice(null);

    // 1. Optimistically update local state immediately
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaign.id ? { ...c, status: nextStatus } : c))
    );

    try {
      // 2. Perform backend update
      const res = await fetch(`/api/campaigns/${campaign.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        throw new Error("Server rejected status update");
      }

      setCampaignNotice(
        `Campaign "${campaign.title}" is now ${nextStatus.toUpperCase()} (optimistic sync confirmed).`
      );
    } catch (err) {
      // 3. Rollback on failure
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaign.id ? { ...c, status: campaign.status } : c))
      );
      setCampaignNotice(`Failed to update status. Reverted to ${campaign.status}.`);
    } finally {
      setTogglingCampaignId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider">
              Governance &amp; Review Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            ReliefTrack Admin Console
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Audit frontline NGO applications, review legal credentials, and manage crisis campaigns with optimistic control.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchApplications}
            iconLeft={<SlidersHorizontal className="w-3.5 h-3.5" />}
          >
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* ── SECTION 1: NGO Accreditation Applications ────────────────────────── */}
      <div className="bg-white rounded-card border border-outline-variant/70 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <span>Accreditation Review Queue</span>
            </h2>
            <p className="text-xs text-on-surface-variant">
              Inspect legal deeds, 80G tax exemptions, and past relief reports before granting escrow release rights.
            </p>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex bg-surface-container rounded-pill p-1 border border-outline-variant/60 text-xs font-mono font-bold">
            {(["all", "pending", "approved", "rejected"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={cn(
                  "px-3 py-1.5 rounded-pill capitalize transition-all cursor-pointer",
                  statusFilter === filter
                    ? "bg-primary text-white shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Applications Table */}
        {loading ? (
          <div className="min-h-[220px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : ngos.length === 0 ? (
          <div className="p-12 text-center text-xs text-on-surface-variant bg-surface-low rounded-card border border-outline-variant/40">
            No applications found matching filter &quot;{statusFilter}&quot;.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-card border border-outline-variant/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container/70 text-on-surface-variant uppercase tracking-wider font-mono text-[10px] border-b border-outline-variant/60">
                <tr>
                  <th className="py-3 px-4">Organisation</th>
                  <th className="py-3 px-4">Reg ID</th>
                  <th className="py-3 px-4">Accreditation</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50 font-medium bg-white">
                {ngos.map((ngo) => {
                  const isExpanded = expandedRow === ngo.id;
                  const isApproved = ngo.status === "approved";
                  const isRejected = ngo.status === "rejected";

                  return (
                    <tbody key={ngo.id} className="divide-y divide-outline-variant/40">
                      <tr className="hover:bg-surface-container/20 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-on-surface">
                          <div>{ngo.name}</div>
                          <div className="text-[11px] text-on-surface-variant font-normal">
                            {ngo.userEmail || "email@ngo.org"}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-outline">
                          {ngo.registrationNumber || "REG-UNSET"}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={ngo.badge === "govt" ? "govt" : "platform"}>
                            {ngo.badge === "govt" ? "Govt" : "Platform"}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-on-surface-variant">
                          {new Date(ngo.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[10px] font-mono font-bold uppercase",
                              isApproved && "bg-emerald-50 text-emerald-800 border border-emerald-200",
                              ngo.status === "pending" && "bg-amber-50 text-amber-800 border border-amber-200",
                              isRejected && "bg-red-50 text-red-800 border border-red-200"
                            )}
                          >
                            {ngo.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleApprove(ngo.id)}
                              disabled={isApproved}
                              className="px-2.5 py-1 rounded-input bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] shadow-xs disabled:opacity-40 cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => openRejectModal(ngo)}
                              disabled={isRejected}
                              className="px-2.5 py-1 rounded-input bg-urgent hover:bg-red-800 text-white font-bold text-[11px] shadow-xs disabled:opacity-40 cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setExpandedRow(isExpanded ? null : ngo.id)}
                            className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-semibold cursor-pointer"
                          >
                            <span>{isExpanded ? "Hide" : "Docs"}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Row for Document Previews */}
                      {isExpanded && (
                        <tr className="bg-surface-low animate-fade-in">
                          <td colSpan={7} className="p-4 sm:p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Doc 1: Registration Certificate */}
                              <div className="p-3.5 bg-white rounded-card border border-outline-variant/60 space-y-1.5 shadow-xs">
                                <span className="text-[10px] uppercase font-mono text-outline block">
                                  Registration Certificate
                                </span>
                                <p className="text-xs font-bold text-on-surface truncate">
                                  {ngo.docs?.certificate || "certificate_registered.pdf"}
                                </p>
                                <a
                                  href={ngo.docs?.certificate || "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-primary font-bold hover:underline pt-1"
                                >
                                  <span>Preview Document</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>

                              {/* Doc 2: Tax Exemption */}
                              <div className="p-3.5 bg-white rounded-card border border-outline-variant/60 space-y-1.5 shadow-xs">
                                <span className="text-[10px] uppercase font-mono text-outline block">
                                  80G / FCRA Tax Exemption
                                </span>
                                <p className="text-xs font-bold text-on-surface truncate">
                                  {ngo.docs?.taxDoc || "80g_exemption_deed.pdf"}
                                </p>
                                <a
                                  href={ngo.docs?.taxDoc || "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-primary font-bold hover:underline pt-1"
                                >
                                  <span>Preview Document</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>

                              {/* Doc 3: Disaster History */}
                              <div className="p-3.5 bg-white rounded-card border border-outline-variant/60 space-y-1.5 shadow-xs">
                                <span className="text-[10px] uppercase font-mono text-outline block">
                                  Relief Operational Track Record
                                </span>
                                <p className="text-xs font-bold text-on-surface truncate">
                                  {ngo.docs?.disasterHistory || "past_disaster_audit.pdf"}
                                </p>
                                <a
                                  href={ngo.docs?.disasterHistory || "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-primary font-bold hover:underline pt-1"
                                >
                                  <span>Preview Document</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>

                            {/* Address & Rejection notes if any */}
                            <div className="text-xs text-on-surface-variant flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-outline-variant/50 pt-2">
                              <div>
                                <span className="font-bold text-on-surface">Registered HQ: </span>
                                <span>{ngo.address || "Kerala Headquarters"}</span>
                              </div>
                              {ngo.rejectionReason && (
                                <div className="text-urgent font-medium">
                                  <strong>Reason for rejection: </strong>
                                  {ngo.rejectionReason}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── SECTION 2: Campaign Control with Optimistic UI ────────────────────── */}
      <div className="bg-white rounded-card border border-outline-variant/70 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <PauseCircle className="w-5 h-5 text-primary" />
              <span>Crisis Campaign Controls (Optimistic UI)</span>
            </h2>
            <p className="text-xs text-on-surface-variant">
              Pause or resume public donor capital ingress instantaneously. Updates sync asynchronously with fallback rollback.
            </p>
          </div>
        </div>

        {campaignNotice && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-input text-xs text-primary font-medium animate-fade-in flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{campaignNotice}</span>
          </div>
        )}

        <div className="overflow-x-auto rounded-card border border-outline-variant/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container/70 text-on-surface-variant uppercase tracking-wider font-mono text-[10px] border-b border-outline-variant/60">
              <tr>
                <th className="py-3 px-4">Campaign Title</th>
                <th className="py-3 px-4">Disaster Zone</th>
                <th className="py-3 px-4">Lead NGO</th>
                <th className="py-3 px-4">Funding Progress</th>
                <th className="py-3 px-4">Live Status</th>
                <th className="py-3 px-4 text-right">Optimistic Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50 font-medium bg-white">
              {campaigns.map((camp) => {
                const isActive = camp.status === "active";
                const isToggling = togglingCampaignId === camp.id;

                return (
                  <tr key={camp.id} className="hover:bg-surface-container/20 transition-colors">
                    <td className="py-3 px-4 font-bold text-on-surface">{camp.title}</td>
                    <td className="py-3 px-4 text-on-surface-variant">{camp.disaster}</td>
                    <td className="py-3 px-4 font-semibold text-primary">{camp.ngo}</td>
                    <td className="py-3 px-4 font-mono">
                      {formatCurrency(camp.raised)} / {formatCurrency(camp.cap)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-pill font-mono text-[10px] font-bold uppercase",
                          isActive
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        )}
                      >
                        ● {camp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleCampaignStatus(camp)}
                        disabled={isToggling}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-input text-xs font-bold transition-all shadow-xs cursor-pointer",
                          isActive
                            ? "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                            : "bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300"
                        )}
                      >
                        {isToggling ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isActive ? (
                          <PauseCircle className="w-3.5 h-3.5 text-amber-700" />
                        ) : (
                          <PlayCircle className="w-3.5 h-3.5 text-emerald-700" />
                        )}
                        <span>{isActive ? "Pause Campaign" : "Resume Campaign"}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── REJECTION MODAL (SPEC REQUIREMENT) ───────────────────────────────── */}
      {rejectModalOpen && selectedNgoForReject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-card border border-outline-variant max-w-lg w-full p-6 shadow-modal space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
              <div className="flex items-center gap-2 text-urgent">
                <XCircle className="w-5 h-5" />
                <h3 className="text-base font-bold text-on-surface">
                  Reject NGO Accreditation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              You are about to reject the accreditation application for{" "}
              <strong className="text-on-surface font-semibold">
                {selectedNgoForReject.name}
              </strong>
              . A legal reason must be logged for audit compliance.
            </p>

            <div>
              <label className="label">
                Official Reason for Rejection <span className="text-urgent">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Incomplete FCRA / Darpan certification; GPS coordinates outside crisis operational jurisdiction..."
                className="input !h-auto py-2.5 text-xs"
              />
              {rejectError && (
                <p className="text-xs text-urgent mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {rejectError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectModalOpen(false)}
                disabled={rejecting}
              >
                Cancel
              </Button>

              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={rejecting || !rejectReason.trim()}
                className="py-2 px-4 rounded-input bg-urgent hover:bg-red-800 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {rejecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
