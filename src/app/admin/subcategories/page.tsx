import prisma from "@/lib/prisma";
import Link from "next/link";
import { PlusIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { createSubCategory } from "@/lib/actions/catalog-admin";
import { FlashMessage } from "@/components/admin/FlashMessage";
import { Pagination } from "@/components/Pagination";
import { paginate, PAGE_SIZE } from "@/lib/pagination";
import { Suspense } from "react";
import { requireEditor } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function SubCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; error?: string; notice?: string }>;
}) {
  await requireEditor();
  const resolvedParams = await searchParams;
  const page = Math.max(1, Number(resolvedParams?.page ?? 1));

  const allSubCategories = await prisma.subCategory.findMany({
    include: { category: true },
    orderBy: { name: "asc" },
  });

  const subCategories = paginate<typeof allSubCategories[number]>(allSubCategories, page, PAGE_SIZE);

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Subcategories</h1>
        <p className="mt-1 text-sm text-slate-500">Manage subcategories under each category.</p>
      </div>

      <FlashMessage error={resolvedParams?.error} notice={resolvedParams?.notice} />

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Add subcategory</h2>
        <form action={createSubCategory} className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px] flex-1">
            <label htmlFor="sub-name" className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input
              id="sub-name"
              type="text"
              name="name"
              placeholder="e.g. Hand Tools"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>
          <div className="min-w-[200px] flex-1">
            <label htmlFor="sub-category" className="mb-1 block text-sm font-medium text-slate-700">Category</label>
            <select
              id="sub-category"
              name="categoryId"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[200px] flex-1">
            <label htmlFor="sub-image" className="mb-1 block text-sm font-medium text-slate-700">Image (optional)</label>
            <input
              id="sub-image"
              type="file"
              name="image"
              accept="image/*"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-slate-700"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <PlusIcon className="h-4 w-4" />
            Add subcategory
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">All subcategories</h2>
          <p className="text-sm text-slate-500">{allSubCategories.length} total</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Category</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {subCategories.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-medium text-slate-900">{sub.name}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{sub.category.name}</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/subcategories/${sub.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {subCategories.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-slate-500">No subcategories match your criteria.</p>
        )}
      </div>

      <Suspense>
        <Pagination totalItems={allSubCategories.length} />
      </Suspense>
    </div>
  );
}
