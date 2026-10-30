import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ngos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { CheckCircle, Clock, XCircle, Building2, FileText, MapPin, Globe, Phone, ArrowRight } from "lucide-react";
import { badgeLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { AiInventoryModal } from "@/components/ngo/AiInventoryModal";

export const dynamic = "force-dynamic";

export default async function NGOProfilePage({ searchParams }: { searchParams: Promise<{ applied?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [ngo] = await db.select().from(ngos).where(eq(ngos.userId, session.user.id)).limit(1);
  const params = await searchParams;
  const justApplied = params.applied === "true";

  if (!ngo) {
    return (
      <div className="section max-w-2xl mx-auto py-20 text-center">
        <Building2 className="w-14 h-14 text-outline mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-on-surface mb-2">No NGO registered yet</h1>
        <p className="text-on-surface-variant mb-6">Submit your accreditation application to start receiving verified donations.</p>
        <Link href="/ngo/apply" className="btn-primary">
          Apply Now <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const badge = badgeLabel(ngo.badge);

  const statusConfig = {
    pending: {
      icon: Clock,
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
      title: "Application Under Review",
      desc: "Your application is being reviewed by our team. This typically takes 2–3 business days.",
    },
    approved: {
      icon: CheckCircle,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      title: "Accreditation Approved",
      desc: "Your NGO is verified and can create campaigns to receive donations.",
    },
    rejected: {
      icon: XCircle,
      color: "text-red-700",
      bg: "bg-red-50",
      border: "border-red-200",
      title: "Application Rejected",
      desc: ngo.rejectionReason ?? "Please contact support for more information.",
    },
  }[ngo.status];

  const StatusIcon = statusConfig.icon;

  return (
    <div className="section max-w-4xl mx-auto animate-fade-in">
      {justApplied && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-tertiary-50 border border-tertiary-200 rounded-card text-sm text-tertiary-700">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong>Application submitted successfully!</strong>
            <p className="mt-0.5 text-tertiary-600">We&apos;ll review your documents and notify you within 2–3 business days.</p>
          </div>
        </div>
      )}

      {/* Status Banner */}
      <div className={cn("rounded-card p-5 border flex items-start gap-4 mb-6", statusConfig.bg, statusConfig.border)}>
        <StatusIcon className={cn("w-6 h-6 mt-0.5 shrink-0", statusConfig.color)} />
        <div>
          <p className={cn("font-semibold", statusConfig.color)}>{statusConfig.title}</p>
          <p className="text-sm text-on-surface-variant mt-0.5">{statusConfig.desc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: NGO Details */}
        <div className="md:col-span-2 space-y-5">
          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-on-surface">{ngo.name}</h1>
                {ngo.registrationNumber && (
                  <p className="text-xs font-mono text-outline mt-1">{ngo.registrationNumber}</p>
                )}
              </div>
              <span className={cn("badge text-xs font-semibold border", badge.bg, badge.color, badge.border)}>
                {badge.icon} {badge.label}
              </span>
            </div>

            <p className="text-sm text-on-surface-variant leading-relaxed mb-5">{ngo.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {ngo.address && (
                <div className="flex items-start gap-2 text-on-surface-variant">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-outline" />
                  <span>{ngo.address}</span>
                </div>
              )}
              {ngo.website && (
                <div className="flex items-start gap-2 text-on-surface-variant">
                  <Globe className="w-4 h-4 shrink-0 mt-0.5 text-outline" />
                  <a href={ngo.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    {ngo.website}
                  </a>
                </div>
              )}
              {ngo.phone && (
                <div className="flex items-start gap-2 text-on-surface-variant">
                  <Phone className="w-4 h-4 shrink-0 mt-0.5 text-outline" />
                  <span>{ngo.phone}</span>
                </div>
              )}
              {ngo.baseLat && ngo.baseLng && (
                <div className="flex items-start gap-2 text-on-surface-variant">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-outline" />
                  <span className="font-mono text-xs">{ngo.baseLat}, {ngo.baseLng}</span>
                </div>
              )}
            </div>
          </div>

          {/* Uploaded Documents */}
          <div className="card p-6">
            <h2 className="font-semibold text-on-surface mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-outline" /> Submitted Documents
            </h2>
            <div className="space-y-3">
              {[
                { key: "certificate", label: "Registration Certificate" },
                { key: "taxDoc", label: "Tax Exemption Document" },
                { key: "disasterHistory", label: "Past Operations Proof" },
              ].map((d) => {
                const url = (ngo.docs as Record<string, string | undefined>)?.[d.key];
                return (
                  <div key={d.key} className="flex items-center justify-between py-2 border-b border-outline-variant last:border-0">
                    <span className="text-sm text-on-surface">{d.label}</span>
                    {url ? (
                      <a href={url} target="_blank" rel="noreferrer" className="badge badge-platform text-xs">
                        <CheckCircle className="w-3 h-3" /> View
                      </a>
                    ) : (
                      <span className="text-xs text-outline italic">Not uploaded</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="space-y-4">
          {ngo.status === "approved" && (
            <div className="card p-5">
              <h3 className="font-semibold text-on-surface mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/ngo/proof" className="btn-primary w-full text-sm justify-center">
                  Upload Ground Delivery Proof
                </Link>
                <div className="pt-1">
                  <AiInventoryModal />
                </div>
              </div>
            </div>
          )}

          <div className="card p-5">
            <h3 className="font-semibold text-on-surface mb-3">Application Timeline</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <CheckCircle className="w-4 h-4 text-tertiary" />
                <div>
                  <p className="font-medium text-on-surface">Submitted</p>
                  <p className="text-xs">{new Date(ngo.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
              </div>
              <div className={cn("flex items-center gap-2", ngo.status !== "pending" ? "text-on-surface-variant" : "text-outline")}>
                {ngo.status === "approved" ? (
                  <CheckCircle className="w-4 h-4 text-tertiary" />
                ) : ngo.status === "rejected" ? (
                  <XCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-500" />
                )}
                <div>
                  <p className={cn("font-medium", ngo.status === "pending" ? "text-outline" : "text-on-surface")}>
                    {ngo.status === "pending" ? "Under Review" : ngo.status === "approved" ? "Approved" : "Rejected"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
