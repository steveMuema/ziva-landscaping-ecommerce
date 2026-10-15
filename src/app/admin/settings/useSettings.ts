"use client";

import { useCallback, useEffect, useState } from "react";
import { MASKED_SETTING_KEYS, SETTING_KEYS } from "@/lib/setting-keys";

export type Message = { type: "success" | "error"; text: string } | null;

const MASKED = new Set<string>(MASKED_SETTING_KEYS);
const DEFAULTS: Record<string, string> = {
  [SETTING_KEYS.MPESA_ENV]: "sandbox",
  [SETTING_KEYS.DELIVERY_FEE_KSH]: "400",
};

/** Server values → editable form values (masked fields start empty; stores become one per line). */
function toForm(settings: Record<string, string>): Record<string, string> {
  const form: Record<string, string> = {};
  for (const key of Object.values(SETTING_KEYS)) {
    form[key] = MASKED.has(key) ? "" : settings[key] || DEFAULTS[key] || "";
  }
  const stores = form[SETTING_KEYS.SITE_STORES_JSON];
  if (stores) {
    try {
      const arr = JSON.parse(stores);
      if (Array.isArray(arr)) form[SETTING_KEYS.SITE_STORES_JSON] = arr.join("\n");
    } catch {
      /* keep as-is */
    }
  }
  return form;
}

/** Load, edit and save admin settings. Each tab saves only its own keys. */
export function useSettings() {
  const [settings, setSettings] = useState<Record<string, string> | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<Message>(null);
  const [saving, setSaving] = useState(false);
  const [encryptionUnavailable, setEncryptionUnavailable] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          setMessage({ type: "error", text: data.error || "Failed to load settings" });
          setSettings({});
          return;
        }
        setSettings(data.settings ?? {});
        setForm(toForm(data.settings ?? {}));
        setEncryptionUnavailable(Boolean(data.encryptionUnavailable));
      })
      .catch(() => {
        setMessage({ type: "error", text: "Failed to load settings" });
        setSettings({});
      });
  }, []);

  const setField = useCallback((key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const save = useCallback(
    async (keys: readonly string[]) => {
      setMessage(null);
      setSaving(true);
      const body: Record<string, string> = {};
      for (const key of keys) {
        const value = (form[key] ?? "").trim();
        if (MASKED.has(key) && value === "") continue; // blank = keep the stored value
        if (key === SETTING_KEYS.SITE_STORES_JSON) {
          const lines = value.split("\n").map((s) => s.trim()).filter(Boolean);
          body[key] = lines.length ? JSON.stringify(lines) : "";
        } else {
          body[key] = value;
        }
      }
      try {
        const res = await fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setFieldErrors(data.fieldErrors ?? {});
          throw new Error(data.error || "Failed to save");
        }
        setFieldErrors({});
        setSettings(data.settings);
        setForm((prev) => ({ ...prev, ...pick(toForm(data.settings), keys) }));
        setMessage({ type: "success", text: "Settings saved." });
      } catch (err) {
        setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save settings." });
      } finally {
        setSaving(false);
      }
    },
    [form]
  );

  return { settings, form, setField, fieldErrors, message, setMessage, saving, save, encryptionUnavailable };
}

function pick(obj: Record<string, string>, keys: readonly string[]) {
  return Object.fromEntries(keys.map((k) => [k, obj[k] ?? ""]));
}

export type SettingsApi = ReturnType<typeof useSettings>;
