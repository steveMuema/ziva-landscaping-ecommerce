import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { encryptLegacySecrets, getSettings, isSecretSetting, readSettings, setSetting, SETTING_KEYS } from "@/lib/settings";
import { MASKED_SETTING_KEYS } from "@/lib/setting-keys";
import { validateSettings } from "@/lib/setting-schemas";
import { audit, type AuditChanges } from "@/lib/audit";

const ALL_KEYS = Object.values(SETTING_KEYS).filter(
  (k) => k !== SETTING_KEYS.GOOGLE_CREDENTIALS
);

const MASKED_KEYS = new Set<string>(MASKED_SETTING_KEYS);

function mask(value: string | null): string {
  if (value == null || value === "") return "";
  if (value.length <= 4) return "••••";
  return value.slice(0, 2) + "••••" + value.slice(-2);
}

/** Settings for the admin form: masked keys are never sent in full. */
async function maskedSettings(): Promise<Record<string, string>> {
  const values = await readSettings(ALL_KEYS);
  const result: Record<string, string> = {};
  for (const key of ALL_KEYS) {
    const v = values[key];
    result[key] = v ? (MASKED_KEYS.has(key) ? mask(v) : v) : "";
  }
  return result;
}

function errorResponse(err: unknown, fallback: string) {
  const message = err instanceof Error ? err.message : fallback;
  const isPrisma = message.includes("does not exist") || message.includes("Setting") || message.includes("prisma");
  return NextResponse.json(
    { error: isPrisma ? "Settings table missing. Run: npx prisma migrate deploy" : message },
    { status: 500 }
  );
}

export async function GET() {
  try {
    const auth = await requireAdminApi();
    if ("response" in auth) return auth.response;
    // Older installs stored credentials in plaintext; encrypt them the first time an admin opens settings.
    const { unavailable } = await encryptLegacySecrets();
    return NextResponse.json({ settings: await maskedSettings(), encryptionUnavailable: unavailable ?? false });
  } catch (err) {
    console.error("GET /api/admin/settings error:", err);
    return errorResponse(err, "Failed to load settings");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if ("response" in auth) return auth.response;
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const allowed = new Set<string>(ALL_KEYS as readonly string[]);
    const input: Record<string, string> = {};
    for (const [key, value] of Object.entries(body)) {
      if (!allowed.has(key) || typeof value !== "string") continue;
      const trimmed = value.trim();
      // Masked fields come back as "" or the masked placeholder when unchanged.
      if (MASKED_KEYS.has(key) && (trimmed === "" || trimmed.includes("••••"))) continue;
      input[key] = trimmed;
    }

    const result = validateSettings(input);
    if (result.errors) {
      return NextResponse.json({ error: "Please fix the highlighted fields.", fieldErrors: result.errors }, { status: 400 });
    }

    const before = await getSettings(Object.keys(result.values));
    const changes: AuditChanges = {};
    for (const [key, value] of Object.entries(result.values)) {
      const secret = isSecretSetting(key);
      // Encrypted values differ on every save, so for secrets any submitted value counts as a change.
      if (!secret && (before[key] ?? "") === value) continue;
      await setSetting(key, value);
      // Masked values (secrets, shortcode, client ID) are never written to the audit log.
      changes[key] = MASKED_KEYS.has(key) ? { from: "(hidden)", to: "(hidden)" } : { from: before[key] ?? "", to: value };
    }

    if (Object.keys(changes).length > 0) {
      await audit(auth.user, {
        action: "setting.update",
        entity: "Setting",
        summary: `Updated settings: ${Object.keys(changes).join(", ")}`,
        changes,
      });
    }

    return NextResponse.json({ settings: await maskedSettings() });
  } catch (err) {
    console.error("PATCH /api/admin/settings error:", err);
    return errorResponse(err, "Failed to save settings");
  }
}
