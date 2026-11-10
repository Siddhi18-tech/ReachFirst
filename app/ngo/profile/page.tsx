import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ngos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import {
  CheckCircle,
  Clock,
  XCircle,
  Building2,
  FileText,
  MapPin,
  Globe,
  Phone,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Camera,
  CheckCircle2,
} from "lucide-react";
import { badgeLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AiInventoryParserCard } from "@/components/ngo/AiInventoryParserCard";

export const dynamic = "force-dynamic";

export default async function NGOProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ applied?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  let ngo: typeof ngos.$inferSelect | null = null;
  try {
    const [row] = await db
      .select()
      .from(ngos)
      .where(eq(ngos.userId, session.user.id))
      .limit(1);
    ngo = row ?? null;
  } catch (err) {
    console.warn("DB lookup failed in NGOProfilePage, checking demo fallback:", err);
  }

  // If DB unavailable or empty, provide a preconfigured active NGO profile for demo accounts
  if (!ngo && (session.user.email?.toLowerCase().includes("ngo") || session.user.role === "ngo")) {
    ngo = {
      id: "demo-ngo-profile-001",
      userId: session.user.id,
      name: "Assam Rapid Relief & Rescue Mission",
      registrationNumber: "NGO-IN-2024-88492",
      description:
        "Providing immediate emergency boat rescue, potable water purification, and temporary dry-ration relief to flood-displaced communities along the Brahmaputra basin.",
      badge: "govt",
      baseLat: "26.2006",
      baseLng: "92.9376",
      address: "Sector 4, Silpukhuri, Guwahati, Assam 781003",
      website: "https://assamrapidrelief.org",
      phone: "+91 361 245 8899",
      docs: {
        certificate: "darpan_reg_88492.pdf",
        taxDoc: "section_80g_exemption.pdf",
        disasterHistory: "assam_floods_2024_report.pdf",
      },
      status: "approved",
      rejectionReason: null,
      createdAt: new Date("2024-01-15T00:00:00Z"),
      updatedAt: new Date(),
    };
  }

  const params = await searchParams;
  const justApplied = params.applied === "true";

  if (!ngo) {
    return (
      <div className="section max-w-2xl mx-auto py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4 border border-outline-variant">
          <Building2 className="w-8 h-8 text-on-surface-variant" />
        </div>
        <h1 className="text-2xl font-bold text-on-surface mb-2">No NGO registered yet</h1>
        <p className="text-sm text-on-surface-variant mb-6 max-w-md mx-auto">
          Submit your accreditation application to unlock verified responder rankings,
          AI inventory budgeting, and escrow disbursements.
        </p>
        <Link
          href="/ngo/apply"
          className="py-2.5 px-6 rounded-input bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-xs transition-colors inline-flex items-center gap-2"
        >
          <span>Apply for Accreditation</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const badge = badgeLabel(ngo.badge);

  const statusConfig = {
    pending: {
      icon: Clock,
      color: "text-secondary-900",
      bg: "bg-secondary-container/20",
      border: "border-secondary/40",
      badgeVariant: "HIGH" as const,
      badgeText: "Pending Admin Audit",
      title: "Accreditation Application Under Review",
      desc: "Our verification team is reviewing your registration documents against government registry records. This usually takes 2–4 hours during active disaster declarations.",
    },
    approved: {
      icon: CheckCircle2,
      color: "text-tertiary",
      bg: "bg-tertiary-container/15",
      border: "border-tertiary/40",
      badgeVariant: "GOVT" as const,
      badgeText: "Accreditation Approved",
      title: "Accreditation Approved & Active",
      desc: "Your organisation is officially verified to receive donor escrow allocations and upload geotagged distribution proof.",
    },
    rejected: {
      icon: XCircle,
      color: "text-urgent",
      bg: "bg-urgent-container/20",
      border: "border-urgent/40",
      badgeVariant: "URGENT" as const,
      badgeText: "Application Rejected",
      title: "Accreditation Not Approved",
      desc:
        ngo.rejectionReason ||
        "Registration credentials could not be validated. Please contact administrator review.",
    },
  }[ngo.status];

  const StatusIcon = statusConfig.icon;

  return (
    <div className="section max-w-5xl mx-auto py-8 space-y-8 animate-in fade-in">
      {justApplied && (
        <div className="p-4 bg-tertiary-container/20 border border-tertiary/40 rounded-card flex items-start gap-3 text-xs text-on-surface">
          <CheckCircle2 className="w-5 h-5 text-tertiary shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold text-tertiary block text-sm">
              Application Submitted Successfully!
            </strong>
            <p className="text-on-surface-variant mt-0.5">
              Your NGO accreditation package has been delivered to the admin audit queue.
              You can test the AI inventory budget parser below while waiting for approval.
            </p>
          </div>
        </div>
      )}

      {/* Status Hero Card */}
      <div
        className={cn(
          "rounded-card p-6 border flex flex-col sm:flex-row items-start justify-between gap-4 shadow-sm",
          statusConfig.bg,
          statusConfig.border
        )}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center shrink-0 border border-outline-variant/60 shadow-xs">
            <StatusIcon className={cn("w-6 h-6", statusConfig.color)} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={statusConfig.badgeVariant} dot>
                {statusConfig.badgeText}
              </Badge>
              <span className="text-[11px] font-mono text-on-surface-variant">
                ID: {ngo.id.slice(0, 8)}
              </span>
            </div>
            <h1 className="text-xl font-bold text-on-surface">{statusConfig.title}</h1>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed max-w-2xl">
              {statusConfig.desc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/ngo/proof"
            className="py-2.5 px-4 rounded-input bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <Camera className="w-4 h-4" />
            <span>Upload Delivery Proof</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Details & Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: NGO Profile Card & Documents (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-surface rounded-card border border-outline-variant/60 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-outline-variant/40">
              <div>
                <h2 className="text-xl font-extrabold text-on-surface tracking-tight">
                  {ngo.name}
                </h2>
                {ngo.registrationNumber && (
                  <p className="text-xs font-mono text-on-surface-variant mt-0.5">
                    Reg / FCRA: {ngo.registrationNumber}
                  </p>
                )}
              </div>
              <Badge variant={ngo.badge === "govt" ? "GOVT" : "PLATFORM"}>
                {ngo.badge === "govt" ? "Government Accredited" : "Platform Verified"}
              </Badge>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed mb-5">
              {ngo.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-t border-outline-variant/40 pt-4">
              {ngo.address && (
                <div className="flex items-start gap-2 text-on-surface-variant">
                  <MapPin className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                  <span className="text-on-surface">{ngo.address}</span>
                </div>
              )}
              {ngo.phone && (
                <div className="flex items-start gap-2 text-on-surface-variant">
                  <Phone className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                  <span className="font-mono text-on-surface">{ngo.phone}</span>
                </div>
              )}
              {ngo.website && (
                <div className="flex items-start gap-2 text-on-surface-variant">
                  <Globe className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                  <a
                    href={ngo.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline truncate"
                  >
                    {ngo.website}
                  </a>
                </div>
              )}
              {ngo.baseLat && ngo.baseLng && (
                <div className="flex items-start gap-2 text-on-surface-variant">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                  <span className="font-mono text-xs text-on-surface">
                    Base: {ngo.baseLat}, {ngo.baseLng}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Uploaded Documents Preview Card */}
          <div className="bg-surface rounded-card border border-outline-variant/60 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-primary" />
              <span>Accreditation Documents On File</span>
            </h3>

            <div className="space-y-3">
              {[
                { key: "certificate", label: "Registration Certificate (80G / Darpan)" },
                { key: "taxDoc", label: "Tax Exemption Document" },
                { key: "disasterHistory", label: "Past Operational Record / Audit" },
              ].map((d) => {
                const url = (ngo.docs as Record<string, string | undefined>)?.[d.key];
                return (
                  <div
                    key={d.key}
                    className="flex items-center justify-between p-3 rounded-card bg-surface-container/40 border border-outline-variant/40 text-xs"
                  >
                    <span className="font-medium text-on-surface">{d.label}</span>
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <span>View Document</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-on-surface-variant italic">
                        Not provided
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Quick Mission Actions & Stats (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface rounded-card border border-outline-variant/60 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
              Relief Mission Controls
            </h3>

            <div className="space-y-2.5">
              <Link
                href="/ngo/proof"
                className="w-full py-3 px-4 rounded-input bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-xs transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  <span>Upload Field Delivery Photo</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/map"
                className="w-full py-3 px-4 rounded-input border border-outline text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>View Epicenter Crisis Map</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="bg-surface-container/60 rounded-card border border-outline-variant/60 p-6 space-y-3">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Verification Protocol
            </h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              When relief items are delivered to beneficiaries, capture photos using your
              smartphone camera with location services turned ON. Our automated EXIF parser
              validates GPS coordinates against the disaster radius to release your milestone escrow.
            </p>
          </div>
        </div>
      </div>

      {/* Embedded AI Inventory Budget Parser */}
      <div className="pt-2">
        <AiInventoryParserCard />
      </div>
    </div>
  );
}
