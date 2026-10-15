import Link from "next/link";
import { sanitizeBlogHtml } from "@/lib/sanitize";

/** Layout for admin-editable text pages (privacy, terms). */
export function PolicyPage({ title, lastUpdated, html }: { title: string; lastUpdated: string; html: string }) {
  return (
    <div className="min-h-full flex flex-col flex-1">
      <article className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 max-w-3xl flex-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] font-[family-name:var(--font-quicksand)] mb-2">
          {title}
        </h1>
        {lastUpdated && <p className="text-sm text-[var(--muted)] mb-8">Last updated: {lastUpdated}</p>}

        <div
          className="max-w-none font-[family-name:var(--font-quicksand)] text-[var(--muted)] leading-relaxed [&_a]:text-[var(--accent)] [&_a]:underline [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-[var(--foreground)] [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-semibold [&_h3]:text-[var(--foreground)] [&_li]:mb-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_strong]:text-[var(--foreground)] [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(html) }}
        />

        <p className="mt-10">
          <Link href="/" className="text-[var(--accent)] hover:underline">← Back to home</Link>
        </p>
      </article>
    </div>
  );
}
