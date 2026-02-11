import Link from "next/link";
import prisma from "@/lib/prisma";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blog | Ziva Landscaping Co.",
  description: "Articles and updates on sustainable landscaping, East Africa, and eco-friendly outdoor spaces.",
};

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    select: { id: true, title: true, slug: true, excerpt: true, publishedAt: true },
  });

  return (
    <div className="flex flex-col flex-1 min-h-full bg-[var(--background)]">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-4xl flex-1">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2 font-[family-name:var(--font-quicksand)]">
          Blog
        </h1>
        <p className="text-[var(--muted)] mb-8">
          Updates on sustainable landscaping and eco-friendly outdoor spaces.
        </p>
        {posts.length === 0 ? (
          <p className="text-[var(--muted)]">No posts yet. Check back later.</p>
        ) : (
          <ul className="space-y-6">
            {posts.map((post) => (
              <li key={post.id} className="border-b border-[var(--card-border)] pb-6">
                <Link href={`/blog/${post.slug}`} className="block group">
                  <h2 className="text-xl font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] font-[family-name:var(--font-quicksand)]">
                    {post.title}
                  </h2>
                  {post.publishedAt && (
                    <time className="text-sm text-[var(--muted)]" dateTime={post.publishedAt.toISOString()}>
                      {new Date(post.publishedAt).toLocaleDateString("en-KE", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  )}
                  {post.excerpt && (
                    <p className="mt-2 text-[var(--muted)] line-clamp-2">{post.excerpt}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Footer />
    </div>
  );
}
