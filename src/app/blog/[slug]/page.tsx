import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Footer from "@/components/Footer";

export const revalidate = 60;

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

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug, published: true },
  });
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <article className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-3xl">
        <Link href="/blog" className="text-[var(--accent)] hover:underline text-sm mb-6 inline-block">
          ← Blog
        </Link>
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)] font-[family-name:var(--font-quicksand)]">
            {post.title}
          </h1>
          {post.publishedAt && (
            <time className="text-sm text-[var(--muted)]" dateTime={post.publishedAt.toISOString()}>
              {new Date(post.publishedAt).toLocaleDateString("en-KE", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          )}
        </header>
        <div
          className="prose prose-lg max-w-none prose-headings:font-[family-name:var(--font-quicksand)] prose-p:text-[var(--foreground)] prose-li:text-[var(--foreground)]"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
      <Footer />
    </div>
  );
}
