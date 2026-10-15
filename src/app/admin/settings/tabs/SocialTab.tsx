"use client";

import { SETTING_KEYS } from "@/lib/setting-keys";
import { Card, SaveBar, TextField } from "../fields";
import type { SettingsApi } from "../useSettings";

const KEYS = [
  SETTING_KEYS.SOCIAL_FACEBOOK,
  SETTING_KEYS.SOCIAL_INSTAGRAM,
  SETTING_KEYS.SOCIAL_TWITTER,
  SETTING_KEYS.SOCIAL_PINTEREST,
  SETTING_KEYS.SOCIAL_YOUTUBE,
  SETTING_KEYS.SOCIAL_LINKEDIN,
  SETTING_KEYS.SOCIAL_TELEGRAM,
  SETTING_KEYS.SOCIAL_TIKTOK,
] as const;

export function SocialTab({ api }: { api: SettingsApi }) {
  return (
    <div className="space-y-6">
      <Card title="Social links" description="Full URL (e.g. https://facebook.com/yourpage) or username. Leave blank to link to the platform's homepage.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {KEYS.map((k) => (
            <TextField key={k} api={api} k={k} />
          ))}
        </div>
      </Card>
      <SaveBar api={api} keys={KEYS} label="Save social links" />
    </div>
  );
}
