import { config as loadEnv } from "dotenv";
import path from "path";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { getSetting, setSetting, getGoogleCredentials } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/setting-keys";
import { encrypt } from "@/lib/encryption";

// Ensure .env is loaded in this route (Turbopack/Next can omit env in some contexts)
if (typeof process !== "undefined" && !process.env.ENCRYPTION_KEY) {
  loadEnv({ path: path.resolve(process.cwd(), ".env") });
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

/** Safe preview of credentials for UI (no secrets). Handles service account and OAuth (web/installed). */
function getCredentialsPreview(creds: Record<string, unknown>): string | null {
  if (typeof creds.client_email === "string" && creds.client_email.trim()) {
    return creds.client_email.trim();
  }
  if (typeof creds.client_id === "string" && creds.client_id.trim()) {
    return creds.client_id.trim();
  }
  const web = creds.web as Record<string, unknown> | undefined;
  if (web && typeof web.client_id === "string" && web.client_id.trim()) {
    return web.client_id.trim();
  }
  const installed = creds.installed as Record<string, unknown> | undefined;
  if (installed && typeof installed.client_id === "string" && installed.client_id.trim()) {
    return installed.client_id.trim();
  }
  if (creds.type === "service_account") return "Service account (no client_email in payload)";
  return null;
}

/** GET: returns whether credentials are uploaded and a safe preview (e.g. client_email) so you can confirm they're readable. */
export async function GET(request: NextRequest) {
  try {
    const unauth = await requireAdmin(request);
    if (unauth) return unauth;
    const creds = await getGoogleCredentials();
    const uploaded = !!creds;
    const preview = creds ? getCredentialsPreview(creds) : null;
    return NextResponse.json({
      uploaded,
      preview: preview ?? undefined,
      parsed: uploaded,
    });
  } catch (err) {
    console.error("GET /api/admin/settings/google-credentials error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to check credentials" },
      { status: 500 }
    );
  }
}

/** POST: upload credentials JSON (body: { content: string }). Stored encrypted. */
export async function POST(request: NextRequest) {
  try {
    const unauth = await requireAdmin(request);
    if (unauth) return unauth;
    let body: { content?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    if (!content) {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "Content must be valid JSON (Google credentials file)" },
        { status: 400 }
      );
    }
    if (!process.env.ENCRYPTION_KEY) {
      loadEnv({ path: path.resolve(process.cwd(), ".env") });
    }
    const encrypted = encrypt(content);
    await setSetting(SETTING_KEYS.GOOGLE_CREDENTIALS, encrypted);
    const preview = getCredentialsPreview(parsed);
    return NextResponse.json({
      ok: true,
      uploaded: true,
      parsed: true,
      preview: preview ?? undefined,
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes("ENCRYPTION_KEY")) {
      return NextResponse.json(
        {
          error:
            "Server encryption not configured. Add ENCRYPTION_KEY to your .env file. Generate a key with: openssl rand -hex 32",
        },
        { status: 503 }
      );
    }
    console.error("POST /api/admin/settings/google-credentials error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save credentials" },
      { status: 500 }
    );
  }
}

/** DELETE: remove stored credentials. */
export async function DELETE(request: NextRequest) {
  try {
    const unauth = await requireAdmin(request);
    if (unauth) return unauth;
    await setSetting(SETTING_KEYS.GOOGLE_CREDENTIALS, "");
    return NextResponse.json({ ok: true, uploaded: false });
  } catch (err) {
    console.error("DELETE /api/admin/settings/google-credentials error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to remove credentials" },
      { status: 500 }
    );
  }
}
