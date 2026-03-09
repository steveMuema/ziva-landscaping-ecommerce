import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { BlogSidebar } from "@/components/blog/BlogSidebar";
import { FeaturedImage, getFeaturedImageUrl } from "@/components/blog/FeaturedImage";
import CommentSection from "@/components/blog/CommentSection";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug, published: true },
    select: { title: true, excerpt: true, imageUrl: true },
  });
  if (!post) return { title: "Blog | Ziva Landscaping Co." };

  const title = `${post.title} | Blog | Ziva Landscaping Co.`;
  const description = post.excerpt || `Read ${post.title} at Ziva Landscaping Co.`;
  const url = process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${slug}` : `https://zivalandscaping.co.ke/blog/${slug}`;
  const images = post.imageUrl ? [{ url: post.imageUrl }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.imageUrl ? [post.imageUrl] : undefined,
    }
  };
}

function formatDate(d: Date | null) {
  if (!d) return null;
  const dateObj = new Date(d);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${months[dateObj.getUTCMonth()]} ${dateObj.getUTCDate()}, ${dateObj.getUTCFullYear()}`;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const [post, recentPosts] = await Promise.all([
    prisma.blogPost.findUnique({
      where: { slug, published: true },
      include: {
        comments: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      select: { id: true, title: true, slug: true, imageUrl: true },
      take: 6,
    }),
  ]);
  if (!post) notFound();

  const recentForSidebar = recentPosts.map((p) => ({ id: p.id, title: p.title, slug: p.slug, imageUrl: p.imageUrl }));
  const featuredUrl = getFeaturedImageUrl(post.imageUrl);
  const bgStyle = {
    backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.3)), url(${featuredUrl})`,
    backgroundAttachment: "fixed",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zivalandscaping.co.ke";
  const postUrl = `${baseUrl}/blog/${slug}`;

  return (
    <div className="relative min-h-screen flex flex-col" style={bgStyle}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([{
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": postUrl
            },
            "headline": post.title,
            "description": post.excerpt || post.title,
            "image": featuredUrl,
            "datePublished": post.publishedAt ? post.publishedAt.toISOString() : undefined,
            "dateModified": post.updatedAt ? post.updatedAt.toISOString() : undefined,
            "author": {
              "@type": "Organization",
              "name": "Ziva Landscaping Co."
            },
            "publisher": {
              "@type": "Organization",
              "name": "Ziva Landscaping Co.",
              "logo": {
                "@type": "ImageObject",
                "url": `${baseUrl}/ziva_logo.jpg`
              }
            }
          }, {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": baseUrl
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Blog",
                "item": `${baseUrl}/blog`
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": post.title,
                "item": postUrl
              }
            ]
          }])
        }}
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
                  <FeaturedImage
                    src={featuredUrl}
                    alt={post.title}
                    className="object-cover w-full h-full"
                    priority
                  />
                </div>

                <header className="mb-8">
                  <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] font-[family-name:var(--font-quicksand)]">
                    {post.title}
                  </h1>
                  {post.publishedAt && (
                    <time
                      suppressHydrationWarning
                      className="text-sm text-[var(--muted)] mt-2 block"
                      dateTime={post.publishedAt.toISOString()}
                    >
                      {formatDate(post.publishedAt)}
                    </time>
                  )}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {post.tags.map((tag) => (
                        <span key={tag} className="text-xs uppercase tracking-wider font-semibold px-2.5 py-1 bg-[var(--muted-bg)] text-[var(--muted)] rounded-full border border-[var(--card-border)]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </header>

                <div
                  className="prose prose-lg max-w-none prose-headings:font-[family-name:var(--font-quicksand)] prose-p:text-[var(--foreground)] prose-li:text-[var(--foreground)]"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />

                <CommentSection postId={post.id} initialComments={post.comments} />
              </article>
            </main>

            <BlogSidebar recentPosts={recentForSidebar} />
          </div>
        </div>
      </div>
    </div>
  );
}
