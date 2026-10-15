"use client";

import { useEffect, useState } from "react";
import { inputClass } from "../fields";

type Message = { type: "success" | "error"; text: string } | null;

/** Name, login email and password for the signed-in staff member. Also used on /admin/account. */
export function ProfileTab() {
  const [form, setForm] = useState({ name: "", email: "", currentPassword: "", newPassword: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  useEffect(() => {
    fetch("/api/admin/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.name !== undefined || data.email !== undefined) {
          setForm((p) => ({ ...p, name: data.name ?? "", email: data.email ?? "" }));
        }
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim() || undefined,
          email: form.email.trim() || undefined,
          currentPassword: form.currentPassword || undefined,
          newPassword: form.newPassword.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to update profile" });
        return;
      }
      setMessage({ type: "success", text: "Profile updated." });
      setForm((p) => ({ ...p, currentPassword: "", newPassword: "" }));
    } catch {
      setMessage({ type: "error", text: "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-slate-900">Profile</h2>
        <p className="mt-1 text-sm text-slate-500">Your display name and login email. Change your password optionally.</p>
      </div>
      <div className="p-5 space-y-4">
        {message && (
          <div className={`rounded-lg border p-4 ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
            {message.text}
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="admin-name" className="block text-sm font-medium text-slate-700">Name</label>
            <input id="admin-name" type="text" className={inputClass} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label htmlFor="admin-email" className="block text-sm font-medium text-slate-700">Email (login)</label>
            <input id="admin-email" type="email" className={inputClass} value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          </div>
        </div>
        <div className="space-y-4 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-600">Change password (leave blank to keep current)</p>
          <div>
            <label htmlFor="admin-current-pw" className="block text-sm font-medium text-slate-700">Current password</label>
            <input id="admin-current-pw" type="password" autoComplete="current-password" className={`${inputClass} max-w-xs`} value={form.currentPassword} onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))} />
          </div>
          <div>
            <label htmlFor="admin-new-pw" className="block text-sm font-medium text-slate-700">New password</label>
            <input id="admin-new-pw" type="password" autoComplete="new-password" className={`${inputClass} max-w-xs`} value={form.newPassword} onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))} />
          </div>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </div>
    </div>
  );
}
