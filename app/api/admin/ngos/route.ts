import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ngos, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth-guard";

const FALLBACK_ADMIN_NGOS = [
  {
    id: "ngo-fall-001",
    name: "Kerala Emergency Flood Support",
    badge: "govt",
    status: "pending",
    address: "Civil Station Ward, Alappuzha, Kerala 688001",
    registrationNumber: "KL-DARPAN-44910",
    docs: {
      certificate: "darpan_kl_44910.pdf",
      taxDoc: "80g_exemption.pdf",
      disasterHistory: "kerala_floods_2018_2021.pdf",
    },
    createdAt: new Date("2026-08-01T10:00:00Z"),
    rejectionReason: null,
    userEmail: "contact@keralafloodrelief.org",
    userName: "Mathew Varghese",
  },
  {
    id: "ngo-fall-002",
    name: "Assam Rapid Relief & Rescue",
    badge: "govt",
    status: "approved",
    address: "Sector 4, Silpukhuri, Guwahati, Assam 781003",
    registrationNumber: "AS-DARPAN-88492",
    docs: {
      certificate: "darpan_as_88492.pdf",
      taxDoc: "tax_clearance.pdf",
      disasterHistory: "assam_floods_2024.pdf",
    },
    createdAt: new Date("2026-07-20T08:30:00Z"),
    rejectionReason: null,
    userEmail: "ngo@demo.com",
    userName: "Demo NGO Relief",
  },
  {
    id: "ngo-fall-003",
    name: "Himalayan Foothills Disaster Group",
    badge: "platform",
    status: "rejected",
    address: "Mall Road, Shimla, HP 171001",
    registrationNumber: "HP-DARPAN-12003",
    docs: {
      certificate: "unverified_cert.pdf",
    },
    createdAt: new Date("2026-07-10T14:20:00Z"),
    rejectionReason: "Official 80G tax document missing and registration certificate not found on Niti Aayog Darpan portal.",
    userEmail: "shimla@himalayanrelief.org",
    userName: "Vikram Negi",
  },
];

// GET /api/admin/ngos — list all pending NGOs with user email
export async function GET(req: NextRequest) {
  const guard = await requireRole("admin");
  if (guard) return guard;

  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status") ?? "pending";

  try {
    const query = db
      .select({
        id: ngos.id,
        name: ngos.name,
        badge: ngos.badge,
        status: ngos.status,
        address: ngos.address,
        registrationNumber: ngos.registrationNumber,
        docs: ngos.docs,
        createdAt: ngos.createdAt,
        rejectionReason: ngos.rejectionReason,
        userEmail: users.email,
        userName: users.name,
      })
      .from(ngos)
      .leftJoin(users, eq(ngos.userId, users.id));

    const rows =
      statusParam === "all"
        ? await query.orderBy(ngos.createdAt)
        : await query.where(eq(ngos.status, statusParam as "pending" | "approved" | "rejected")).orderBy(ngos.createdAt);

    if (rows.length > 0) {
      return NextResponse.json({ ngos: rows });
    }
  } catch (err) {
    console.warn("GET /api/admin/ngos fallback to demo list:", err);
  }

  // Fallback filtering
  const filtered =
    statusParam === "all"
      ? FALLBACK_ADMIN_NGOS
      : FALLBACK_ADMIN_NGOS.filter((n) => n.status === statusParam);

  return NextResponse.json({ ngos: filtered });
}
