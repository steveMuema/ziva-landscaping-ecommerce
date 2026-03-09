import prisma from "@/lib/prisma";
import { BlogSidebar } from "@/components/blog/BlogSidebar";
import { BlogList } from "@/components/blog/BlogList";
import { PAGE_SIZE } from "@/lib/pagination";

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

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    take: PAGE_SIZE,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      publishedAt: true,
    },
  });

  const recentForSidebar = posts.map((p) => ({ id: p.id, title: p.title, slug: p.slug }));

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
              <BlogList initialPosts={posts} />
            </main>

            <BlogSidebar recentPosts={recentForSidebar} />
          </div>
        </div>
      </div>
    </>
  );
}
