import Link from "next/link";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { requireEditor } from "@/lib/admin-auth";
import { ROLE_LABELS } from "@/lib/roles";
import { ProfileTab } from "../settings/tabs/ProfileTab";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireEditor();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My account</h1>
        <p className="mt-1 text-sm text-slate-500">
          Signed in as {user.email} · {ROLE_LABELS[user.role]}
        </p>
      </div>
      <ProfileTab />
      <Link
        href="/admin/settings/security"
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <ShieldCheckIcon className="h-4 w-4" />
        Two-factor authentication
      </Link>
    </div>
  );
}
