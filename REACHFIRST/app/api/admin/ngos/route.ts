import { NextRequest, NextResponse } from "next/server";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

const MOCK_APPLICATIONS = [
  {
    id: "app-101",
    name: "Kerala Relief Front",
    badge: "govt",
    status: "approved",
    address: "Meppadi Ward 4, Wayanad, Kerala 673577",
    registrationNumber: "KL-NGO-2024-8891",
    docs: {
      certificate: "https://example.com/certificate.pdf",
      taxDoc: "https://example.com/80g.pdf",
      disasterHistory: "https://example.com/history.pdf",
    },
    createdAt: "2026-08-01T10:00:00Z",
    userEmail: "contact@keralarelief.org",
    userName: "Dr. K. Nair",
    rejectionReason: null,
  },
  {
    id: "app-102",
    name: "Himalayan Hope Disaster Trust",
    badge: "platform",
    status: "pending",
    address: "Dehradun, Uttarakhand 248001",
    registrationNumber: "UK-NGO-8821",
    docs: {
      certificate: "https://example.com/certificate.pdf",
      taxDoc: "https://example.com/tax.pdf",
      disasterHistory: "https://example.com/disaster.pdf",
    },
    createdAt: "2026-08-04T12:30:00Z",
    userEmail: "director@himalayanhope.org",
    userName: "Dr. Arvind Verma",
    rejectionReason: null,
  },
  {
    id: "app-103",
    name: "Brahmaputra Flood Rescue Corps",
    badge: "govt",
    status: "pending",
    address: "Barpeta Town, Assam 781301",
    registrationNumber: "AS-NGO-1942",
    docs: {
      certificate: "https://example.com/certificate.pdf",
      taxDoc: "https://example.com/80g.pdf",
    },
    createdAt: "2026-08-05T09:15:00Z",
    userEmail: "rescue@brahmaputraaid.in",
    userName: "M. Hazarika",
    rejectionReason: null,
  },
  {
    id: "app-104",
    name: "Coastal Aid League",
    badge: "platform",
    status: "rejected",
    address: "Puri Coast Road, Odisha 752001",
    registrationNumber: "OD-TR-4029",
    docs: {
      certificate: "https://example.com/certificate.pdf",
    },
    createdAt: "2026-07-28T16:00:00Z",
    userEmail: "coastalaid@odisha.net",
    userName: "R. Mohanty",
    rejectionReason: "Incomplete tax exemption documentation and invalid Darpan ID verification.",
  },
];

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "all";

  if (USE_MOCK) {
    const filtered =
      status === "all"
        ? MOCK_APPLICATIONS
        : MOCK_APPLICATIONS.filter((a) => a.status === status);
    return NextResponse.json({ ngos: filtered });
  }

  try {
    const { db } = await import("@/lib/db");
    const { ngos, users } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    let query = db
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

    if (status !== "all") {
      // @ts-expect-error drizzle query builder
      query = query.where(eq(ngos.status, status));
    }

    const rows = await query.orderBy(ngos.createdAt);
    return NextResponse.json({ ngos: rows });
  } catch (err) {
    console.warn("Admin applications fetch fallback to mock:", err);
    const filtered =
      status === "all"
        ? MOCK_APPLICATIONS
        : MOCK_APPLICATIONS.filter((a) => a.status === status);
    return NextResponse.json({ ngos: filtered });
  }
}
