import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaigns, ngos, proofs, users } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth-guard";

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
  } catch (err) {
    console.error("GET /api/admin/proofs", err);
    return NextResponse.json({ error: "Failed to load proof queue" }, { status: 500 });
  }
}

