import prisma from "@/lib/prisma";
import { SETTING_KEYS, SECRET_SETTING_KEYS } from "@/lib/setting-keys";
import { encrypt, decrypt } from "@/lib/encryption";
import { unstable_cache, revalidateTag } from "next/cache";

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

const SECRET_KEYS = new Set<string>(SECRET_SETTING_KEYS);
/** Marks values written by encrypt(); older plaintext values have no prefix. */
const ENCRYPTED_PREFIX = "enc:v1:";

export function isSecretSetting(key: string): boolean {
  return SECRET_KEYS.has(key);
}

/** Set a setting (upsert). Secrets are encrypted. Invalidates the getSetting/getSettings cache immediately. */
export async function setSetting(key: string, value: string): Promise<void> {
  const stored = SECRET_KEYS.has(key) && value !== "" ? ENCRYPTED_PREFIX + encrypt(value) : value;
  await prisma.setting.upsert({
    where: { key },
    create: { key, value: stored },
    update: { value: stored },
  });
  revalidateTag('settings');
}

/** Turn a stored value into plaintext. Legacy plaintext secrets pass through unchanged. */
function reveal(key: string, stored: string | null): string | null {
  if (stored == null || !stored.startsWith(ENCRYPTED_PREFIX)) return stored;
  try {
    return decrypt(stored.slice(ENCRYPTED_PREFIX.length));
  } catch (error) {
    console.error(`Could not decrypt setting ${key} (was ENCRYPTION_KEY changed?):`, error);
    return null;
  }
}

/** Read one setting, decrypting it if it is a secret. Server-only. */
export async function readSetting(key: string): Promise<string | null> {
  return reveal(key, await getSetting(key));
}

/** Read several settings, decrypting secrets. Server-only. */
export async function readSettings(keys: string[]): Promise<Record<string, string | null>> {
  const raw = await getSettings(keys);
  return Object.fromEntries(keys.map((k) => [k, reveal(k, raw[k] ?? null)]));
}

/**
 * Encrypt secrets that were saved before encryption existed. Safe to call repeatedly.
 * Returns how many were converted, or `unavailable` when ENCRYPTION_KEY is not configured.
 */
export async function encryptLegacySecrets(): Promise<{ converted: number; unavailable?: boolean }> {
  const rows = await prisma.setting.findMany({ where: { key: { in: [...SECRET_KEYS] } } });
  const legacy = rows.filter((r) => r.value !== "" && !r.value.startsWith(ENCRYPTED_PREFIX));
  if (legacy.length === 0) return { converted: 0 };
  try {
    for (const row of legacy) {
      await prisma.setting.update({
        where: { key: row.key },
        data: { value: ENCRYPTED_PREFIX + encrypt(row.value) },
      });
    }
  } catch (error) {
    console.error("Could not encrypt stored secrets:", error);
    return { converted: 0, unavailable: true };
  }
  revalidateTag('settings');
  return { converted: legacy.length };
}


/** Get value for use in server code: DB setting wins over env. Masked values (••••) are treated as unset so env is used. */
export async function getConfigValue(key: string, envKey?: string): Promise<string | null> {
  const fromDb = await readSetting(key);
  const dbTrimmed = fromDb != null ? fromDb.trim() : "";
  const looksMasked = dbTrimmed !== "" && dbTrimmed.includes("••••");
  if (dbTrimmed !== "" && !looksMasked) return dbTrimmed;
  if (envKey && process.env[envKey]) return process.env[envKey] ?? null;
  return null;
}

/** Decrypt and return Google credentials JSON (service account or OAuth client). Server-only. Returns null if not set or decryption fails. */
export async function getGoogleCredentials(): Promise<Record<string, unknown> | null> {
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
