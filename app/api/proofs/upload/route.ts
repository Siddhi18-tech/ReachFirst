import { NextRequest, NextResponse } from "next/server";
import { requireRole, getSessionUser } from "@/lib/auth-guard";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { campaigns, ngos, proofs } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

const DAY_MS = 86_400_000;
const MAX_AGE_DAYS = Number(process.env.PROOF_MAX_AGE_DAYS) > 0 ? Number(process.env.PROOF_MAX_AGE_DAYS) : 7;

async function readExif(buffer: Buffer) {
  try {
    const exifr = await import("exifr");
    return await exifr.parse(buffer, { gps: true, tiff: true, exif: true });
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

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Read EXIF BEFORE the Cloudinary upload (Cloudinary strips metadata)
    const exifData = await readExif(buffer);

    let exifTime: Date | null = null;
    let exifGps: { lat: number; lng: number } | null = null;

    if (exifData) {
      const rawTime = exifData.DateTimeOriginal || exifData.CreateDate;
      if (rawTime) {
        const parsedTime = new Date(rawTime);
        if (!Number.isNaN(parsedTime.getTime())) exifTime = parsedTime;
      }
      if (
        Number.isFinite(exifData.latitude) && Number.isFinite(exifData.longitude) &&
        Math.abs(exifData.latitude) <= 90 && Math.abs(exifData.longitude) <= 180
      ) {
        exifGps = { lat: exifData.latitude, lng: exifData.longitude };
      }
    }

    if (!exifGps) {
      return NextResponse.json(
        { error: "This image has no embedded GPS metadata and cannot be used as field proof" },
        { status: 400 }
      );
    }
    if (!exifTime) {
      return NextResponse.json(
        { error: "This image has no embedded capture time and cannot be used as field proof" },
        { status: 422 }
      );
    }
    const ageMs = Date.now() - exifTime.getTime();
    if (ageMs > MAX_AGE_DAYS * DAY_MS) {
      return NextResponse.json(
        { error: `This photo was taken more than ${MAX_AGE_DAYS} days ago. Upload a recent field photo.` },
        { status: 422 }
      );
    }
    if (ageMs < -DAY_MS) {
      return NextResponse.json({ error: "This photo's capture time is in the future" }, { status: 422 });
    }

    const [campaign] = await db
      .select({ id: campaigns.id, ngoStatus: ngos.status })
      .from(campaigns)
      .innerJoin(ngos, eq(campaigns.ngoId, ngos.id))
      .where(and(eq(campaigns.id, campaignId), eq(ngos.userId, user.id)))
      .limit(1);
    if (!campaign) return NextResponse.json({ error: "Campaign not found or not owned by your NGO" }, { status: 404 });
    if (campaign.ngoStatus !== "approved") {
      return NextResponse.json({ error: "Your NGO must be approved before uploading proof" }, { status: 403 });
    }

    // 2. Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(buffer, "proofs", "image");

    // 3. Save proof
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
      exif: { lat: exifGps.lat, lng: exifGps.lng, takenAt: exifTime.toISOString() },
    });
  } catch (err: unknown) {
    console.error("Proof upload error:", err);
    const msg = err instanceof Error ? err.message : "Failed to upload proof";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}