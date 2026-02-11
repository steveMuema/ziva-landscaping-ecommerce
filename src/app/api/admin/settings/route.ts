import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { getSettings, setSetting, SETTING_KEYS } from "@/lib/settings";

const ALL_KEYS = Object.values(SETTING_KEYS);

const MASKED_KEYS = new Set([
  SETTING_KEYS.GOOGLE_API_KEY,
  SETTING_KEYS.MPESA_CONSUMER_KEY,
  SETTING_KEYS.MPESA_CONSUMER_SECRET,
  SETTING_KEYS.MPESA_SHORTCODE,
  SETTING_KEYS.MPESA_PASSKEY,
]);

function mask(value: string | null): string {
  if (value == null || value === "") return "";
  if (value.length <= 4) return "••••";
  return value.slice(0, 2) + "••••" + value.slice(-2);
}

async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const unauth = await requireAdmin(request);
    if (unauth) return unauth;
    const values = await getSettings(ALL_KEYS);
    const result: Record<string, string> = {};
    for (const key of ALL_KEYS) {
      const v = values[key];
      result[key] = v ? (MASKED_KEYS.has(key) ? mask(v) : v) : "";
    }
    return NextResponse.json({ settings: result });
  } catch (err) {
    console.error("GET /api/admin/settings error:", err);
    const message = err instanceof Error ? err.message : "Failed to load settings";
    const isPrisma = message.includes("does not exist") || message.includes("Setting") || message.includes("prisma");
    return NextResponse.json(
      { error: isPrisma ? "Settings table missing. Run: npx prisma db push" : message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const unauth = await requireAdmin(request);
    if (unauth) return unauth;
    let body: Record<string, string>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const allowed = new Set(ALL_KEYS);
    for (const [key, value] of Object.entries(body)) {
      if (!allowed.has(key)) continue;
      if (typeof value !== "string") continue;
      await setSetting(key, value.trim());
    }
    const values = await getSettings(ALL_KEYS);
    const result: Record<string, string> = {};
    for (const key of ALL_KEYS) {
      const v = values[key];
      result[key] = v ? (MASKED_KEYS.has(key) ? mask(v) : v) : "";
    }
    return NextResponse.json({ settings: result });
  } catch (err) {
    console.error("PATCH /api/admin/settings error:", err);
    const message = err instanceof Error ? err.message : "Failed to save settings";
    const isPrisma = message.includes("does not exist") || message.includes("Setting") || message.includes("prisma");
    return NextResponse.json(
      { error: isPrisma ? "Settings table missing. Run: npx prisma db push" : message },
      { status: 500 }
    );
  }
}
