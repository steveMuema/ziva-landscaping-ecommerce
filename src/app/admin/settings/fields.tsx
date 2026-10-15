"use client";

import { useState } from "react";
import { SETTING_KEYS } from "@/lib/setting-keys";
import type { SettingsApi } from "./useSettings";
import { MediaPicker } from "@/components/admin/MediaPicker";

export const LABELS: Record<string, string> = {
  [SETTING_KEYS.MPESA_CONSUMER_KEY]: "M-Pesa Consumer Key",
  [SETTING_KEYS.MPESA_CONSUMER_SECRET]: "M-Pesa Consumer Secret",
  [SETTING_KEYS.MPESA_SHORTCODE]: "M-Pesa Shortcode (Till / Paybill)",
  [SETTING_KEYS.MPESA_PASSKEY]: "M-Pesa Passkey",
  [SETTING_KEYS.MPESA_ENV]: "M-Pesa Environment",
  [SETTING_KEYS.CLOUDINARY_CLOUD_NAME]: "Cloudinary Cloud name",
  [SETTING_KEYS.CLOUDINARY_API_KEY]: "Cloudinary API key",
  [SETTING_KEYS.CLOUDINARY_API_SECRET]: "Cloudinary API secret",
  [SETTING_KEYS.GEMINI_API_KEY]: "Gemini API Key",
  [SETTING_KEYS.ZOHO_BOOKS_CLIENT_ID]: "Zoho Client ID",
  [SETTING_KEYS.ZOHO_BOOKS_CLIENT_SECRET]: "Zoho Client Secret",
  [SETTING_KEYS.ZOHO_BOOKS_REFRESH_TOKEN]: "Zoho Refresh Token",
  [SETTING_KEYS.ZOHO_BOOKS_ORGANIZATION_ID]: "Zoho Organization ID",
  [SETTING_KEYS.SITE_COMPANY_NAME]: "Company name",
  [SETTING_KEYS.SITE_TAGLINE]: "Tagline",
  [SETTING_KEYS.SITE_EMAIL]: "Contact email",
  [SETTING_KEYS.SITE_PHONE_WHATSAPP]: "Phone / WhatsApp (e.g. +254712345678)",
  [SETTING_KEYS.SITE_STORES_JSON]: "Stores (one address per line)",
  [SETTING_KEYS.DELIVERY_FEE_KSH]: "Delivery fee (KSH)",
  [SETTING_KEYS.SITE_LOGO_URL]: "Logo image URL",
  [SETTING_KEYS.SITE_PARALLAX_IMAGE_URL]: "Parallax / hero image URL",
  [SETTING_KEYS.SOCIAL_FACEBOOK]: "Facebook (URL or username)",
  [SETTING_KEYS.SOCIAL_INSTAGRAM]: "Instagram (URL or username)",
  [SETTING_KEYS.SOCIAL_TWITTER]: "Twitter / X (URL or username)",
  [SETTING_KEYS.SOCIAL_PINTEREST]: "Pinterest (URL or username)",
  [SETTING_KEYS.SOCIAL_YOUTUBE]: "YouTube (URL or username)",
  [SETTING_KEYS.SOCIAL_LINKEDIN]: "LinkedIn (URL or username)",
  [SETTING_KEYS.SOCIAL_TELEGRAM]: "Telegram (URL or username)",
  [SETTING_KEYS.SOCIAL_TIKTOK]: "TikTok (URL or username)",
};

export const inputClass =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:text-sm";

export function Card({ title, description, children }: { title: string; description?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {description && <div className="mt-1 text-sm text-slate-500">{description}</div>}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

export function FieldError({ api, k }: { api: SettingsApi; k: string }) {
  const error = api.fieldErrors[k];
  return error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null;
}

export function TextField({ api, k, type = "text", hint, placeholder }: { api: SettingsApi; k: string; type?: string; hint?: string; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={k} className="block text-sm font-medium text-slate-700">{LABELS[k]}</label>
      <input
        id={k}
        type={type}
        placeholder={placeholder}
        aria-invalid={Boolean(api.fieldErrors[k])}
        className={`${inputClass} ${api.fieldErrors[k] ? "border-red-400" : ""}`}
        value={api.form[k] ?? ""}
        onChange={(e) => api.setField(k, e.target.value)}
      />
      <FieldError api={api} k={k} />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

/** A credential field: never shows the stored value; blank keeps it. */
export function SecretField({ api, k, type = "password" }: { api: SettingsApi; k: string; type?: string }) {
  const isSet = Boolean(api.settings?.[k]);
  return (
    <div>
      <label htmlFor={k} className="block text-sm font-medium text-slate-700">{LABELS[k]}</label>
      <div className="mt-1 flex items-center gap-2">
        <input
          id={k}
          type={type}
          autoComplete="off"
          placeholder={isSet ? `${api.settings?.[k]} (leave blank to keep)` : "Not set"}
          aria-invalid={Boolean(api.fieldErrors[k])}
          className={`${inputClass} mt-0 ${api.fieldErrors[k] ? "border-red-400" : ""}`}
          value={api.form[k] ?? ""}
          onChange={(e) => api.setField(k, e.target.value)}
        />
        {isSet && <span className="shrink-0 rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">Set</span>}
      </div>
      <FieldError api={api} k={k} />
    </div>
  );
}

/** URL field with an upload button that stores the file on Cloudinary and fills in the URL. */
export function ImageUrlField({ api, k }: { api: SettingsApi; k: string }) {
  const [uploading, setUploading] = useState(false);
  return (
    <div>
      <label htmlFor={k} className="block text-sm font-medium text-slate-700">{LABELS[k]}</label>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <input
          id={k}
          type="text"
          placeholder="https://… or upload"
          aria-invalid={Boolean(api.fieldErrors[k])}
          className={`${inputClass} mt-0 flex-1 min-w-[200px] ${api.fieldErrors[k] ? "border-red-400" : ""}`}
          value={api.form[k] ?? ""}
          onChange={(e) => api.setField(k, e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          aria-label={`Upload ${LABELS[k]}`}
          className="block text-sm text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
          disabled={uploading}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            api.setMessage(null);
            setUploading(true);
            try {
              const fd = new FormData();
              fd.set("file", file);
              const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
              const data = await res.json().catch(() => ({}));
              if (!res.ok) {
                api.setMessage({ type: "error", text: data.error || "Upload failed" });
                return;
              }
              if (data.url) {
                api.setField(k, data.url);
                api.setMessage({ type: "success", text: "Image uploaded. Save to keep it." });
              }
            } catch {
              api.setMessage({ type: "error", text: "Upload failed." });
            } finally {
              setUploading(false);
              e.target.value = "";
            }
          }}
        />
        <MediaPicker onSelect={(url) => api.setField(k, url)} />
        {uploading && <span className="text-sm text-slate-500">Uploading…</span>}
      </div>
      <FieldError api={api} k={k} />
    </div>
  );
}

export function SaveBar({ api, keys, label = "Save" }: { api: SettingsApi; keys: readonly string[]; label?: string }) {
  return (
    <div className="flex justify-end border-t border-slate-200 pt-4">
      <button
        type="button"
        disabled={api.saving}
        onClick={() => api.save(keys)}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
      >
        {api.saving ? "Saving…" : label}
      </button>
    </div>
  );
}
