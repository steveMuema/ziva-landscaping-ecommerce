import Link from "next/link";
import { notFound } from "next/navigation";
import { requireEditor } from "@/lib/admin-auth";
import { CONTENT_INFO, getContent, hasCustomContent, isContentKey } from "@/lib/content";
import { ContentEditor } from "@/components/admin/content/ContentEditor";

export const dynamic = "force-dynamic";

export default async function EditContentPage({ params }: { params: Promise<{ key: string }> }) {
  await requireEditor();
  const { key: raw } = await params;
  const key = decodeURIComponent(raw);
  if (!isContentKey(key)) notFound();

  const [data, customized] = await Promise.all([getContent(key), hasCustomContent(key)]);
  const info = CONTENT_INFO[key];

  return (
    <div className="space-y-6">
      <Link href="/admin/content" className="text-sm font-medium text-slate-600 hover:text-slate-900">
        ← Site content
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{info.label}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {info.description} {customized ? "" : "Showing the built-in text until you save."}
          </p>
        </div>
        <a href={info.publicPath} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
          View on site ↗
        </a>
      </div>
      <ContentEditor contentKey={key} initialData={data} customized={customized} />
    </div>
  );
}
