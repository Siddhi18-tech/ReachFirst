import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

export { cloudinary };

function detectExtension(buf: Buffer): string {
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return ".pdf";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return ".png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return ".jpg";
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return ".webp";
  return ".bin";
}

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  publicId?: string
): Promise<{ url: string; publicId: string }> {
  // 1. If valid Cloudinary credentials are provided, upload to Cloudinary CDN
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `relieftrack/${folder}`,
          public_id: publicId && publicId !== "image" ? publicId : undefined,
          resource_type: "auto",
        },
        (error, result) => {
          if (error || !result) reject(error);
          else resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );
      uploadStream.end(buffer);
    });
  }

  // 2. Local filesystem fallback for dev/demo mode when Cloudinary credentials are empty
  const ext = detectExtension(buffer);
  const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "_");
  const uploadsDir = path.join(process.cwd(), "public", "uploads", safeFolder);
  await fs.mkdir(uploadsDir, { recursive: true });

  const randomSuffix = crypto.randomBytes(6).toString("hex");
  const baseName = publicId && publicId !== "image"
    ? `${publicId.replace(/[^a-zA-Z0-9_-]/g, "_")}-${randomSuffix}`
    : `${Date.now()}-${randomSuffix}`;

  const filename = `${baseName}${ext}`;
  const filePath = path.join(uploadsDir, filename);
  await fs.writeFile(filePath, buffer);

  return {
    url: `/uploads/${safeFolder}/${filename}`,
    publicId: filename,
  };
}
