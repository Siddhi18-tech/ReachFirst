"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  AlertCircle,
  Loader2,
  Building2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  PauseCircle,
  PlayCircle,
  Camera,
  MapPin,
  Calendar,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, badgeLabel, cn } from "@/lib/utils";

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

type CampaignRow = {
  id: string;
  title: string;
  status: "active" | "paused" | "completed";
  raised: string | number;
  cap: string | number | null;
  goal: string | number | null;
  ngoName: string | null;
  disasterName: string | null;
};

type ProofQueueItem = {
  id: string;
  fileUrl: string;
  caption: string;
  verified: boolean;
  lat: number | null;
  lng: number | null;
  takenAt: string | null;
  campaignId: string;
  ngoName: string;
  uploaderEmail: string | null;
  uploadedAt: string;
};

export default function AdminConsolePage() {
  const [activeTab, setActiveTab] = useState<"ngos" | "campaigns" | "proofs">("ngos");
  const [ngoStatusFilter, setNgoStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  // Data states
  const [ngos, setNgos] = useState<NGORow[]>([]);
  const [campaignsList, setCampaignsList] = useState<CampaignRow[]>([]);
  const [proofsQueue, setProofsQueue] = useState<ProofQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Expanded cards tracker
  const [expandedNgoId, setExpandedNgoId] = useState<string | null>(null);

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedNgoForReject, setSelectedNgoForReject] = useState<NGORow | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState("");

  // Approving state
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Campaign toggle processing
  const [togglingCampaignId, setTogglingCampaignId] = useState<string | null>(null);

  // Proof verifying
  const [verifyingProofId, setVerifyingProofId] = useState<string | null>(null);

  // Global action message
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showNotification = (type: "success" | "error", text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // 1. Fetch NGO applications
  useEffect(() => {
    let active = true;

    fetch(`/api/admin/ngos?status=${ngoStatusFilter}`)
      .then((res) => (res.ok ? res.json() : { ngos: [] }))
      .then((data) => {
        if (active) setNgos(data.ngos ?? []);
      })
      .catch((err) => {
        console.warn("Failed to load NGOs:", err);
        if (active) setNgos([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [ngoStatusFilter, refreshKey]);

  // 2. Fetch Campaigns
  useEffect(() => {
    let active = true;
    fetch("/api/campaigns")
      .then((res) => (res.ok ? res.json() : { campaigns: [] }))
      .then((data) => {
        if (active) setCampaignsList(data.campaigns ?? []);
      })
      .catch((err) => console.warn("Failed to load campaigns:", err));

    return () => {
      active = false;
    };
  }, [refreshKey]);

  // 3. Fetch Proof Review Queue
  useEffect(() => {
    let active = true;
    fetch("/api/admin/proofs")
      .then((res) => (res.ok ? res.json() : { proofs: [] }))
      .then((data) => {
        if (active) setProofsQueue(data.proofs ?? []);
      })
      .catch((err) => console.warn("Failed to load proof queue:", err));

    return () => {
      active = false;
    };
  }, [refreshKey]);

  // Handle Approve NGO (with optimistic UI)
  const handleApproveNgo = async (ngo: NGORow) => {
    setApprovingId(ngo.id);

    // Optimistic UI: update state in memory
    const prevNgos = [...ngos];
    setNgos((prev) =>
      prev.map((n) => (n.id === ngo.id ? { ...n, status: "approved" } : n))
    );

    try {
      const res = await fetch(`/api/admin/ngo/${ngo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      if (!res.ok) throw new Error("Approval failed");
      showNotification("success", `Approved accreditation for ${ngo.name}`);
      setRefreshKey((k) => k + 1);
    } catch {
      // Rollback
      setNgos(prevNgos);
      showNotification("error", "Failed to approve NGO. Reverted change.");
    } finally {
      setApprovingId(null);
    }
  };

  // Open Reject Modal
  const openRejectModal = (ngo: NGORow) => {
    setSelectedNgoForReject(ngo);
    setRejectionReason("");
    setRejectError("");
    setRejectModalOpen(true);
  };

  // Confirm Reject NGO
  const handleConfirmReject = async () => {
    if (!selectedNgoForReject) return;
    if (!rejectionReason.trim()) {
      setRejectError("Rejection reason is mandatory.");
      return;
    }

    setRejecting(true);
    const ngoId = selectedNgoForReject.id;
    const prevNgos = [...ngos];

    // Optimistic UI
    setNgos((prev) =>
      prev.map((n) =>
        n.id === ngoId ? { ...n, status: "rejected", rejectionReason } : n
      )
    );

    try {
      const res = await fetch(`/api/admin/ngo/${ngoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          rejectionReason: rejectionReason.trim(),
        }),
      });

      if (!res.ok) throw new Error("Rejection failed");
      showNotification("success", `Rejected application for ${selectedNgoForReject.name}`);
      setRejectModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch {
      setNgos(prevNgos);
      setRejectError("Failed to reject application. Reverted change.");
    } finally {
      setRejecting(false);
    }
  };

  // Handle Pause / Resume Campaign with OPTIMISTIC UI
  const handleToggleCampaignStatus = async (campaign: CampaignRow) => {
    const nextStatus: "active" | "paused" =
      campaign.status === "active" ? "paused" : "active";

    setTogglingCampaignId(campaign.id);

    // Optimistic update
    const prevList = [...campaignsList];
    setCampaignsList((prev) =>
      prev.map((c) => (c.id === campaign.id ? { ...c, status: nextStatus } : c))
    );

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) throw new Error("Failed to update campaign");
      showNotification(
        "success",
        `Campaign "${campaign.title}" is now ${nextStatus.toUpperCase()}`
      );
    } catch {
      // Rollback on error
      setCampaignsList(prevList);
      showNotification("error", "Could not toggle campaign status. Reverted.");
    } finally {
      setTogglingCampaignId(null);
    }
  };

  // Handle Verify Proof
  const handleVerifyProof = async (proofId: string) => {
    setVerifyingProofId(proofId);
    const prevProofs = [...proofsQueue];

    // Optimistic removal
    setProofsQueue((prev) => prev.filter((p) => p.id !== proofId));

    try {
      const res = await fetch(`/api/admin/proofs/${proofId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      if (!res.ok) throw new Error("Proof verification failed");
      showNotification(
        "success",
        "Field delivery proof verified! Associated escrow milestone tranche unlocked."
      );
    } catch {
      setProofsQueue(prevProofs);
      showNotification("error", "Failed to verify proof. Reverted.");
    } finally {
      setVerifyingProofId(null);
    }
  };

  return (
    <div className="section max-w-6xl mx-auto py-8 px-4 space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={cn(
            "fixed top-20 right-6 z-50 p-4 rounded-card border shadow-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in",
            toastMsg.type === "success"
              ? "bg-tertiary-container text-white border-tertiary/40"
              : "bg-error-container text-urgent border-urgent/40"
          )}
        >
          {toastMsg.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="HIGH" dot>
              Security Governance
            </Badge>
            <span className="text-[11px] font-mono text-on-surface-variant">
              Admin Role: Root Platform Auditor
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
            Administrator Console
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Audit NGO accreditation packages, review EXIF geotagged delivery proof, and manage emergency campaign states.
          </p>
        </div>

        {/* Quick Portal Switcher */}
        <div className="flex items-center gap-2">
          <Link
            href="/transparency"
            className="py-2 px-3 rounded-input border border-outline text-on-surface text-xs font-medium hover:bg-surface-container transition-colors inline-flex items-center gap-1.5"
          >
            <span>Public Ledger</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Navigation View Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-surface-container rounded-card w-fit border border-outline-variant/60">
        <button
          type="button"
          onClick={() => setActiveTab("ngos")}
          className={cn(
            "px-4 py-2 rounded-input text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
            activeTab === "ngos"
              ? "bg-primary text-white shadow-xs"
              : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          <Building2 className="w-4 h-4" />
          <span>NGO Applications ({ngos.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("campaigns")}
          className={cn(
            "px-4 py-2 rounded-input text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
            activeTab === "campaigns"
              ? "bg-primary text-white shadow-xs"
              : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Campaign Controls ({campaignsList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("proofs")}
          className={cn(
            "px-4 py-2 rounded-input text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
            activeTab === "proofs"
              ? "bg-primary text-white shadow-xs"
              : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          <Camera className="w-4 h-4" />
          <span>Proof Review Queue ({proofsQueue.length})</span>
        </button>
      </div>

      {/* ── TAB 1: NGO ACCREDITATION APPLICATIONS ── */}
      {activeTab === "ngos" && (
        <div className="space-y-4 animate-in fade-in">
          {/* Status Filter Bar */}
          <div className="flex items-center justify-between gap-3 bg-surface rounded-card p-3 border border-outline-variant/60">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Filter By Status:
            </span>

            <div className="flex gap-1 text-xs">
              {(["pending", "approved", "rejected", "all"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    setNgoStatusFilter(st);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-pill font-mono font-semibold uppercase text-[11px] transition-all cursor-pointer",
                    ngoStatusFilter === st
                      ? "bg-secondary text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container"
                  )}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
              <p className="text-xs text-on-surface-variant font-mono">
                Loading accreditation applications...
              </p>
            </div>
          ) : ngos.length === 0 ? (
            <Card className="p-12 text-center text-on-surface-variant border-dashed">
              <Building2 className="w-12 h-12 text-outline mx-auto mb-3 opacity-40" />
              <h3 className="text-sm font-bold text-on-surface mb-1">
                No {ngoStatusFilter !== "all" ? ngoStatusFilter : ""} applications found
              </h3>
              <p className="text-xs text-on-surface-variant">
                Applications submitted via `/ngo/apply` will appear here for audit review.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {ngos.map((ngo) => {
                const isExpanded = expandedNgoId === ngo.id;
                const isApproving = approvingId === ngo.id;

                return (
                  <Card
                    key={ngo.id}
                    className="overflow-hidden border-outline-variant/60 shadow-xs hover:border-primary/40 transition-all"
                  >
                    <div
                      className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-surface-container/20 transition-colors"
                      onClick={() => setExpandedNgoId(isExpanded ? null : ngo.id)}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-card bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant/60">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-on-surface">
                              {ngo.name}
                            </h3>
                            <Badge variant={ngo.badge === "govt" ? "GOVT" : "PLATFORM"}>
                              {ngo.badge === "govt" ? "Govt Accredited" : "Platform Verified"}
                            </Badge>
                          </div>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            {ngo.userEmail || "No email on record"} &bull; Applied on{" "}
                            {new Date(ngo.createdAt).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-auto">
                        <Badge
                          variant={
                            ngo.status === "approved"
                              ? "GOVT"
                              : ngo.status === "pending"
                              ? "HIGH"
                              : "URGENT"
                          }
                          dot
                        >
                          {ngo.status.toUpperCase()}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-on-surface-variant" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                        )}
                      </div>
                    </div>

                    {/* Expandable Document Preview & Actions */}
                    {isExpanded && (
                      <div className="border-t border-outline-variant/40 p-5 bg-surface-container/20 space-y-5 animate-in fade-in">
                        {/* Address & Reg Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                              Headquarters Physical Location
                            </span>
                            <p className="text-on-surface font-medium">
                              {ngo.address || "Address not specified"}
                            </p>
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                              Registration / 80G License Code
                            </span>
                            <p className="text-on-surface font-mono font-semibold">
                              {ngo.registrationNumber || "Unregistered / Pending"}
                            </p>
                          </div>
                        </div>

                        {/* Document Previews */}
                        <div>
                          <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2.5">
                            Accreditation Compliance Documents
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                              { key: "certificate", label: "Registration Certificate" },
                              { key: "taxDoc", label: "Tax Exemption Document" },
                              { key: "disasterHistory", label: "Disaster Operational Record" },
                            ].map((d) => {
                              const docUrl = (ngo.docs as Record<string, string | undefined>)?.[d.key];

                              return (
                                <div
                                  key={d.key}
                                  className={cn(
                                    "p-3 rounded-card border text-xs flex flex-col justify-between gap-2",
                                    docUrl
                                      ? "bg-tertiary-container/10 border-tertiary/30"
                                      : "bg-surface-container border-outline-variant/60"
                                  )}
                                >
                                  <div>
                                    <span className="font-semibold text-on-surface block truncate">
                                      {d.label}
                                    </span>
                                    <span className="text-[10px] text-on-surface-variant">
                                      {docUrl ? "Document on file" : "Not uploaded"}
                                    </span>
                                  </div>

                                  {docUrl ? (
                                    <a
                                      href={docUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1 self-start"
                                    >
                                      <span>Preview Document</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ) : (
                                    <span className="text-[10px] text-on-surface-variant italic">
                                      Unavailable
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Rejection Reason if Rejected */}
                        {ngo.rejectionReason && (
                          <div className="p-3 rounded-input bg-urgent-container/20 border border-urgent/30 text-xs text-urgent">
                            <strong>Rejection Note:</strong> {ngo.rejectionReason}
                          </div>
                        )}

                        {/* Action Controls */}
                        <div className="flex items-center gap-3 pt-3 border-t border-outline-variant/40">
                          {ngo.status !== "approved" && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproveNgo(ngo);
                              }}
                              isLoading={isApproving}
                              className="bg-tertiary hover:bg-tertiary-hover text-white text-xs font-bold"
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                              <span>Approve NGO</span>
                            </Button>
                          )}

                          {ngo.status !== "rejected" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openRejectModal(ngo);
                              }}
                              className="text-urgent border-urgent/40 hover:bg-urgent-container/20 text-xs font-semibold"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1.5" />
                              <span>Reject Application...</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: CAMPAIGN EMERGENCY CONTROLS (OPTIMISTIC UI) ── */}
      {activeTab === "campaigns" && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-surface rounded-card p-4 border border-outline-variant/60 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-on-surface">
                Emergency Campaign Pause / Resume Switches
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Instantly freeze or resume incoming donations using optimistic UI controls.
              </p>
            </div>
            <Badge variant="PLATFORM">Live Database Sync</Badge>
          </div>

          <div className="overflow-x-auto rounded-card border border-outline-variant/60 bg-surface">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container/60 text-on-surface-variant uppercase tracking-wider font-mono text-[10px] border-b border-outline-variant/60">
                <tr>
                  <th className="py-3 px-4">Campaign Title</th>
                  <th className="py-3 px-4">Responding NGO</th>
                  <th className="py-3 px-4">Disaster Incident</th>
                  <th className="py-3 px-4">Raised / Absorption Cap</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Emergency Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 font-medium">
                {campaignsList.map((campaign) => {
                  const isActive = campaign.status === "active";
                  const isToggling = togglingCampaignId === campaign.id;

                  return (
                    <tr key={campaign.id} className="hover:bg-surface-container/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-on-surface max-w-xs truncate">
                        {campaign.title}
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant">
                        {campaign.ngoName || "Assigned NGO"}
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant">
                        {campaign.disasterName || "Emergency Crisis"}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-primary">
                          ₹{Number(campaign.raised).toLocaleString()}
                        </span>
                        {campaign.cap && (
                          <span className="text-on-surface-variant text-[11px]">
                            {" "}
                            / ₹{Number(campaign.cap).toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={isActive ? "GOVT" : "HIGH"} dot>
                          {campaign.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant={isActive ? "outline" : "primary"}
                          size="sm"
                          onClick={() => handleToggleCampaignStatus(campaign)}
                          isLoading={isToggling}
                          className={cn(
                            "text-xs font-bold",
                            isActive
                              ? "text-secondary hover:bg-secondary-container/20 border-secondary/40"
                              : "bg-tertiary text-white"
                          )}
                        >
                          {isActive ? (
                            <>
                              <PauseCircle className="w-3.5 h-3.5 mr-1" />
                              <span>Pause Campaign</span>
                            </>
                          ) : (
                            <>
                              <PlayCircle className="w-3.5 h-3.5 mr-1" />
                              <span>Resume Campaign</span>
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: PROOF REVIEW & ESCROW RELEASE QUEUE ── */}
      {activeTab === "proofs" && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-surface rounded-card p-4 border border-outline-variant/60 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-on-surface">
                Unverified Field Delivery Proof Photos
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Approving field proof validates EXIF metadata and unlocks milestone payouts to the NGO.
              </p>
            </div>
            <Badge variant="GOVT">Escrow Release Engine</Badge>
          </div>

          {proofsQueue.length === 0 ? (
            <Card className="p-12 text-center text-on-surface-variant border-dashed">
              <Camera className="w-12 h-12 text-outline mx-auto mb-3 opacity-40" />
              <h3 className="text-sm font-bold text-on-surface mb-1">
                Proof Review Queue is Clear
              </h3>
              <p className="text-xs text-on-surface-variant">
                All uploaded geotagged proof photos have been verified and processed.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {proofsQueue.map((item) => {
                const isVerifying = verifyingProofId === item.id;

                return (
                  <Card
                    key={item.id}
                    className="overflow-hidden border-outline-variant/60 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Preview */}
                      <div className="relative h-48 bg-surface-container overflow-hidden">
                        <img
                          src={item.fileUrl}
                          alt={item.caption}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 right-2.5">
                          <Badge variant="HIGH" dot>
                            Awaiting Audit
                          </Badge>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="p-4 space-y-3">
                        <div>
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">
                            {item.ngoName}
                          </span>
                          <h4 className="text-sm font-bold text-on-surface line-clamp-1">
                            {item.caption}
                          </h4>
                        </div>

                        {/* EXIF Data Strip */}
                        <div className="p-2.5 rounded-input bg-surface-container/60 border border-outline-variant/40 space-y-1 text-xs font-mono">
                          <div className="flex items-center justify-between text-on-surface-variant">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-primary" />
                              <span>GPS Coordinates:</span>
                            </span>
                            <span className="font-bold text-on-surface">
                              {item.lat && item.lng
                                ? `${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}`
                                : "No GPS EXIF"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-on-surface-variant">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-secondary" />
                              <span>Field Timestamp:</span>
                            </span>
                            <span className="text-on-surface">
                              {item.takenAt
                                ? new Date(item.takenAt).toLocaleDateString("en-IN")
                                : "Not recorded"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="p-4 border-t border-outline-variant/40 flex items-center justify-end gap-2 bg-surface-container/20">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleVerifyProof(item.id)}
                        isLoading={isVerifying}
                        className="bg-tertiary hover:bg-tertiary-hover text-white text-xs font-bold w-full justify-center"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        <span>Verify & Release Escrow Tranche</span>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── REJECT APPLICATION MODAL ── */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject NGO Accreditation Application"
        description={`Provide a specific, documented reason for rejecting ${selectedNgoForReject?.name}.`}
        size="md"
      >
        <div className="space-y-4 pt-2">
          {rejectError && (
            <div className="p-3 bg-error-container/20 border border-urgent/30 text-xs text-urgent rounded-input flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{rejectError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1 uppercase tracking-wider">
              Mandatory Rejection Justification <span className="text-urgent">*</span>
            </label>
            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Incomplete FCRA documentation or unable to verify 80G registration on Darpan registry..."
              className="w-full p-3 rounded-input bg-surface border border-outline-variant/80 focus:border-urgent focus:ring-2 focus:ring-urgent/20 text-xs text-on-surface outline-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/40">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRejectModalOpen(false)}
              disabled={rejecting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleConfirmReject}
              isLoading={rejecting}
              className="bg-urgent hover:bg-urgent/90 text-white text-xs font-bold"
            >
              <XCircle className="w-3.5 h-3.5 mr-1.5" />
              <span>Confirm Rejection</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
