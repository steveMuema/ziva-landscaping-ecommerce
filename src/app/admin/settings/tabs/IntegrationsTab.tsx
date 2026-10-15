"use client";

import { useEffect, useState } from "react";
import { SETTING_KEYS } from "@/lib/setting-keys";
import { Card, SaveBar, SecretField, TextField } from "../fields";
import type { SettingsApi } from "../useSettings";

const KEYS = [
  SETTING_KEYS.GEMINI_API_KEY,
  SETTING_KEYS.ZOHO_BOOKS_CLIENT_ID,
  SETTING_KEYS.ZOHO_BOOKS_CLIENT_SECRET,
  SETTING_KEYS.ZOHO_BOOKS_REFRESH_TOKEN,
  SETTING_KEYS.ZOHO_BOOKS_ORGANIZATION_ID,
  SETTING_KEYS.CLOUDINARY_CLOUD_NAME,
  SETTING_KEYS.CLOUDINARY_API_KEY,
  SETTING_KEYS.CLOUDINARY_API_SECRET,
] as const;

function GoogleCredentials({ api }: { api: SettingsApi }) {
  const [uploaded, setUploaded] = useState<boolean | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings/google-credentials")
      .then((r) => r.json())
      .then((data) => {
        setUploaded(!!data.uploaded);
        setPreview(data.preview?.trim() ?? null);
      })
      .catch(() => {
        setUploaded(false);
        setPreview(null);
      });
  }, []);

  return (
    <Card title="Google" description="Service account credentials file, used for address autocomplete. Stored encrypted.">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="file"
          accept=".json,application/json"
          aria-label="Google credentials file"
          className="block w-full max-w-xs text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            api.setMessage(null);
            setBusy(true);
            try {
              const res = await fetch("/api/admin/settings/google-credentials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: await file.text() }),
              });
              const data = await res.json().catch(() => ({}));
              if (!res.ok) {
                api.setMessage({ type: "error", text: data.error || "Upload failed" });
                return;
              }
              setUploaded(true);
              setPreview(data.preview?.trim() ?? null);
              api.setMessage({ type: "success", text: "Credentials file uploaded and stored encrypted." });
            } catch {
              api.setMessage({ type: "error", text: "Upload failed." });
            } finally {
              setBusy(false);
              e.target.value = "";
            }
          }}
        />
        {uploaded && (
          <>
            <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">Uploaded</span>
            {preview && <span className="max-w-md truncate text-xs text-slate-500" title={preview}>{preview}</span>}
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                api.setMessage(null);
                setBusy(true);
                try {
                  const res = await fetch("/api/admin/settings/google-credentials", { method: "DELETE" });
                  if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    api.setMessage({ type: "error", text: data.error || "Remove failed" });
                    return;
                  }
                  setUploaded(false);
                  setPreview(null);
                  api.setMessage({ type: "success", text: "Credentials file removed." });
                } catch {
                  api.setMessage({ type: "error", text: "Remove failed." });
                } finally {
                  setBusy(false);
                }
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              Remove
            </button>
          </>
        )}
      </div>
    </Card>
  );
}

export function IntegrationsTab({ api }: { api: SettingsApi }) {
  return (
    <div className="space-y-6">
      <GoogleCredentials api={api} />

      <Card
        title="Gemini AI"
        description={
          <>
            Powers the Fiona chat assistant. Changes apply immediately.
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="ml-1 font-medium text-emerald-600 hover:text-emerald-700">
              Get an API key &rarr;
            </a>
          </>
        }
      >
        <SecretField api={api} k={SETTING_KEYS.GEMINI_API_KEY} />
      </Card>

      <Card title="Zoho Books" description="Syncs orders and creates invoices in your accounting system.">
        <SecretField api={api} k={SETTING_KEYS.ZOHO_BOOKS_CLIENT_ID} type="text" />
        <SecretField api={api} k={SETTING_KEYS.ZOHO_BOOKS_CLIENT_SECRET} />
        <SecretField api={api} k={SETTING_KEYS.ZOHO_BOOKS_REFRESH_TOKEN} />
        <TextField api={api} k={SETTING_KEYS.ZOHO_BOOKS_ORGANIZATION_ID} />
      </Card>

      <Card title="Cloudinary" description="Image uploads (products, blog, logo…). Environment variables are used for anything not set here.">
        <TextField api={api} k={SETTING_KEYS.CLOUDINARY_CLOUD_NAME} placeholder="From env or set here" />
        <SecretField api={api} k={SETTING_KEYS.CLOUDINARY_API_KEY} />
        <SecretField api={api} k={SETTING_KEYS.CLOUDINARY_API_SECRET} />
      </Card>

      <SaveBar api={api} keys={KEYS} label="Save integrations" />
    </div>
  );
}
