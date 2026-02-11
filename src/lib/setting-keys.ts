/** Setting keys used for Google API and M-Pesa. Safe to import in client components. */
export const SETTING_KEYS = {
  GOOGLE_API_KEY: "GOOGLE_API_KEY",
  MPESA_CONSUMER_KEY: "MPESA_CONSUMER_KEY",
  MPESA_CONSUMER_SECRET: "MPESA_CONSUMER_SECRET",
  MPESA_SHORTCODE: "MPESA_SHORTCODE",
  MPESA_PASSKEY: "MPESA_PASSKEY",
  MPESA_ENV: "MPESA_ENV",
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];
