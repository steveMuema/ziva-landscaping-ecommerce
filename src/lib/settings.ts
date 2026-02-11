import prisma from "@/lib/prisma";
import { SETTING_KEYS } from "@/lib/setting-keys";

export { SETTING_KEYS };

function getSettingModel() {
  const model = (prisma as { setting?: typeof prisma.category })["setting"];
  if (!model) {
    throw new Error(
      "Prisma client missing 'setting' model. Run: npx prisma generate"
    );
  }
  return model;
}

/** Get a single setting value from DB. Returns null if not set. */
export async function getSetting(key: string): Promise<string | null> {
  const row = await getSettingModel().findUnique({
    where: { key },
  });
  return row?.value ?? null;
}

/** Get multiple settings. Returns record of key -> value (null if not set). */
export async function getSettings(keys: string[]): Promise<Record<string, string | null>> {
  if (keys.length === 0) return {};
  const rows = await getSettingModel().findMany({
    where: { key: { in: keys } },
  });
  const map: Record<string, string | null> = {};
  for (const k of keys) map[k] = null;
  for (const r of rows) map[r.key] = r.value;
  return map;
}

/** Set a setting (upsert). */
export async function setSetting(key: string, value: string): Promise<void> {
  await getSettingModel().upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

/** Get value for use in server code: DB setting wins over env. */
export async function getConfigValue(key: string, envKey?: string): Promise<string | null> {
  const fromDb = await getSetting(key);
  if (fromDb != null && fromDb.trim() !== "") return fromDb.trim();
  if (envKey && process.env[envKey]) return process.env[envKey] ?? null;
  return null;
}
