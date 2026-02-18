"use client";

import { useState, useEffect } from "react";
import { SETTING_KEYS } from "@/lib/setting-keys";

type MaskedSettings = Record<string, string>;

const LABELS: Record<string, string> = {
  [SETTING_KEYS.MPESA_CONSUMER_KEY]: "M-Pesa Consumer Key",
  [SETTING_KEYS.MPESA_CONSUMER_SECRET]: "M-Pesa Consumer Secret",
  [SETTING_KEYS.MPESA_SHORTCODE]: "M-Pesa Shortcode (Till / Paybill)",
  [SETTING_KEYS.MPESA_PASSKEY]: "M-Pesa Passkey",
  [SETTING_KEYS.MPESA_ENV]: "M-Pesa Environment",
  [SETTING_KEYS.CLOUDINARY_CLOUD_NAME]: "Cloudinary Cloud name",
  [SETTING_KEYS.CLOUDINARY_API_KEY]: "Cloudinary API key",
  [SETTING_KEYS.CLOUDINARY_API_SECRET]: "Cloudinary API secret",
  [SETTING_KEYS.SITE_COMPANY_NAME]: "Company name",
  [SETTING_KEYS.SITE_TAGLINE]: "Tagline",
  [SETTING_KEYS.SITE_EMAIL]: "Contact email",
  [SETTING_KEYS.SITE_PHONE_WHATSAPP]: "Phone / WhatsApp (e.g. +254712345678)",
  [SETTING_KEYS.SITE_STORES_JSON]: "Stores (one address per line)",
  [SETTING_KEYS.SITE_LOGO_URL]: "Logo image URL",
  [SETTING_KEYS.SITE_PARALLAX_IMAGE_URL]: "Parallax / hero image URL",
  [SETTING_KEYS.SOCIAL_FACEBOOK]: "Facebook (URL or username)",
  [SETTING_KEYS.SOCIAL_INSTAGRAM]: "Instagram (URL or username)",
  [SETTING_KEYS.SOCIAL_TWITTER]: "Twitter / X (URL or username)",
  [SETTING_KEYS.SOCIAL_PINTEREST]: "Pinterest (URL or username)",
  [SETTING_KEYS.SOCIAL_YOUTUBE]: "YouTube (URL or username)",
  [SETTING_KEYS.SOCIAL_LINKEDIN]: "LinkedIn (URL or username)",
};

export default function SettingsForm() {
  const [settings, setSettings] = useState<MaskedSettings | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [credentialsUploaded, setCredentialsUploaded] = useState<boolean | null>(null);
  const [credentialsPreview, setCredentialsPreview] = useState<string | null>(null);
  const [credentialsUploading, setCredentialsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [, setProfile] = useState<{ name: string; email: string } | null>(null);
  const [profileForm, setProfileForm] = useState({ name: "", email: "", currentPassword: "", newPassword: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"api" | "site" | "profile">("site");
  const [logoUploading, setLogoUploading] = useState(false);
  const [parallaxUploading, setParallaxUploading] = useState(false);

  const fetchCredentialsStatus = () => {
    fetch("/api/admin/settings/google-credentials")
      .then((r) => r.json())
      .then((data) => {
        setCredentialsUploaded(!!data.uploaded);
        setCredentialsPreview(data.preview?.trim() ?? null);
      })
      .catch(() => {
        setCredentialsUploaded(false);
        setCredentialsPreview(null);
      });
  };

  useEffect(() => {
    fetchCredentialsStatus();
  }, []);

  useEffect(() => {
    fetch("/api/admin/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.name !== undefined || data.email !== undefined) {
          setProfile({ name: data.name ?? "", email: data.email ?? "" });
          setProfileForm((p) => ({ ...p, name: data.name ?? "", email: data.email ?? "" }));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          setMessage({ type: "error", text: data.error || "Failed to load settings" });
          setSettings({});
          return;
        }
        if (data.settings) {
          setSettings(data.settings);
          const initial: Record<string, string> = {};
          for (const key of Object.values(SETTING_KEYS)) {
            initial[key] = data.settings[key] ?? (key === SETTING_KEYS.MPESA_ENV ? "sandbox" : "");
          }
          if (initial[SETTING_KEYS.SITE_STORES_JSON]) {
            try {
              const arr = JSON.parse(initial[SETTING_KEYS.SITE_STORES_JSON]);
              initial[SETTING_KEYS.SITE_STORES_JSON] = Array.isArray(arr) ? arr.join("\n") : initial[SETTING_KEYS.SITE_STORES_JSON];
            } catch {
              /* keep as-is */
            }
          }
          setForm(initial);
        }
      })
      .catch(() => {
        setMessage({ type: "error", text: "Failed to load settings" });
        setSettings({});
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    const body: Record<string, string> = {};
    const keysToAlwaysSend = [SETTING_KEYS.SITE_LOGO_URL, SETTING_KEYS.SITE_PARALLAX_IMAGE_URL];
    for (const [key, value] of Object.entries(form)) {
      const isEmpty = value.trim() === "";
      if (isEmpty && !keysToAlwaysSend.includes(key)) continue;
      if (key === SETTING_KEYS.SITE_STORES_JSON) {
        const lines = value.trim().split("\n").map((s) => s.trim()).filter(Boolean);
        body[key] = JSON.stringify(lines);
      } else {
        body[key] = value.trim();
      }
    }
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save");
      }
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
      setForm(() => {
        const next: Record<string, string> = {};
        for (const key of Object.values(SETTING_KEYS)) {
          next[key] = data.settings?.[key] ?? (key === SETTING_KEYS.MPESA_ENV ? "sandbox" : "");
        }
        if (next[SETTING_KEYS.SITE_STORES_JSON]) {
          try {
            const arr = JSON.parse(next[SETTING_KEYS.SITE_STORES_JSON]);
            next[SETTING_KEYS.SITE_STORES_JSON] = Array.isArray(arr) ? arr.join("\n") : next[SETTING_KEYS.SITE_STORES_JSON];
          } catch {
            /* keep */
          }
        }
        return next;
      });
      setMessage({ type: "success", text: "Settings saved." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (settings === null) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Loading settings…
      </div>
    );
  }

  const isSecret = (key: string) =>
    key.includes("SECRET") || key.includes("PASSKEY") || key.includes("KEY");

  const tabs = [
    { id: "site" as const, label: "Site & social", icon: "🌐" },
    { id: "api" as const, label: "API & payments", icon: "🔑" },
    { id: "profile" as const, label: "Admin profile", icon: "👤" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div
          className={`rounded-lg border p-4 ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="rounded-t-xl border border-slate-200 border-b-0 bg-slate-50/80 px-2 pt-2">
        <nav className="flex gap-0.5" aria-label="Settings sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-t-lg border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-emerald-600 bg-white text-emerald-700 shadow-sm"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:bg-white/60 hover:text-slate-700"
              }`}
            >
              <span aria-hidden className="text-base leading-none">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab panels */}
      <div className="rounded-b-xl border border-slate-200 border-t-0 bg-white px-0 shadow-sm">
      {activeTab === "api" && (
        <div className="space-y-6 p-5">
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Google</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Credentials file
            </label>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <input
                type="file"
                accept=".json,application/json"
                className="block w-full max-w-xs text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setMessage(null);
                  setCredentialsUploading(true);
                  try {
                    const content = await file.text();
                    const res = await fetch("/api/admin/settings/google-credentials", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ content }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      setMessage({ type: "error", text: data.error || "Upload failed" });
                      return;
                    }
                    setCredentialsUploaded(true);
                    setCredentialsPreview(data.preview?.trim() ?? null);
                    setMessage({ type: "success", text: "Credentials file uploaded and stored encrypted." });
                  } catch {
                    setMessage({ type: "error", text: "Upload failed." });
                  } finally {
                    setCredentialsUploading(false);
                    e.target.value = "";
                  }
                }}
                disabled={credentialsUploading}
              />
              {credentialsUploaded === true && (
                <>
                  <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                    Uploaded
                  </span>
                  {credentialsPreview && (
                    <span className="text-xs text-slate-500 max-w-md truncate" title={credentialsPreview}>
                      {credentialsPreview}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      setMessage(null);
                      setCredentialsUploading(true);
                      try {
                        const res = await fetch("/api/admin/settings/google-credentials", { method: "DELETE" });
                        if (!res.ok) {
                          const data = await res.json().catch(() => ({}));
                          setMessage({ type: "error", text: data.error || "Remove failed" });
                          return;
                        }
                        setCredentialsUploaded(false);
                        setCredentialsPreview(null);
                        setMessage({ type: "success", text: "Credentials file removed." });
                      } catch {
                        setMessage({ type: "error", text: "Remove failed." });
                      } finally {
                        setCredentialsUploading(false);
                      }
                    }}
                    disabled={credentialsUploading}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Cloudinary</h2>
          <p className="mt-1 text-sm text-slate-500">
            Used for image uploads (logo, parallax image, etc.). Values from environment variables are used if not set here.
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label htmlFor={SETTING_KEYS.CLOUDINARY_CLOUD_NAME} className="block text-sm font-medium text-slate-700">
              {LABELS[SETTING_KEYS.CLOUDINARY_CLOUD_NAME]}
            </label>
            <input
              id={SETTING_KEYS.CLOUDINARY_CLOUD_NAME}
              type="text"
              autoComplete="off"
              placeholder={settings[SETTING_KEYS.CLOUDINARY_CLOUD_NAME] ? "Set (leave blank to keep)" : "From env or set here"}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:text-sm"
              value={form[SETTING_KEYS.CLOUDINARY_CLOUD_NAME] ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, [SETTING_KEYS.CLOUDINARY_CLOUD_NAME]: e.target.value }))}
            />
          </div>
          {([SETTING_KEYS.CLOUDINARY_API_KEY, SETTING_KEYS.CLOUDINARY_API_SECRET] as const).map((key) => (
            <div key={key}>
              <label htmlFor={key} className="block text-sm font-medium text-slate-700">
                {LABELS[key]}
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  id={key}
                  type="password"
                  autoComplete="off"
                  placeholder={settings[key] ? "•••••••• (leave blank to keep)" : "Not set"}
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                  value={form[key] ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                />
                {settings[key] && (
                  <span className="shrink-0 rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                    Set
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">M-Pesa (STK Push)</h2>
          <p className="mt-1 text-sm text-slate-500">
            Consumer key, secret, shortcode, and passkey from Safaricom Daraja. Values from environment variables are used if not set here.
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label htmlFor={SETTING_KEYS.MPESA_ENV} className="block text-sm font-medium text-slate-700">
              {LABELS[SETTING_KEYS.MPESA_ENV]}
            </label>
            <select
              id={SETTING_KEYS.MPESA_ENV}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:text-sm"
              value={form[SETTING_KEYS.MPESA_ENV] ?? "sandbox"}
              onChange={(e) => setForm((p) => ({ ...p, [SETTING_KEYS.MPESA_ENV]: e.target.value }))}
            >
              <option value="sandbox">Sandbox</option>
              <option value="production">Production</option>
            </select>
          </div>
          {([SETTING_KEYS.MPESA_CONSUMER_KEY, SETTING_KEYS.MPESA_CONSUMER_SECRET, SETTING_KEYS.MPESA_SHORTCODE, SETTING_KEYS.MPESA_PASSKEY] as const).map((key) => (
            <div key={key}>
              <label htmlFor={key} className="block text-sm font-medium text-slate-700">
                {LABELS[key]}
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  id={key}
                  type={isSecret(key) ? "password" : "text"}
                  autoComplete="off"
                  placeholder={settings[key] ? "•••••••• (leave blank to keep)" : "Not set"}
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                  value={form[key] ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                />
                {settings[key] && (
                  <span className="shrink-0 rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                    Set
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
        </div>
      )}

      {activeTab === "site" && (
        <div className="space-y-6 p-5">
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Site & contact</h2>
          <p className="mt-1 text-sm text-slate-500">
            Company name, tagline, contact email, phone/WhatsApp, and store addresses. Shown in the footer.
          </p>
        </div>
        <div className="p-5 space-y-4">
          {[SETTING_KEYS.SITE_COMPANY_NAME, SETTING_KEYS.SITE_TAGLINE, SETTING_KEYS.SITE_EMAIL, SETTING_KEYS.SITE_PHONE_WHATSAPP].map((key) => (
            <div key={key}>
              <label htmlFor={key} className="block text-sm font-medium text-slate-700">{LABELS[key]}</label>
              <input
                id={key}
                type="text"
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                value={form[key] ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div>
            <label htmlFor={SETTING_KEYS.SITE_STORES_JSON} className="block text-sm font-medium text-slate-700">{LABELS[SETTING_KEYS.SITE_STORES_JSON]}</label>
            <textarea
              id={SETTING_KEYS.SITE_STORES_JSON}
              rows={4}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:text-sm"
              value={form[SETTING_KEYS.SITE_STORES_JSON] ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, [SETTING_KEYS.SITE_STORES_JSON]: e.target.value }))}
              placeholder="Kiambu Rd Ridgeways, Kiambu County, Kenya"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Logo & images</h2>
          <p className="mt-1 text-sm text-slate-500">
            Logo is shown in the navbar. Parallax/hero image is used on the Company page and optional hero sections. Upload stores the image on Cloudinary and saves the URL here; you can also paste any image URL.
          </p>
          <p className="mt-1 text-xs font-medium text-amber-700">
            These are only saved when you click &quot;Save settings&quot; at the bottom of this page.
          </p>
        </div>
        <div className="p-5 space-y-6">
          <div>
            <label htmlFor={SETTING_KEYS.SITE_LOGO_URL} className="block text-sm font-medium text-slate-700">
              {LABELS[SETTING_KEYS.SITE_LOGO_URL]}
            </label>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <input
                id={SETTING_KEYS.SITE_LOGO_URL}
                type="url"
                placeholder="https://… or upload below"
                className="block flex-1 min-w-[200px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                value={form[SETTING_KEYS.SITE_LOGO_URL] ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, [SETTING_KEYS.SITE_LOGO_URL]: e.target.value }))}
              />
              <input
                type="file"
                accept="image/*"
                className="block text-sm text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
                disabled={logoUploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setMessage(null);
                  setLogoUploading(true);
                  try {
                    const fd = new FormData();
                    fd.set("file", file);
                    const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      setMessage({ type: "error", text: data.error || "Logo upload failed" });
                      return;
                    }
                    if (data.url) {
                      setForm((p) => ({ ...p, [SETTING_KEYS.SITE_LOGO_URL]: data.url }));
                      setMessage({ type: "success", text: "Logo uploaded. Save settings to keep it." });
                    }
                  } catch {
                    setMessage({ type: "error", text: "Logo upload failed." });
                  } finally {
                    setLogoUploading(false);
                    e.target.value = "";
                  }
                }}
              />
              {logoUploading && <span className="text-sm text-slate-500">Uploading…</span>}
            </div>
            {form[SETTING_KEYS.SITE_LOGO_URL] && (
              <p className="mt-1 text-xs text-slate-500">
                Current: <span className="truncate inline-block max-w-md align-bottom" title={form[SETTING_KEYS.SITE_LOGO_URL]}>{form[SETTING_KEYS.SITE_LOGO_URL]}</span>
              </p>
            )}
          </div>
          <div>
            <label htmlFor={SETTING_KEYS.SITE_PARALLAX_IMAGE_URL} className="block text-sm font-medium text-slate-700">
              {LABELS[SETTING_KEYS.SITE_PARALLAX_IMAGE_URL]}
            </label>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <input
                id={SETTING_KEYS.SITE_PARALLAX_IMAGE_URL}
                type="url"
                placeholder="https://… or upload below"
                className="block flex-1 min-w-[200px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                value={form[SETTING_KEYS.SITE_PARALLAX_IMAGE_URL] ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, [SETTING_KEYS.SITE_PARALLAX_IMAGE_URL]: e.target.value }))}
              />
              <input
                type="file"
                accept="image/*"
                className="block text-sm text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
                disabled={parallaxUploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setMessage(null);
                  setParallaxUploading(true);
                  try {
                    const fd = new FormData();
                    fd.set("file", file);
                    const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      setMessage({ type: "error", text: data.error || "Parallax image upload failed" });
                      return;
                    }
                    if (data.url) {
                      setForm((p) => ({ ...p, [SETTING_KEYS.SITE_PARALLAX_IMAGE_URL]: data.url }));
                      setMessage({ type: "success", text: "Image uploaded. Save settings to keep it." });
                    }
                  } catch {
                    setMessage({ type: "error", text: "Parallax image upload failed." });
                  } finally {
                    setParallaxUploading(false);
                    e.target.value = "";
                  }
                }}
              />
              {parallaxUploading && <span className="text-sm text-slate-500">Uploading…</span>}
            </div>
            {form[SETTING_KEYS.SITE_PARALLAX_IMAGE_URL] && (
              <p className="mt-1 text-xs text-slate-500">
                Current: <span className="truncate inline-block max-w-md align-bottom" title={form[SETTING_KEYS.SITE_PARALLAX_IMAGE_URL]}>{form[SETTING_KEYS.SITE_PARALLAX_IMAGE_URL]}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Social links</h2>
          <p className="mt-1 text-sm text-slate-500">
            Full URL (e.g. https://facebook.com/yourpage) or username. Leave blank to hide.
          </p>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            SETTING_KEYS.SOCIAL_FACEBOOK,
            SETTING_KEYS.SOCIAL_INSTAGRAM,
            SETTING_KEYS.SOCIAL_TWITTER,
            SETTING_KEYS.SOCIAL_PINTEREST,
            SETTING_KEYS.SOCIAL_YOUTUBE,
            SETTING_KEYS.SOCIAL_LINKEDIN,
          ].map((key) => (
            <div key={key}>
              <label htmlFor={key} className="block text-sm font-medium text-slate-700">{LABELS[key]}</label>
              <input
                id={key}
                type="text"
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                value={form[key] ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </div>
        </div>
      )}

      {activeTab === "profile" && (
        <div className="space-y-6 p-5">
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Admin profile</h2>
          <p className="mt-1 text-sm text-slate-500">
            Your display name and email. Change password optionally.
          </p>
        </div>
        <div className="p-5 space-y-4">
          {profileMessage && (
            <div
              className={`rounded-lg border p-4 ${
                profileMessage.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {profileMessage.text}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="admin-name" className="block text-sm font-medium text-slate-700">Name</label>
              <input
                id="admin-name"
                type="text"
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                value={profileForm.name}
                onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-slate-700">Email (login)</label>
              <input
                id="admin-email"
                type="email"
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                value={profileForm.email}
                onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
          </div>
          <div className="border-t border-slate-100 pt-4 space-y-4">
            <p className="text-sm text-slate-600">Change password (leave blank to keep current)</p>
            <div>
              <label htmlFor="admin-current-pw" className="block text-sm font-medium text-slate-700">Current password</label>
              <input
                id="admin-current-pw"
                type="password"
                autoComplete="current-password"
                className="mt-1 block w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                value={profileForm.currentPassword}
                onChange={(e) => setProfileForm((p) => ({ ...p, currentPassword: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="admin-new-pw" className="block text-sm font-medium text-slate-700">New password</label>
              <input
                id="admin-new-pw"
                type="password"
                autoComplete="new-password"
                className="mt-1 block w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                value={profileForm.newPassword}
                onChange={(e) => setProfileForm((p) => ({ ...p, newPassword: e.target.value }))}
              />
            </div>
          </div>
          <button
            type="button"
            disabled={profileSaving}
            onClick={async () => {
              setProfileMessage(null);
              setProfileSaving(true);
              try {
                const res = await fetch("/api/admin/profile", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: profileForm.name.trim() || undefined,
                    email: profileForm.email.trim() || undefined,
                    currentPassword: profileForm.currentPassword || undefined,
                    newPassword: profileForm.newPassword.trim() || undefined,
                  }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                  setProfileMessage({ type: "error", text: data.error || "Failed to update profile" });
                  return;
                }
                setProfileMessage({ type: "success", text: "Profile updated." });
                setProfileForm((p) => ({ ...p, currentPassword: "", newPassword: "" }));
              } catch {
                setProfileMessage({ type: "error", text: "Failed to update profile." });
              } finally {
                setProfileSaving(false);
              }
            }}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {profileSaving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </div>
        </div>
      )}
      </div>

      <div className="flex justify-end border-t border-slate-200 pt-4 mt-6">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
