import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ngos, users } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth-guard";

const STATUSES = ["pending", "approved", "rejected"] as const;
type NgoStatus = (typeof STATUSES)[number];

const DOC_LABELS: Record<string, string> = {
  certificate: "Registration certificate",
  taxDoc: "Tax document",
  disasterHistory: "Disaster response history",
};

// GET /api/admin/applications?status=pending|approved|rejected|all
export async function GET(req: NextRequest) {
  const denied = await requireRole("admin");
  if (denied) return denied;

  const q = new URL(req.url).searchParams.get("status") ?? "pending";
  if (q !== "all" && !STATUSES.includes(q as NgoStatus)) {
    return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
  }

  const rows = await db
    .select({
      id: ngos.id,
      name: ngos.name,
      badge: ngos.badge,
      status: ngos.status,
      address: ngos.address,
      registrationNumber: ngos.registrationNumber,
      docs: ngos.docs,
      reason: ngos.rejectionReason,
      createdAt: ngos.createdAt,
      applicantEmail: users.email,
      applicantName: users.name,
    })
    .from(ngos)
    .leftJoin(users, eq(ngos.userId, users.id))
    .where(q === "all" ? undefined : eq(ngos.status, q as NgoStatus))
    .orderBy(ngos.createdAt);

  const applications = rows.map((r) => ({
    id: r.id,
    ngoName: r.name,
    badge: r.badge === "govt" ? "GOVT" : "PLATFORM",
    status: r.status,
    address: r.address ?? null,
    registrationNumber: r.registrationNumber ?? null,
    reason: r.reason ?? null,
    submittedAt: r.createdAt.toISOString(),
    applicant: { name: r.applicantName ?? null, email: r.applicantEmail ?? null },
    documents: Object.entries(r.docs ?? {})
      .filter(([, url]) => typeof url === "string" && url.length > 0)
      .map(([key, url]) => ({ key, label: DOC_LABELS[key] ?? key, url: url as string })),
  }));

  return NextResponse.json({ applications });
}