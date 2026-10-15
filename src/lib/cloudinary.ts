import { v2 as cloudinary } from "cloudinary";
import * as dotenv from "dotenv";
import { readSettings } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/setting-keys";
import prisma from "@/lib/prisma";

dotenv.config();

/** Cloud name, API key, and secret from Settings (DB) with env fallback. */
async function getCloudinaryConfig(): Promise<{
  cloud_name: string;
  api_key: string;
  api_secret: string;
}> {
  const keys = [
    SETTING_KEYS.CLOUDINARY_CLOUD_NAME,
    SETTING_KEYS.CLOUDINARY_API_KEY,
    SETTING_KEYS.CLOUDINARY_API_SECRET,
  ] as const;
  const fromDb = await readSettings([...keys]);
  return {
    cloud_name: (fromDb[SETTING_KEYS.CLOUDINARY_CLOUD_NAME] ?? process.env.CLOUDINARY_CLOUD_NAME) ?? "",
    api_key: (fromDb[SETTING_KEYS.CLOUDINARY_API_KEY] ?? process.env.CLOUDINARY_API_KEY) ?? "",
    api_secret: (fromDb[SETTING_KEYS.CLOUDINARY_API_SECRET] ?? process.env.CLOUDINARY_API_SECRET) ?? "",
  };
}

type UploadResult = {
  secure_url: string;
  public_id?: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
};

async function configured() {
  const config = await getCloudinaryConfig();
  if (!config.cloud_name?.trim() || !config.api_key?.trim() || !config.api_secret?.trim()) {
    throw new Error(
      "Cloudinary is not configured. Set Cloud name, API key, and API secret in Admin → Settings → Integrations (Cloudinary), or use CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in your environment."
    );
  }
  cloudinary.config(config);
}

/** Upload an image to Cloudinary, record it in the media library, and return its URL. */
export async function uploadImage(file: File): Promise<string> {
  await configured();

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const result = await new Promise<UploadResult>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { resource_type: "image" },
      (error, res) => {
        if (error) reject(error);
        else if (res?.secure_url) resolve(res as UploadResult);
        else reject(new Error("Upload failed: No secure URL returned"));
      }
    ).end(buffer);
  });

  await recordMedia(file, result);
  return result.secure_url;
}

/** Best-effort: a failure to record must not fail the upload itself. */
async function recordMedia(file: File, result: UploadResult) {
  try {
    const { getStaffUser } = await import("@/lib/admin-auth");
    const user = await getStaffUser().catch(() => null);
    await prisma.media.upsert({
      where: { url: result.secure_url },
      update: {},
      create: {
        url: result.secure_url,
        publicId: result.public_id ?? null,
        filename: file.name || null,
        mimeType: file.type || (result.format ? `image/${result.format}` : null),
        width: result.width ?? null,
        height: result.height ?? null,
        bytes: result.bytes ?? file.size ?? null,
        uploadedById: user?.id ?? null,
      },
    });
  } catch (error) {
    console.error("Failed to record uploaded image in the media library:", error);
  }
}

/** Remove an image from Cloudinary. */
export async function deleteImage(publicId: string): Promise<void> {
  await configured();
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}
