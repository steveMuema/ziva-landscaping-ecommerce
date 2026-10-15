import Link from "next/link";
import { requireEditor } from "@/lib/admin-auth";
import BlogPostForm from "./BlogPostForm";

export const dynamic = "force-dynamic";

export default async function AdminBlogNewPage() {
  await requireEditor();

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
        <BlogPostForm />
      </div>
    </div>
  );
}
