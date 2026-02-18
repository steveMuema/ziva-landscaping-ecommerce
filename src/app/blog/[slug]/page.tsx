import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Footer from "@/components/Footer";
import { BlogSidebar } from "@/components/blog/BlogSidebar";
import { getFeaturedImageUrl } from "@/components/blog/FeaturedImage";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug, published: true },
    select: { title: true, excerpt: true },
  });
  if (!post) return { title: "Blog | Ziva Landscaping Co." };
  return {
    title: `${post.title} | Blog | Ziva Landscaping Co.`,
    description: post.excerpt ?? undefined,
  };
}

function formatDate(d: Date | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const [post, recentPosts] = await Promise.all([
    prisma.blogPost.findUnique({ where: { slug, published: true } }),
    prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      select: { id: true, title: true, slug: true },
      take: 6,
    }),
  ]);
  if (!post) notFound();

  const recentForSidebar = recentPosts.map((p) => ({ id: p.id, title: p.title, slug: p.slug }));
  const featuredUrl = getFeaturedImageUrl(post.imageUrl);
  const bgStyle = {
    backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.3)), url(${featuredUrl})`,
    backgroundAttachment: "fixed",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={bgStyle}
        aria-hidden
      />
      <div className="relative z-10 flex flex-col flex-1 min-h-screen bg-white/82 dark:bg-slate-900/82 backdrop-blur-md">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-6xl flex-1">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-12">
          <main className="flex-1 min-w-0">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:underline mb-6"
            >
              ← Blog
            </Link>

            <article>
              <div className="rounded-2xl overflow-hidden border border-[var(--card-border)] aspect-[21/9] min-h-[200px] relative bg-[var(--muted-bg)] mb-8">
                <Image
                  src={featuredUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 800px"
                  priority
                />
              </div>

              <header className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] font-[family-name:var(--font-quicksand)]">
                  {post.title}
                </h1>
                {post.publishedAt && (
                  <time
                    className="text-sm text-[var(--muted)] mt-2 block"
                    dateTime={post.publishedAt.toISOString()}
                  >
                    {formatDate(post.publishedAt)}
                  </time>
                )}
              </header>

              <div
                className="prose prose-lg max-w-none prose-headings:font-[family-name:var(--font-quicksand)] prose-p:text-[var(--foreground)] prose-li:text-[var(--foreground)]"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </article>
          </main>

          <BlogSidebar recentPosts={recentForSidebar} />
        </div>
      </div>
      <Footer />
      </div>
    </div>
  );
}
