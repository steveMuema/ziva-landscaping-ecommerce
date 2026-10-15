import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireEditor } from "@/lib/admin-auth";
import { updateSubCategory, deleteSubCategory } from "@/lib/actions/catalog-admin";
import { FlashMessage } from "@/components/admin/FlashMessage";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { slugify } from "@/lib/slug";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

export const dynamic = "force-dynamic";

export default async function EditSubCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireEditor();
  const { id } = await params;
  const { error } = await searchParams;
  const subCategoryId = parseInt(id, 10);
  if (isNaN(subCategoryId)) notFound();

  const [sub, categories] = await Promise.all([
    prisma.subCategory.findUnique({
      where: { id: subCategoryId },
      include: { category: true, _count: { select: { products: true } } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!sub) notFound();

  const productCount = sub._count.products;

  return (
    <div className="space-y-6">
      <Link href="/admin/subcategories" className="text-sm font-medium text-slate-600 hover:text-slate-900">
        ← Subcategories
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit subcategory</h1>
        <p className="mt-1 text-sm text-slate-500">
          {sub.category.name} → {sub.name} ·{" "}
          <span className="font-mono">/shop/{slugify(sub.category.name)}/{slugify(sub.name)}</span>
        </p>
      </div>

      <FlashMessage error={error} />

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <form action={updateSubCategory.bind(null, subCategoryId)} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sub-name" className={labelClass}>Name</label>
            <input id="sub-name" type="text" name="name" defaultValue={sub.name} className={inputClass} required />
          </div>
          <div>
            <label htmlFor="sub-category" className={labelClass}>Category</label>
            <select id="sub-category" name="categoryId" defaultValue={sub.categoryId} className={inputClass} required>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <p className="-mt-2 text-xs text-slate-500 sm:col-span-2">
            The name and category are part of the shop URL, so changing them changes links to this subcategory and its products.
          </p>
          <div className="sm:col-span-2">
            <label htmlFor="sub-desc" className={labelClass}>Description (optional)</label>
            <textarea id="sub-desc" name="description" rows={2} defaultValue={sub.description ?? ""} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="sub-image" className={labelClass}>Image (choose a file to replace)</label>
            {sub.imageUrl && (
              <div className="mb-2 flex items-center gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  <Image src={sub.imageUrl} alt={sub.name} fill className="object-cover" sizes="64px" />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" name="removeImage" className="h-4 w-4 rounded border-slate-300 text-emerald-600" />
                  Remove image
                </label>
              </div>
            )}
            <input
              id="sub-image"
              type="file"
              name="image"
              accept="image/*"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-slate-700"
            />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <button
              type="submit"
              className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              Save changes
            </button>
            <Link href="/admin/subcategories" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cancel
            </Link>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-red-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-red-600">Delete subcategory</h2>
        <p className="mt-1 text-sm text-slate-500">
          {productCount > 0
            ? `It still has ${productCount} products (including drafts and archived). Move or delete them first.`
            : "This permanently removes the subcategory."}
        </p>
        <form action={deleteSubCategory.bind(null, subCategoryId)} className="mt-3">
          <ConfirmSubmitButton
            title="Delete subcategory"
            description={`Permanently delete “${sub.name}”? This cannot be undone.`}
            disabled={productCount > 0}
            disabledReason="Move or delete its products first"
          />
        </form>
      </div>
    </div>
  );
}
