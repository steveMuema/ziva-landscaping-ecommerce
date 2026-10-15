import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireEditor } from "@/lib/admin-auth";
import { updateCategory, deleteCategory } from "@/lib/actions/catalog-admin";
import { FlashMessage } from "@/components/admin/FlashMessage";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { slugify } from "@/lib/slug";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireEditor();
  const { id } = await params;
  const { error } = await searchParams;
  const categoryId = parseInt(id, 10);
  if (isNaN(categoryId)) notFound();

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { subCategories: { orderBy: { name: "asc" }, select: { id: true, name: true } } },
  });
  if (!category) notFound();

  const subCount = category.subCategories.length;

  return (
    <div className="space-y-6">
      <Link href="/admin/categories" className="text-sm font-medium text-slate-600 hover:text-slate-900">
        ← Categories
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit category</h1>
        <p className="mt-1 text-sm text-slate-500">
          {category.name} · <span className="font-mono">/shop/{slugify(category.name)}</span>
        </p>
      </div>

      <FlashMessage error={error} />

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <form action={updateCategory.bind(null, categoryId)} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="cat-name" className={labelClass}>Name</label>
            <input id="cat-name" type="text" name="name" defaultValue={category.name} className={inputClass} required />
            <p className="mt-1 text-xs text-slate-500">
              The name is part of the shop URL, so renaming changes links to this category and its products.
            </p>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="cat-desc" className={labelClass}>Description (optional)</label>
            <textarea id="cat-desc" name="description" rows={2} defaultValue={category.description ?? ""} className={inputClass} />
          </div>
          <div>
            <label htmlFor="cat-image" className={labelClass}>Image (choose a file to replace)</label>
            {category.imageUrl && (
              <div className="mb-2 flex items-center gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  <Image src={category.imageUrl} alt={category.name} fill className="object-cover" sizes="64px" />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" name="removeImage" className="h-4 w-4 rounded border-slate-300 text-emerald-600" />
                  Remove image
                </label>
              </div>
            )}
            <input
              id="cat-image"
              type="file"
              name="image"
              accept="image/*"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-slate-700"
            />
          </div>
          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="isAgriculture"
                defaultChecked={category.isAgriculture}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              Agriculture module
            </label>
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <button
              type="submit"
              className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              Save changes
            </button>
            <Link href="/admin/categories" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cancel
            </Link>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Subcategories ({subCount})</h2>
        {subCount > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {category.subCategories.map((sub) => (
              <li key={sub.id}>
                <Link
                  href={`/admin/subcategories/${sub.id}/edit`}
                  className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200"
                >
                  {sub.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">None.</p>
        )}
      </div>

      <div className="rounded-xl border border-red-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-red-600">Delete category</h2>
        <p className="mt-1 text-sm text-slate-500">
          {subCount > 0
            ? "Move or delete its subcategories first."
            : "This permanently removes the category."}
        </p>
        <form action={deleteCategory.bind(null, categoryId)} className="mt-3">
          <ConfirmSubmitButton
            title="Delete category"
            description={`Permanently delete “${category.name}”? This cannot be undone.`}
            disabled={subCount > 0}
            disabledReason="Move or delete its subcategories first"
          />
        </form>
      </div>
    </div>
  );
}
