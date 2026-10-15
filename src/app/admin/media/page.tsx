import Image from "next/image";
import { Suspense } from "react";
import { ArrowUpTrayIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import prisma from "@/lib/prisma";
import { requireEditor } from "@/lib/admin-auth";
import { uploadMedia, deleteMedia } from "@/lib/actions/media";
import { FlashMessage } from "@/components/admin/FlashMessage";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { CopyButton } from "@/components/admin/CopyButton";
import { Pagination } from "@/components/Pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 40;

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; error?: string; notice?: string }>;
}) {
  await requireEditor();
  const { q = "", page: pageRaw, error, notice } = await searchParams;
  const page = Math.max(1, Number(pageRaw) || 1);
  const where = q.trim() ? { filename: { contains: q.trim(), mode: "insensitive" as const } } : {};

  const [total, items] = await Promise.all([
    prisma.media.count({ where }),
    prisma.media.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Media</h1>
        <p className="mt-1 text-sm text-slate-500">
          Every image uploaded in the admin. Reuse them anywhere with the “Library” button or by copying the URL.
          Images uploaded before the library existed aren&apos;t listed.
        </p>
      </div>

      <FlashMessage error={error} notice={notice} />

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <form action={uploadMedia} className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            name="files"
            accept="image/*"
            multiple
            required
            aria-label="Images to upload"
            className="text-sm text-slate-600 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-slate-700"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
          >
            <ArrowUpTrayIcon className="h-4 w-4" />
            Upload
          </button>
        </form>
        <form method="get" className="flex items-center gap-2">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search file name"
              aria-label="Search images"
              className="w-64 rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <button type="submit" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Search
          </button>
        </form>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500">
          {q ? "No images match this search." : "No images yet. Upload some above."}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((item) => (
            <li key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="relative block aspect-square bg-slate-100">
                <Image src={item.url} alt={item.filename ?? ""} fill className="object-cover" sizes="(max-width: 640px) 50vw, 20vw" />
              </a>
              <div className="space-y-2 p-3">
                <p className="truncate text-sm font-medium text-slate-900" title={item.filename ?? item.url}>
                  {item.filename ?? "Untitled"}
                </p>
                <p className="text-xs text-slate-500">
                  {[item.width && item.height ? `${item.width}×${item.height}` : "", formatBytes(item.bytes), item.createdAt.toLocaleDateString("en-GB")]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <CopyButton value={item.url} />
                  <form action={deleteMedia.bind(null, item.id)}>
                    <ConfirmSubmitButton
                      title="Delete image"
                      description="Delete this image from Cloudinary and the library? It is only allowed when nothing on the site uses it."
                    />
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Suspense>
        <Pagination totalItems={total} pageSize={PAGE_SIZE} />
      </Suspense>
    </div>
  );
}
