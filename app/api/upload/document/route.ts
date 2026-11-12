import { NextRequest, NextResponse } from "next/server";
import { requireRole, getSessionUser } from "@/lib/auth-guard";
import { uploadToCloudinary } from "@/lib/cloudinary";

// Dynamic import exifr for ESM compat
async function readExif(buffer: Buffer) {
  try {
    const exifr = (await import("exifr")).default;
    const gps = await exifr.gps(buffer);
    const tags = await exifr.parse(buffer, { pick: ["DateTimeOriginal", "GPSLatitude", "GPSLongitude"] });
    return {
      exifTime: tags?.DateTimeOriginal ?? null,
      exifGps: gps ? { lat: gps.latitude, lng: gps.longitude } : null,
    };
  } catch {
    return { exifTime: null, exifGps: null };
  }
}

export async function POST(req: NextRequest) {
  // Require NGO role
  const guard = await requireRole(["ngo", "admin"]);
  if (guard) return guard;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "documents";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "File type not allowed. Use JPG, PNG, WebP or PDF." }, { status: 400 });
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Read EXIF BEFORE Cloudinary strips it
    const exif = await readExif(buffer);

    // Upload to Cloudinary
    const { url, publicId } = await uploadToCloudinary(buffer, folder);

    return NextResponse.json({ url, publicId, exif }, { status: 200 });
  } catch (e) {
    console.error("Upload error:", e);
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
