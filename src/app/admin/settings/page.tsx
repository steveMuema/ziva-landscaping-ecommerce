import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/auth/signin");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Site, contact, social links, Google credentials, and M-Pesa.
        </p>
      </div>
      <SettingsForm />
    </div>
  );
}
