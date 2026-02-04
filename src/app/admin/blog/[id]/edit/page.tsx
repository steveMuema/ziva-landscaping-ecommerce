import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/authOptions";
import BlogPostForm from "../../new/BlogPostForm";

export default async function AdminBlogEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    redirect("/auth/signin");
  }

  const { id } = await params;
  const postId = parseInt(id, 10);
  if (isNaN(postId)) notFound();

  const post = await prisma.blogPost.findUnique({ where: { id: postId } });
  if (!post) notFound();

  async function updatePost(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const newSlug = (formData.get("slug") as string)?.trim() || post.slug;
    const excerpt = (formData.get("excerpt") as string) || null;
    const content = formData.get("content") as string;
    const published = formData.get("published") === "on";
    await prisma.blogPost.update({
      where: { id: postId },
      data: {
        title,
        slug: newSlug,
        excerpt,
        content: content || "<p></p>",
        published,
        publishedAt: published ? (post.publishedAt || new Date()) : null,
        updatedAt: new Date(),
      },
    });
    revalidatePath("/admin/blog");
    revalidatePath("/admin");
    revalidatePath(`/admin/blog/${postId}/edit`);
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    if (newSlug !== post.slug) revalidatePath(`/blog/${newSlug}`);
    redirect("/admin/blog");
  }

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
          action={updatePost}
          initialTitle={post.title}
          initialSlug={post.slug}
          initialExcerpt={post.excerpt ?? ""}
          initialContent={post.content}
          initialPublished={post.published}
        />
      </div>
    </div>
  );
}
