import Link from "next/link";
import prisma from "@/lib/prisma";
import { TrashIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@/components/Pagination";
import { PAGE_SIZE } from "@/lib/pagination";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteComment } from "@/lib/actions/comments";

export const dynamic = "force-dynamic";

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();

  const resolvedParams = await searchParams;
  const page = Math.max(1, Number(resolvedParams?.page ?? 1));

  const [total, comments] = await Promise.all([
    prisma.comment.count(),
    prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        post: { select: { title: true, slug: true } },
        _count: { select: { replies: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Comments</h1>
        <p className="mt-1 text-sm text-slate-500">Review and remove blog comments.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Latest comments</h2>
          <p className="text-sm text-slate-500">{total} total</p>
        </div>
        {comments.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-slate-500">No comments yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {comments.map((comment) => (
              <li key={comment.id} className="hover:bg-slate-50/50">
                <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 sm:flex-nowrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 text-sm">
                      <span className="font-medium text-slate-900">{comment.authorName}</span>
                      <span className="text-slate-400">on</span>
                      <Link
                        href={`/blog/${comment.post.slug}`}
                        target="_blank"
                        className="font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        {comment.post.title}
                      </Link>
                      {comment.parentId && (
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          Reply
                        </span>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">{comment.content}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {comment.createdAt.toLocaleString()} · {comment.likes} likes
                      {comment._count.replies > 0 && ` · ${comment._count.replies} replies`}
                    </p>
                  </div>
                  <form action={deleteComment}>
                    <input type="hidden" name="id" value={comment.id} />
                    <button
                      type="submit"
                      title={comment._count.replies > 0 ? "Also deletes its replies" : undefined}
                      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Suspense>
        <Pagination totalItems={total} />
      </Suspense>
    </div>
  );
}
