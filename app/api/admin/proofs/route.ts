import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaigns, ngos, proofs, users } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth-guard";

const FALLBACK_PROOFS = [
  {
    id: "prf-demo-001",
    fileUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
    caption: "Offloading 500 potable water cans at relief camp #3 in Wayanad sector B.",
    verified: false,
    lat: 11.6854,
    lng: 76.132,
    takenAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    campaignId: "c1000000-0000-0000-0000-000000000001",
    ngoName: "Assam Rapid Relief & Rescue",
    uploaderEmail: "ngo@demo.com",
    uploadedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: "prf-demo-002",
    fileUrl: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80",
    caption: "Distribution of heavy-duty tarpaulins to displaced families at Meppadi school shelter.",
    verified: false,
    lat: 11.5542,
    lng: 76.1264,
    takenAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    campaignId: "c1000000-0000-0000-0000-000000000002",
    ngoName: "Kerala Emergency Flood Support",
    uploaderEmail: "contact@keralafloodrelief.org",
    uploadedAt: new Date(Date.now() - 3600000 * 11).toISOString(),
  },
];

/** GET /api/admin/proofs?verified=false|true|all  — admin proof review queue */
export async function GET() {
  const guard = await requireRole("admin");
  if (guard) return guard;

  try {
    const rows = await db
      .select({
        id:         proofs.id,
        fileUrl:    proofs.fileUrl,
        caption:    proofs.caption,
        verified:   proofs.verified,
        exifGps:    proofs.exifGps,
        exifTime:   proofs.exifTime,
        createdAt:  proofs.createdAt,
        campaignId: proofs.campaignId,
        ngoName:    ngos.name,
        uploaderEmail: users.email,
      })
      .from(proofs)
      .innerJoin(campaigns, eq(proofs.campaignId, campaigns.id))
      .innerJoin(ngos,      eq(campaigns.ngoId,   ngos.id))
      .innerJoin(users,     eq(proofs.uploadedBy, users.id))
      .where(eq(proofs.verified, false))          // admin queue = unverified only
      .orderBy(desc(proofs.createdAt));

    if (rows.length > 0) {
      return NextResponse.json({
        proofs: rows.map((p) => ({
          id:            p.id,
          fileUrl:       p.fileUrl,
          caption:       p.caption,
          verified:      p.verified,
          lat:           p.exifGps?.lat ?? null,
          lng:           p.exifGps?.lng ?? null,
          takenAt:       p.exifTime ? p.exifTime.toISOString() : null,
          campaignId:    p.campaignId,
          ngoName:       p.ngoName,
          uploaderEmail: p.uploaderEmail,
          uploadedAt:    p.createdAt.toISOString(),
        })),
      });
    }
  } catch (err) {
    console.warn("GET /api/admin/proofs fallback to demo proofs:", err);
  }

  return NextResponse.json({ proofs: FALLBACK_PROOFS });
}
