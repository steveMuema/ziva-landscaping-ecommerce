"use client";

import { SETTING_KEYS } from "@/lib/setting-keys";
import { Card, FieldError, LABELS, SaveBar, SecretField, inputClass } from "../fields";
import type { SettingsApi } from "../useSettings";

const KEYS = [
  SETTING_KEYS.MPESA_ENV,
  SETTING_KEYS.MPESA_CONSUMER_KEY,
  SETTING_KEYS.MPESA_CONSUMER_SECRET,
  SETTING_KEYS.MPESA_SHORTCODE,
  SETTING_KEYS.MPESA_PASSKEY,
] as const;

export function PaymentsTab({ api }: { api: SettingsApi }) {
  return (
    <div className="space-y-6">
      <Card
        title="M-Pesa (STK Push)"
        description="Consumer key, secret, shortcode and passkey from Safaricom Daraja. Environment variables are used for anything not set here."
      >
        <div>
          <label htmlFor={SETTING_KEYS.MPESA_ENV} className="block text-sm font-medium text-slate-700">
            {LABELS[SETTING_KEYS.MPESA_ENV]}
          </label>
          <select
            id={SETTING_KEYS.MPESA_ENV}
            className={inputClass}
            value={api.form[SETTING_KEYS.MPESA_ENV] || "sandbox"}
            onChange={(e) => api.setField(SETTING_KEYS.MPESA_ENV, e.target.value)}
          >
            <option value="sandbox">Sandbox</option>
            <option value="production">Production</option>
          </select>
          <FieldError api={api} k={SETTING_KEYS.MPESA_ENV} />
        </div>
        <SecretField api={api} k={SETTING_KEYS.MPESA_CONSUMER_KEY} />
        <SecretField api={api} k={SETTING_KEYS.MPESA_CONSUMER_SECRET} />
        <SecretField api={api} k={SETTING_KEYS.MPESA_SHORTCODE} type="text" />
        <SecretField api={api} k={SETTING_KEYS.MPESA_PASSKEY} />
      </Card>
      <SaveBar api={api} keys={KEYS} label="Save payment settings" />
    </div>
  );
}
