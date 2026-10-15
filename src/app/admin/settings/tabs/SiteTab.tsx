"use client";

import { SETTING_KEYS } from "@/lib/setting-keys";
import { Card, FieldError, ImageUrlField, LABELS, SaveBar, TextField, inputClass } from "../fields";
import type { SettingsApi } from "../useSettings";

const KEYS = [
  SETTING_KEYS.SITE_COMPANY_NAME,
  SETTING_KEYS.SITE_TAGLINE,
  SETTING_KEYS.SITE_EMAIL,
  SETTING_KEYS.SITE_PHONE_WHATSAPP,
  SETTING_KEYS.SITE_STORES_JSON,
  SETTING_KEYS.DELIVERY_FEE_KSH,
  SETTING_KEYS.SITE_LOGO_URL,
  SETTING_KEYS.SITE_PARALLAX_IMAGE_URL,
] as const;

export function SiteTab({ api }: { api: SettingsApi }) {
  return (
    <div className="space-y-6">
      <Card title="Site & contact" description="Company name, tagline, contact email, phone/WhatsApp and store addresses. Shown in the footer.">
        <TextField api={api} k={SETTING_KEYS.SITE_COMPANY_NAME} />
        <TextField api={api} k={SETTING_KEYS.SITE_TAGLINE} />
        <TextField api={api} k={SETTING_KEYS.SITE_EMAIL} type="email" />
        <TextField api={api} k={SETTING_KEYS.SITE_PHONE_WHATSAPP} type="tel" />
        <div>
          <label htmlFor={SETTING_KEYS.SITE_STORES_JSON} className="block text-sm font-medium text-slate-700">
            {LABELS[SETTING_KEYS.SITE_STORES_JSON]}
          </label>
          <textarea
            id={SETTING_KEYS.SITE_STORES_JSON}
            rows={4}
            className={inputClass}
            value={api.form[SETTING_KEYS.SITE_STORES_JSON] ?? ""}
            onChange={(e) => api.setField(SETTING_KEYS.SITE_STORES_JSON, e.target.value)}
            placeholder="Kiambu Rd Ridgeways, Kiambu County, Kenya"
          />
          <FieldError api={api} k={SETTING_KEYS.SITE_STORES_JSON} />
        </div>
        <div className="max-w-xs">
          <TextField
            api={api}
            k={SETTING_KEYS.DELIVERY_FEE_KSH}
            type="number"
            placeholder="400"
            hint="Shown at checkout and applied to each order. Default KSH 400."
          />
        </div>
      </Card>

      <Card
        title="Logo & images"
        description="The logo is shown in the navbar. The parallax/hero image is used behind the homepage, shop and company pages. Upload stores the image on Cloudinary; you can also paste any image URL."
      >
        <ImageUrlField api={api} k={SETTING_KEYS.SITE_LOGO_URL} />
        <ImageUrlField api={api} k={SETTING_KEYS.SITE_PARALLAX_IMAGE_URL} />
      </Card>

      <SaveBar api={api} keys={KEYS} label="Save site settings" />
    </div>
  );
}
