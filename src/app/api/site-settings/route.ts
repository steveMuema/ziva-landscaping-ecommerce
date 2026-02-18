import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";
import { PUBLIC_SITE_KEYS } from "@/lib/setting-keys";

/** Public site settings for footer, chat, etc. No auth. */
export async function GET() {
  try {
    const keys = [...PUBLIC_SITE_KEYS];
    const raw = await getSettings(keys);
    const settings: Record<string, string> = {};
    for (const k of keys) {
      const v = raw[k];
      settings[k] = v != null && v.trim() !== "" ? v.trim() : "";
    }
    return NextResponse.json(settings);
  } catch (err) {
    console.error("GET /api/site-settings error:", err);
    return NextResponse.json(
      { error: "Failed to load site settings" },
      { status: 500 }
    );
  }
}
