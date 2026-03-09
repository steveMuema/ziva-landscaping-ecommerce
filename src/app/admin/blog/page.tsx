import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";
import { PlusIcon } from "@heroicons/react/24/outline";
import BlogActions from "@/components/admin/BlogActions";
import { Pagination, paginate, PAGE_SIZE } from "@/components/Pagination";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    redirect("/auth/signin");
  }

  const resolvedParams = await searchParams;
  const page = Math.max(1, Number(resolvedParams?.page ?? 1));

  const allPosts = await prisma.blogPost.findMany({
    orderBy: { updatedAt: "desc" },
  });

  const posts = paginate<typeof allPosts[number]>(allPosts, page, PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Blog</h1>
          <p className="mt-1 text-sm text-slate-500">Create and manage blog posts.</p>
        </div>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          <PlusIcon className="h-4 w-4" />
          New post
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Posts</h2>
          <p className="text-sm text-slate-500">{posts.length} total</p>
        </div>
        {posts.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-slate-500">No posts yet. Create one to get started.</p>
            <Link
              href="/admin/blog/new"
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              <PlusIcon className="h-4 w-4" />
              New post
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {posts.map((post) => (
              <li key={post.id} className="hover:bg-slate-50/50">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:flex-nowrap">
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-slate-900">{post.title}</span>
                    <span className="ml-2 text-sm text-slate-400">/{post.slug}</span>
                    {!post.published && (
                      <span className="ml-2 inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                        Draft
                      </span>
                    )}
                  </div>
                  <BlogActions id={post.id} slug={post.slug} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Suspense>
        <Pagination totalItems={allPosts.length} />
      </Suspense>
    </div>
  );
}
