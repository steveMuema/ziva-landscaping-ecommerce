import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import BlogPostForm from "../../new/BlogPostForm";
import { requireEditor } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminBlogEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireEditor();

  const { id } = await params;
  const postId = parseInt(id, 10);
  if (isNaN(postId)) notFound();

  const post = await prisma.blogPost.findUnique({ where: { id: postId } });
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/blog"
          className="mb-4 inline-flex text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Back to blog
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Edit post</h1>
        <p className="mt-1 text-sm text-slate-500">{post.title}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <BlogPostForm
          postId={postId}
          initialTitle={post.title}
          initialSlug={post.slug}
          initialTags={post.tags}
          initialExcerpt={post.excerpt ?? ""}
          initialContent={post.content}
          initialPublished={post.published}
          initialPublishedAt={post.publishedAt?.toISOString() ?? null}
          initialImageUrl={post.imageUrl ?? ""}
          initialMetaTitle={post.metaTitle ?? ""}
          initialMetaDescription={post.metaDescription ?? ""}
        />
      </div>
    </div>
  );
}
