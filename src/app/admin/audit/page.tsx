import { Suspense } from "react";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { Pagination } from "@/components/Pagination";
import type { AuditChanges } from "@/lib/audit";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const ENTITIES = ["Product", "Category", "SubCategory", "BlogPost", "Comment", "Order", "Setting", "ContentBlock", "Media", "User"];

const inputClass =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

function formatValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; entity?: string; user?: string; from?: string; to?: string; page?: string }>;
}) {
  await requireAdmin();
  const { q = "", entity = "", user = "", from = "", to = "", page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw) || 1);

  const where: Prisma.AuditLogWhereInput = {
    ...(entity && ENTITIES.includes(entity) ? { entity } : {}),
    ...(user.trim() ? { userEmail: { contains: user.trim(), mode: "insensitive" } } : {}),
    ...(q.trim() ? { summary: { contains: q.trim(), mode: "insensitive" } } : {}),
    ...(from || to
      ? {
        createdAt: {
          ...(from ? { gte: new Date(`${from}T00:00:00`) } : {}),
          ...(to ? { lte: new Date(`${to}T23:59:59.999`) } : {}),
        },
      }
      : {}),
  };

  const [total, entries] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Audit log</h1>
        <p className="mt-1 text-sm text-slate-500">
          Who changed what in the admin, and when. Secret settings are recorded as “(hidden)”.
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="audit-q" className="mb-1 block text-sm font-medium text-slate-700">Search</label>
          <input id="audit-q" type="search" name="q" defaultValue={q} placeholder="e.g. price, order #12" className={`${inputClass} w-full`} />
        </div>
        <div>
          <label htmlFor="audit-entity" className="mb-1 block text-sm font-medium text-slate-700">Type</label>
          <select id="audit-entity" name="entity" defaultValue={entity} className={inputClass}>
            <option value="">All</option>
            {ENTITIES.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="audit-user" className="mb-1 block text-sm font-medium text-slate-700">User email</label>
          <input id="audit-user" type="search" name="user" defaultValue={user} className={inputClass} />
        </div>
        <div>
          <label htmlFor="audit-from" className="mb-1 block text-sm font-medium text-slate-700">From</label>
          <input id="audit-from" type="date" name="from" defaultValue={from} className={inputClass} />
        </div>
        <div>
          <label htmlFor="audit-to" className="mb-1 block text-sm font-medium text-slate-700">To</label>
          <input id="audit-to" type="date" name="to" defaultValue={to} className={inputClass} />
        </div>
        <button type="submit" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Filter
        </button>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-sm text-slate-500">{total} entr{total === 1 ? "y" : "ies"}</p>
        </div>
        {entries.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500">No changes recorded yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {entries.map((entry) => {
              const changes = entry.changes as AuditChanges | null;
              return (
                <li key={entry.id} className="px-5 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm text-slate-900">{entry.summary}</p>
                    <time className="shrink-0 text-xs text-slate-400" dateTime={entry.createdAt.toISOString()}>
                      {entry.createdAt.toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" })}
                    </time>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {entry.userEmail ?? "Unknown user"} · <span className="font-mono">{entry.action}</span>
                    {entry.entityId && <> · {entry.entity} #{entry.entityId}</>}
                  </p>
                  {changes && Object.keys(changes).length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-medium text-emerald-700">
                        {Object.keys(changes).length} field{Object.keys(changes).length === 1 ? "" : "s"} changed
                      </summary>
                      <table className="mt-2 w-full max-w-3xl text-xs">
                        <thead>
                          <tr className="text-left text-slate-500">
                            <th className="py-1 pr-4 font-medium">Field</th>
                            <th className="py-1 pr-4 font-medium">Before</th>
                            <th className="py-1 font-medium">After</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(changes).map(([field, { from, to }]) => (
                            <tr key={field} className="align-top">
                              <td className="py-1 pr-4 font-mono text-slate-600">{field}</td>
                              <td className="max-w-xs break-words py-1 pr-4 text-red-700">{formatValue(from)}</td>
                              <td className="max-w-xs break-words py-1 text-emerald-700">{formatValue(to)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Suspense>
        <Pagination totalItems={total} pageSize={PAGE_SIZE} />
      </Suspense>
    </div>
  );
}
