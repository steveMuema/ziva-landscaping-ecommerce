import Link from "next/link";
import Image from "next/image";

const DEFAULT_BLOG_IMAGE = "/landscape.jpeg";

type PostForSidebar = { id: number; title: string; slug: string };

export function BlogSidebar({ recentPosts }: { recentPosts: PostForSidebar[] }) {
  return (
    <aside className="shrink-0 w-full lg:w-72 lg:pl-8 space-y-10">
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)] mb-4 font-[family-name:var(--font-quicksand)]">
          Recent posts
        </h3>
        <ul className="space-y-2">
          {recentPosts.slice(0, 6).map((p) => (
            <li key={p.id}>
              <Link
                href={`/blog/${p.slug}`}
                className="text-[var(--foreground)] hover:text-[var(--accent)] text-sm leading-snug block py-1 border-l-2 border-transparent hover:border-[var(--accent)] pl-3 -ml-px transition-colors"
              >
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl overflow-hidden border border-[var(--card-border)] bg-[var(--card-bg)]">
        <div className="aspect-[4/3] relative bg-[var(--muted-bg)]">
          <Image
            src={DEFAULT_BLOG_IMAGE}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 288px"
          />
        </div>
        <div className="p-4">
          <p className="text-sm text-[var(--muted)]">
            Sustainable landscaping &amp; eco-friendly outdoor spaces — ideas and updates from Ziva.
          </p>
        </div>
      </section>
    </aside>
  );
}

export { DEFAULT_BLOG_IMAGE };
