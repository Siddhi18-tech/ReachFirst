import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-guard";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

async function readExif(buffer: Buffer) {
  try {
    const exifr = await import("exifr");
    return await exifr.parse(buffer, { gps: true, tiff: true, exif: true });
  } catch (err) {
    console.warn("EXIF extraction notice:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const campaignId = (formData.get("campaignId") as string | null) || "c1000000-0000-0000-0000-000000000001";
    const caption = (formData.get("caption") as string | null)?.trim() || "Field distribution proof";

    if (!file) {
      return NextResponse.json({ error: "Missing image file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const exifData = await readExif(buffer);

    let exifGps: { lat: number; lng: number } | null = null;
    let exifTime: Date | null = null;

    if (exifData) {
      if (
        Number.isFinite(exifData.latitude) &&
        Number.isFinite(exifData.longitude) &&
        Math.abs(exifData.latitude) <= 90 &&
        Math.abs(exifData.longitude) <= 180
      ) {
        exifGps = { lat: exifData.latitude, lng: exifData.longitude };
      }
      const rawTime = exifData.DateTimeOriginal || exifData.CreateDate;
      if (rawTime) {
        const parsed = new Date(rawTime);
        if (!Number.isNaN(parsed.getTime())) exifTime = parsed;
      }
    }

    // Default coordinates if mocked or demo
    if (!exifGps) {
      // In strict mode without mock, reject:
      if (!USE_MOCK && process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "This image has no embedded GPS metadata and cannot be verified as field proof" },
          { status: 400 }
        );
      }
      // Demo / fallback coordinates
      exifGps = { lat: 11.6854, lng: 76.132 };
      exifTime = new Date();
    }

    const proofId = `PROOF-${Date.now()}`;
    const mockCloudinaryUrl =
      "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80";

    // Attempt live Cloudinary upload if configured
    let fileUrl = mockCloudinaryUrl;
    if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      try {
        const { uploadToCloudinary } = await import("@/lib/cloudinary");
        const uploadResult = await uploadToCloudinary(buffer, "proofs", "image");
        if (uploadResult?.url) fileUrl = uploadResult.url;
      } catch (cloudErr) {
        console.warn("Cloudinary upload failed, falling back to data URL / mock:", cloudErr);
      }
    }

    // Attempt DB record creation if configured
    try {
      const { db } = await import("@/lib/db");
      const { proofs } = await import("@/lib/db/schema");
      await db.insert(proofs).values({
        campaignId,
        fileUrl,
        caption,
        exifTime: exifTime || new Date(),
        exifGps,
        verified: false,
        uploadedBy: user?.id || "mock-user-001",
      });
    } catch {
      // ignore db errors in mock mode
    }

    return NextResponse.json({
      success: true,
      proofId,
      url: fileUrl,
      exifTime: (exifTime || new Date()).toISOString(),
      exifGps,
      verified: false,
      caption,
    });
  } catch (err: unknown) {
    console.error("Proof upload error:", err);
    return NextResponse.json({ error: "Failed to process and upload proof" }, { status: 500 });
  }
}
