import { v2 as cloudinary } from "cloudinary";
import * as dotenv from "dotenv";
import { getSettings } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/setting-keys";

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
  const fromDb = await getSettings([...keys]);
  return {
    cloud_name: (fromDb[SETTING_KEYS.CLOUDINARY_CLOUD_NAME] ?? process.env.CLOUDINARY_CLOUD_NAME) ?? "",
    api_key: (fromDb[SETTING_KEYS.CLOUDINARY_API_KEY] ?? process.env.CLOUDINARY_API_KEY) ?? "",
    api_secret: (fromDb[SETTING_KEYS.CLOUDINARY_API_SECRET] ?? process.env.CLOUDINARY_API_SECRET) ?? "",
  };
}

export async function uploadImage(file: File): Promise<string> {
  const config = await getCloudinaryConfig();
  if (!config.cloud_name?.trim() || !config.api_key?.trim() || !config.api_secret?.trim()) {
    throw new Error(
      "Cloudinary is not configured. Set Cloud name, API key, and API secret in Admin → Settings → API & payments (Cloudinary), or use CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in your environment."
    );
  }
  cloudinary.config(config);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { resource_type: "image" },
      (error, result) => {
        if (error) reject(error);
        else if (result?.secure_url) resolve(result.secure_url);
        else reject(new Error("Upload failed: No secure URL returned"));
      }
    ).end(buffer);
  });
}