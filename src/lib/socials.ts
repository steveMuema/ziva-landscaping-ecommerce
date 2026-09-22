import { SETTING_KEYS } from "@/lib/setting-keys";

const SOCIAL_BASES: Record<string, string> = {
  [SETTING_KEYS.SOCIAL_FACEBOOK]: "https://facebook.com/",
  [SETTING_KEYS.SOCIAL_INSTAGRAM]: "https://instagram.com/",
  [SETTING_KEYS.SOCIAL_TWITTER]: "https://x.com/",
  [SETTING_KEYS.SOCIAL_PINTEREST]: "https://pinterest.com/",
  [SETTING_KEYS.SOCIAL_YOUTUBE]: "https://youtube.com/",
  [SETTING_KEYS.SOCIAL_LINKEDIN]: "https://linkedin.com/",
  [SETTING_KEYS.SOCIAL_TELEGRAM]: "https://t.me/",
};

/** Resolves a stored social setting value (full URL or bare username) into a full profile URL. */
export function socialUrl(key: string, value: string): string {
  if (!value.trim()) return "";
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;
  return (SOCIAL_BASES[key] ?? "") + v.replace(/^\/*/, "");
}

/** Resolves a stored WhatsApp phone number into a wa.me chat link. */
export function whatsappUrl(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}
