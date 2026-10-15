import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireEditor } from "@/lib/admin-auth";
import { CONTENT_INFO, CONTENT_KEYS } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function ContentIndexPage() {
  await requireEditor();
  const saved = await prisma.contentBlock.findMany({ select: { key: true, updatedAt: true } });
  const savedAt = new Map<string, Date>(saved.map((b) => [b.key, b.updatedAt]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Site content</h1>
        <p className="mt-1 text-sm text-slate-500">
          Edit the text and images on the homepage and info pages. Changes go live as soon as you save.
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CONTENT_KEYS.map((key) => {
          const info = CONTENT_INFO[key];
          const updated = savedAt.get(key);
          return (
            <li key={key} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-slate-900">{info.label}</h2>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${updated ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                  {updated ? "Customized" : "Default"}
                </span>
              </div>
              <p className="mt-1 flex-1 text-sm text-slate-500">{info.description}</p>
              {updated && (
                <p className="mt-2 text-xs text-slate-400">
                  Updated {updated.toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" })}
                </p>
              )}
              <div className="mt-4 flex items-center gap-3">
                <Link
                  href={`/admin/content/${encodeURIComponent(key)}`}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Edit
                </Link>
                <a href={info.publicPath} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                  View ↗
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
