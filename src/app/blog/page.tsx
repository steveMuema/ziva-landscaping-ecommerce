import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { BlogSidebar } from "@/components/blog/BlogSidebar";
import { getFeaturedImageUrl } from "@/components/blog/FeaturedImage";
import { Pagination, paginate, PAGE_SIZE } from "@/components/Pagination";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

const url = process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/blog` : "https://zivalandscaping.co.ke/blog";

export const metadata = {
  title: "Blog",
  description: "Articles and updates on sustainable landscaping, East Africa, and eco-friendly outdoor spaces.",
  alternates: { canonical: url },
  openGraph: {
    title: "Blog | Ziva Landscaping Co.",
    description: "Articles and updates on sustainable landscaping, East Africa, and eco-friendly outdoor spaces.",
    url,
  }
};

function formatDate(d: Date | null) {
  if (!d) return null;
  // Use a strictly deterministic ISO string or extract UTC components manually to avoid
  // hydration mismatches based on the server's local node timezone vs the browser's matching logic.
  const dateObj = new Date(d);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${months[dateObj.getUTCMonth()]} ${dateObj.getUTCDate()}, ${dateObj.getUTCFullYear()}`;
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const resolvedParams = await searchParams;
  const page = Math.max(1, Number(resolvedParams?.page ?? 1));

  const allPosts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      publishedAt: true,
    },
  });

  type BlogPost = typeof allPosts[number];
  const posts = paginate<BlogPost>(allPosts, page, PAGE_SIZE);
  const recentForSidebar = allPosts.slice(0, 5).map((p) => ({ id: p.id, title: p.title, slug: p.slug }));
  const [featured, ...rest] = posts;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": url.replace("/blog", "")
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Blog",
                "item": url
              }
            ]
          })
        }}
      />
      <div className="flex flex-col min-h-screen bg-[var(--background)]">
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-6xl flex-1">
          <header className="mb-10">
            <h1 className="text-4xl font-bold text-[var(--foreground)] font-[family-name:var(--font-quicksand)]">
              Blog
            </h1>
            <p className="text-[var(--muted)] mt-2 max-w-2xl">
              Updates on sustainable landscaping and eco-friendly outdoor spaces.
            </p>
          </header>

          <div className="flex flex-col lg:flex-row gap-10 lg:gap-12">
            <main className="flex-1 min-w-0 space-y-10">
              {featured && (
                <Link href={`/blog/${featured.slug}`} className="block group">
                  <article className="rounded-2xl overflow-hidden border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm hover:shadow-md transition-shadow">
                    <div className="aspect-[21/10] relative bg-[var(--muted-bg)]">
                      <Image
                        src={getFeaturedImageUrl(null)}
                        alt=""
                        fill
                        className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        sizes="(max-width: 1024px) 100vw, 800px"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <time suppressHydrationWarning className="text-sm text-white/90" dateTime={featured.publishedAt?.toISOString() ?? undefined}>
                          {formatDate(featured.publishedAt)}
                        </time>
                        <h2 className="text-2xl sm:text-3xl font-bold mt-1 font-[family-name:var(--font-quicksand)] group-hover:text-[var(--ziva-green-light)] transition-colors">
                          {featured.title}
                        </h2>
                        {featured.excerpt && (
                          <p className="mt-2 text-white/90 line-clamp-2 text-sm sm:text-base">{featured.excerpt}</p>
                        )}
                      </div>
                    </div>
                  </article>
                </Link>
              )}

              {rest.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2">
                  {rest.map((post) => (
                    <Link key={post.id} href={`/blog/${post.slug}`} className="block group">
                      <article className="rounded-xl overflow-hidden border border-[var(--card-border)] bg-[var(--card-bg)] h-full flex flex-col shadow-sm hover:shadow-md transition-shadow">
                        <div className="aspect-[16/10] relative bg-[var(--muted-bg)] shrink-0">
                          <Image
                            src={getFeaturedImageUrl(null)}
                            alt=""
                            fill
                            className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                            sizes="(max-width: 640px) 100vw, 50vw"
                          />
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                          {post.publishedAt && (
                            <time suppressHydrationWarning className="text-xs text-[var(--muted)]" dateTime={post.publishedAt.toISOString()}>
                              {formatDate(post.publishedAt)}
                            </time>
                          )}
                          <h3 className="mt-1 text-lg font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] font-[family-name:var(--font-quicksand)]">
                            {post.title}
                          </h3>
                          {post.excerpt && (
                            <p className="mt-2 text-sm text-[var(--muted)] line-clamp-2">{post.excerpt}</p>
                          )}
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              )}

              {posts.length === 0 && (
                <p className="text-[var(--muted)] py-8">No posts yet. Check back later.</p>
              )}
              <Suspense>
                <Pagination totalItems={allPosts.length} />
              </Suspense>
            </main>

            <BlogSidebar recentPosts={recentForSidebar} />
          </div>
        </div>
      </div>
    </>
  );
}
