import Link from "next/link";
import { FeaturedImage } from "./FeaturedImage";

const DEFAULT_BLOG_IMAGE = "/landscape.jpeg";

type PostForSidebar = { id: number; title: string; slug: string; imageUrl: string | null };

export function BlogSidebar({ recentPosts }: { recentPosts: PostForSidebar[] }) {
  return (
    <aside className="shrink-0 w-full lg:w-72 lg:pl-8 space-y-10">
      {recentPosts.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)] mb-4 font-[family-name:var(--font-quicksand)]">
            Recent posts
          </h3>
          <ul className="space-y-4">
            {recentPosts.slice(0, 6).map((p) => (
              <li key={p.id}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="group flex gap-3 items-start"
                >
                  <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-slate-100 relative border border-slate-200">
                    <FeaturedImage
                      src={p.imageUrl}
                      alt=""
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <span className="text-[var(--foreground)] group-hover:text-[var(--accent)] text-xs font-medium leading-snug transition-colors line-clamp-2">
                    {p.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="rounded-xl overflow-hidden border border-[var(--card-border)] bg-[var(--card-bg)]">
        <div className="aspect-[4/3] relative bg-[var(--muted-bg)]">
          <FeaturedImage
            src={DEFAULT_BLOG_IMAGE}
            alt=""
            className="object-cover w-full h-full"
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
