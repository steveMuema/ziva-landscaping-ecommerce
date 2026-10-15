"use client";

import { useState } from "react";
import { useSettings } from "./useSettings";
import { SiteTab } from "./tabs/SiteTab";
import { SocialTab } from "./tabs/SocialTab";
import { PaymentsTab } from "./tabs/PaymentsTab";
import { IntegrationsTab } from "./tabs/IntegrationsTab";
import { ProfileTab } from "./tabs/ProfileTab";

const TABS = [
  { id: "site", label: "Site" },
  { id: "social", label: "Social" },
  { id: "payments", label: "Payments" },
  { id: "integrations", label: "Integrations" },
  { id: "profile", label: "Profile" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsForm() {
  const api = useSettings();
  const [activeTab, setActiveTab] = useState<TabId>("site");

  if (api.settings === null) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Loading settings…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {api.encryptionUnavailable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          ENCRYPTION_KEY is not configured, so API keys and secrets can&apos;t be stored encrypted.
          Set ENCRYPTION_KEY (64 hex characters: <code>openssl rand -hex 32</code>) in your environment.
        </div>
      )}
      {api.message && (
        <div
          role={api.message.type === "error" ? "alert" : "status"}
          className={`rounded-lg border p-4 ${api.message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}
        >
          {api.message.text}
        </div>
      )}

      <div>
        <div className="rounded-t-xl border border-b-0 border-slate-200 bg-slate-50/80 px-2 pt-2">
          <nav className="flex gap-0.5 overflow-x-auto" role="tablist" aria-label="Settings sections">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  api.setMessage(null);
                }}
                className={`whitespace-nowrap rounded-t-lg border-b-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                  ? "border-emerald-600 bg-white text-emerald-700 shadow-sm"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:bg-white/60 hover:text-slate-700"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="rounded-b-xl border border-t-0 border-slate-200 bg-white p-5 shadow-sm" role="tabpanel">
          {activeTab === "site" && <SiteTab api={api} />}
          {activeTab === "social" && <SocialTab api={api} />}
          {activeTab === "payments" && <PaymentsTab api={api} />}
          {activeTab === "integrations" && <IntegrationsTab api={api} />}
          {activeTab === "profile" && <ProfileTab />}
        </div>
      </div>
    </div>
  );
}
