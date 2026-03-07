import prisma from "@/lib/prisma";
import { SETTING_KEYS } from "@/lib/setting-keys";
import { unstable_cache } from "next/cache";

export { SETTING_KEYS };

/** Get a single setting value from DB. Returns null if not set or DB unavailable. */
export const getSetting = unstable_cache(
  async (key: string): Promise<string | null> => {
    if (!process.env.DATABASE_URL) return null;
    try {
      const row = await prisma.setting.findUnique({
        where: { key },
      });
      return row?.value ?? null;
    } catch {
      return null;
    }
  },
  ['getSetting'],
  { tags: ['settings'], revalidate: 3600 }
);

/** Get multiple settings. Returns record of key -> value (null if not set or DB unavailable). */
export const getSettings = unstable_cache(
  async (keys: string[]): Promise<Record<string, string | null>> => {
    if (keys.length === 0) return {};
    if (!process.env.DATABASE_URL) return Object.fromEntries(keys.map(k => [k, null]));
    try {
      const rows = await prisma.setting.findMany({
        where: { key: { in: keys } },
      });
      const map: Record<string, string | null> = {};
      for (const k of keys) map[k] = null;
      for (const r of rows) map[r.key] = r.value;
      return map;
    } catch {
      return Object.fromEntries(keys.map(k => [k, null]));
    }
  },
  ['getSettings'],
  { tags: ['settings'], revalidate: 3600 }
);

/** Set a setting (upsert). */
export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
  // You might want to call revalidateTag('settings') from the API endpoint that uses this.
}


/** Get value for use in server code: DB setting wins over env. Masked values (••••) are treated as unset so env is used. */
export async function getConfigValue(key: string, envKey?: string): Promise<string | null> {
  const fromDb = await getSetting(key);
  const dbTrimmed = fromDb != null ? fromDb.trim() : "";
  const looksMasked = dbTrimmed !== "" && dbTrimmed.includes("••••");
  if (dbTrimmed !== "" && !looksMasked) return dbTrimmed;
  if (envKey && process.env[envKey]) return process.env[envKey] ?? null;
  return null;
}

/** Decrypt and return Google credentials JSON (service account or OAuth client). Server-only. Returns null if not set or decryption fails. */
export async function getGoogleCredentials(): Promise<Record<string, unknown> | null> {
  const { decrypt } = await import("@/lib/encryption");
  const raw = await getSetting(SETTING_KEYS.GOOGLE_CREDENTIALS);
  if (!raw?.trim()) return null;
  try {
    const plain = decrypt(raw);
    const parsed = JSON.parse(plain) as Record<string, unknown>;
    return parsed;
  } catch {
    return null;
  }
}
