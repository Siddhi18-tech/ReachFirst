import { NextRequest, NextResponse } from "next/server";
import { requireRole, getSessionUser } from "@/lib/auth-guard";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { campaigns, ngos, proofs } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

// Dynamic import exifr for ESM compatibility
async function readExif(buffer: Buffer) {
  try {
    const exifr = await import("exifr");
    const data = await exifr.parse(buffer, {
      gps: true,
      tiff: true,
      exif: true,
    });
    return data;
  } catch (err) {
    console.warn("EXIF extraction error (may be stripped or screenshot):", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireRole(["ngo", "admin"]);
  if (guard) return guard;

  const user = await getSessionUser();
  if (!user || !user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const campaignId = formData.get("campaignId") as string | null;
    const caption = (formData.get("caption") as string | null)?.trim() || "Field delivery distribution";

    if (!file || !campaignId) {
      return NextResponse.json({ error: "Missing file or campaignId" }, { status: 400 });
    }

    if (!/^[0-9a-f-]{36}$/i.test(campaignId)) {
      return NextResponse.json({ error: "Invalid campaignId" }, { status: 400 });
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Upload a JPG, PNG, or WebP image no larger than 10MB" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Read EXIF BEFORE Cloudinary upload (as Cloudinary strips metadata)
    const exifData = await readExif(buffer);

    let exifTime: Date | null = null;
    let exifGps: { lat: number; lng: number } | null = null;

    if (exifData) {
      if (exifData.DateTimeOriginal || exifData.CreateDate) {
        const parsedTime = new Date(exifData.DateTimeOriginal || exifData.CreateDate);
        if (!Number.isNaN(parsedTime.getTime())) exifTime = parsedTime;
      }
      if (Number.isFinite(exifData.latitude) && Number.isFinite(exifData.longitude)
        && Math.abs(exifData.latitude) <= 90 && Math.abs(exifData.longitude) <= 180) {
        exifGps = {
          lat: exifData.latitude,
          lng: exifData.longitude,
        };
      }
    }

    if (!exifGps) {
      return NextResponse.json({ error: "This image has no embedded GPS metadata and cannot be used as field proof" }, { status: 400 });
    }

    const [campaign] = await db.select({ id: campaigns.id }).from(campaigns)
      .innerJoin(ngos, eq(campaigns.ngoId, ngos.id))
      .where(and(eq(campaigns.id, campaignId), eq(ngos.userId, user.id)))
      .limit(1);
    if (!campaign) return NextResponse.json({ error: "Campaign not found or not owned by your NGO" }, { status: 404 });

    // 2. Upload to Cloudinary folder
    const uploadResult = await uploadToCloudinary(buffer, "proofs", "image");

    // 3. Save proof into DB
    const [inserted] = await db
      .insert(proofs)
      .values({ campaignId, fileUrl: uploadResult.url, caption, exifTime, exifGps, verified: false, uploadedBy: user.id })
      .returning({ id: proofs.id });
    if (!inserted) throw new Error("Failed to save proof record");

    return NextResponse.json({
      success: true,
      proofId: inserted.id,
      url: uploadResult.url,
      exifTime,
      exifGps,
      verified: false,
    });
  } catch (err: unknown) {
    console.error("Proof upload error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to upload proof" }, { status: 500 });
  }
}
