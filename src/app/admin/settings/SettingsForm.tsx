"use client";

import { useState, useEffect } from "react";
import { SETTING_KEYS } from "@/lib/setting-keys";

type MaskedSettings = Record<string, string>;

const LABELS: Record<string, string> = {
  [SETTING_KEYS.GOOGLE_API_KEY]: "Google API Key",
  [SETTING_KEYS.MPESA_CONSUMER_KEY]: "M-Pesa Consumer Key",
  [SETTING_KEYS.MPESA_CONSUMER_SECRET]: "M-Pesa Consumer Secret",
  [SETTING_KEYS.MPESA_SHORTCODE]: "M-Pesa Shortcode (Till / Paybill)",
  [SETTING_KEYS.MPESA_PASSKEY]: "M-Pesa Passkey",
  [SETTING_KEYS.MPESA_ENV]: "M-Pesa Environment",
};

export default function SettingsForm() {
  const [settings, setSettings] = useState<MaskedSettings | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
            initial[key] = key === SETTING_KEYS.MPESA_ENV ? (data.settings[key] || "sandbox") : "";
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
    for (const [key, value] of Object.entries(form)) {
      if (value.trim() !== "") body[key] = value.trim();
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
      setForm((prev) => {
        const next: Record<string, string> = {};
        for (const key of Object.values(SETTING_KEYS)) {
          next[key] = key === SETTING_KEYS.MPESA_ENV ? (data.settings?.[key] || "sandbox") : "";
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

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Google</h2>
          <p className="mt-1 text-sm text-slate-500">
            Used for Maps and other Google APIs (e.g. Maps embed on finance page).
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label htmlFor={SETTING_KEYS.GOOGLE_API_KEY} className="block text-sm font-medium text-slate-700">
              {LABELS[SETTING_KEYS.GOOGLE_API_KEY]}
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                id={SETTING_KEYS.GOOGLE_API_KEY}
                type="password"
                autoComplete="off"
                placeholder={settings[SETTING_KEYS.GOOGLE_API_KEY] ? "•••••••• (leave blank to keep)" : "Not set"}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                value={form[SETTING_KEYS.GOOGLE_API_KEY] ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, [SETTING_KEYS.GOOGLE_API_KEY]: e.target.value }))}
              />
              {settings[SETTING_KEYS.GOOGLE_API_KEY] && (
                <span className="shrink-0 rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                  Set
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
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
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:text-sm"
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
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:text-sm"
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

      <div className="flex justify-end">
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
