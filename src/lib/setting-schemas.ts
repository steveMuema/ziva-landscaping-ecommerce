import { z } from "zod";
import { SETTING_KEYS, type SettingKey } from "@/lib/setting-keys";

const SOCIAL_KEYS = [
  SETTING_KEYS.SOCIAL_FACEBOOK,
  SETTING_KEYS.SOCIAL_INSTAGRAM,
  SETTING_KEYS.SOCIAL_TWITTER,
  SETTING_KEYS.SOCIAL_PINTEREST,
  SETTING_KEYS.SOCIAL_YOUTUBE,
  SETTING_KEYS.SOCIAL_LINKEDIN,
  SETTING_KEYS.SOCIAL_TELEGRAM,
  SETTING_KEYS.SOCIAL_TIKTOK,
] as const;

const empty = z.literal("");
const httpUrl = z
  .string()
  .max(2000)
  .refine((v) => /^https?:\/\//i.test(v) && z.string().url().safeParse(v).success, "Enter a full URL starting with https://");
/** A full URL or a site-relative path like /logo.png. */
const imageUrl = z.union([empty, httpUrl, z.string().regex(/^\/[^\s]*$/, "Enter a URL or a path starting with /")]);
const singleLine = (max: number) =>
  z.string().max(max, `Keep it under ${max} characters`).refine((v) => !/[\r\n]/.test(v), "Must be a single line");
const credential = singleLine(4000);

const social = z.union([
  empty,
  httpUrl,
  z.string().regex(/^@?[A-Za-z0-9._-]{1,100}$/, "Enter a full URL or a username (letters, numbers, . _ -)"),
]);

const stores = z
  .string()
  .transform((v, ctx) => {
    if (v.trim() === "") return "";
    try {
      const parsed = JSON.parse(v);
      const result = z.array(z.string().trim().min(1).max(200)).max(20, "List at most 20 stores").safeParse(parsed);
      if (result.success) return JSON.stringify(result.data);
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.error.issues[0]?.message ?? "Invalid store list" });
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid store list" });
    }
    return z.NEVER;
  });

/** Validation per setting. Values arrive trimmed; "" means clear (or keep, for secrets). */
export const SETTING_SCHEMAS: Record<SettingKey, z.ZodType<string, z.ZodTypeDef, string>> = {
  ...(Object.fromEntries(SOCIAL_KEYS.map((k) => [k, social])) as Record<(typeof SOCIAL_KEYS)[number], typeof social>),
  [SETTING_KEYS.GOOGLE_CREDENTIALS]: z.string(), // has its own upload endpoint
  [SETTING_KEYS.MPESA_CONSUMER_KEY]: credential,
  [SETTING_KEYS.MPESA_CONSUMER_SECRET]: credential,
  [SETTING_KEYS.MPESA_SHORTCODE]: z.union([empty, z.string().regex(/^\d{5,10}$/, "Shortcode is 5–10 digits")]),
  [SETTING_KEYS.MPESA_PASSKEY]: credential,
  [SETTING_KEYS.MPESA_ENV]: z.enum(["sandbox", "production"], { message: "Choose sandbox or production" }),
  [SETTING_KEYS.CLOUDINARY_CLOUD_NAME]: z.union([empty, z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, "Letters, numbers, _ and - only")]),
  [SETTING_KEYS.CLOUDINARY_API_KEY]: credential,
  [SETTING_KEYS.CLOUDINARY_API_SECRET]: credential,
  [SETTING_KEYS.GEMINI_API_KEY]: credential,
  [SETTING_KEYS.ZOHO_BOOKS_CLIENT_ID]: credential,
  [SETTING_KEYS.ZOHO_BOOKS_CLIENT_SECRET]: credential,
  [SETTING_KEYS.ZOHO_BOOKS_REFRESH_TOKEN]: credential,
  [SETTING_KEYS.ZOHO_BOOKS_ORGANIZATION_ID]: z.union([empty, z.string().regex(/^\d{1,30}$/, "Organization ID is numeric")]),
  [SETTING_KEYS.SITE_COMPANY_NAME]: singleLine(120),
  [SETTING_KEYS.SITE_TAGLINE]: singleLine(200),
  [SETTING_KEYS.SITE_EMAIL]: z.union([empty, z.string().email("Enter a valid email address").max(200)]),
  [SETTING_KEYS.SITE_PHONE_WHATSAPP]: z.union([
    empty,
    z.string().regex(/^\+?[0-9][0-9 ()-]{6,19}$/, "Enter a phone number like +254712345678"),
  ]),
  [SETTING_KEYS.SITE_STORES_JSON]: stores,
  [SETTING_KEYS.DELIVERY_FEE_KSH]: z.union([
    empty,
    z.string().refine((v) => /^\d+(\.\d{1,2})?$/.test(v) && Number(v) <= 100000, "Enter an amount between 0 and 100,000"),
  ]),
  [SETTING_KEYS.SITE_LOGO_URL]: imageUrl,
  [SETTING_KEYS.SITE_PARALLAX_IMAGE_URL]: imageUrl,
};

/**
 * Validate a batch of settings. Returns cleaned values, or per-key error messages.
 * Nothing should be saved when there are errors.
 */
export function validateSettings(
  input: Record<string, string>
): { values: Record<string, string>; errors?: undefined } | { values?: undefined; errors: Record<string, string> } {
  const values: Record<string, string> = {};
  const errors: Record<string, string> = {};
  for (const [key, raw] of Object.entries(input)) {
    const schema = SETTING_SCHEMAS[key as SettingKey];
    if (!schema) continue;
    const result = schema.safeParse(raw.trim());
    if (result.success) values[key] = result.data;
    else errors[key] = result.error.issues[0]?.message ?? "Invalid value";
  }
  return Object.keys(errors).length > 0 ? { errors } : { values };
}
