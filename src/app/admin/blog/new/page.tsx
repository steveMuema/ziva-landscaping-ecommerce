import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/authOptions";
import BlogPostForm from "./BlogPostForm";

function slugFromTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default async function AdminBlogNewPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    redirect("/auth/signin");
  }

  async function createPost(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const slugInput = (formData.get("slug") as string)?.trim();
    const slug = slugInput || slugFromTitle(title);
    const excerpt = (formData.get("excerpt") as string) || null;
    const content = formData.get("content") as string;
    const published = formData.get("published") === "on";
    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;
    await prisma.blogPost.create({
      data: {
        title,
        slug: finalSlug,
        excerpt,
        content: content || "<p></p>",
        published,
        publishedAt: published ? new Date() : null,
      },
    });
    revalidatePath("/admin/blog");
    revalidatePath("/admin");
    revalidatePath("/blog");
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
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">New post</h1>
        <p className="mt-1 text-sm text-slate-500">Create a new blog post.</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <BlogPostForm action={createPost} />
      </div>
    </div>
  );
}
