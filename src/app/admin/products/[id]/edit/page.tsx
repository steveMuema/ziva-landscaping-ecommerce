import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireEditor } from "@/lib/admin-auth";
import { updateProduct, deleteProduct, bulkUpdateProducts } from "@/lib/actions/products-admin";
import { FlashMessage } from "@/components/admin/FlashMessage";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { LibraryImageInput } from "@/components/admin/LibraryImageInput";
import { PRODUCT_STATUSES, PRODUCT_STATUS_LABELS } from "@/lib/product-fields";
import { slugify } from "@/lib/slug";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";
const fileClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-slate-700";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireEditor();
  const { id } = await params;
  const { error } = await searchParams;
  const productId = parseInt(id, 10);
  if (isNaN(productId)) notFound();

  const [product, subCategories] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      include: {
        subCategory: { include: { category: true } },
        _count: { select: { OrderItem: true } },
      },
    }),
    prisma.subCategory.findMany({
      include: { category: true },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    }),
  ]);
  if (!product) notFound();

  const orderCount = product._count.OrderItem;
  const shopUrl = `/shop/${slugify(product.subCategory.category.name)}/${slugify(product.subCategory.name)}/${product.id}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          ← Products
        </Link>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit product</h1>
          <p className="mt-1 text-sm text-slate-500">{product.name}</p>
        </div>
        {product.status === "ACTIVE" && (
          <a href={shopUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
            View in shop ↗
          </a>
        )}
      </div>

      <FlashMessage error={error} />

      <form
        action={updateProduct.bind(null, productId)}
        className="space-y-6"
      >
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Details</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="edit-name" className={labelClass}>Name</label>
              <input id="edit-name" type="text" name="name" defaultValue={product.name} placeholder="Product name" className={inputClass} required />
            </div>
            <div>
              <label htmlFor="edit-status" className={labelClass}>Status</label>
              <select id="edit-status" name="status" defaultValue={product.status} className={inputClass}>
                {PRODUCT_STATUSES.map((st) => (
                  <option key={st} value={st}>{PRODUCT_STATUS_LABELS[st]}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">Only Active products appear in the shop.</p>
            </div>
            <div>
              <label htmlFor="edit-price" className={labelClass}>Selling price (KSH)</label>
              <input id="edit-price" type="number" name="price" step="0.01" min={0} defaultValue={product.price} placeholder="0.00" className={inputClass} required />
            </div>
            <div>
              <label htmlFor="edit-compare" className={labelClass}>&quot;Was&quot; price (KSH)</label>
              <input id="edit-compare" type="number" name="compareAtPrice" step="0.01" min={0} defaultValue={product.compareAtPrice ?? ""} placeholder="Empty = not on sale" className={inputClass} />
            </div>
            <div>
              <label htmlFor="edit-cost" className={labelClass}>Cost (KSH)</label>
              <input id="edit-cost" type="number" name="cost" step="0.01" min={0} defaultValue={product.cost ?? ""} placeholder="10% below price" className={inputClass} />
            </div>
            <div>
              <label htmlFor="edit-stock" className={labelClass}>Stock</label>
              <input id="edit-stock" type="number" name="stock" min={0} defaultValue={product.stock} placeholder="0" className={inputClass} required />
            </div>
            <div>
              <label htmlFor="edit-sku" className={labelClass}>SKU</label>
              <input id="edit-sku" type="text" name="sku" defaultValue={product.sku ?? ""} placeholder="e.g. ZL-0001" className={inputClass} />
            </div>
            <div>
              <label htmlFor="edit-sub" className={labelClass}>Subcategory</label>
              <select id="edit-sub" name="subCategoryId" className={inputClass} required defaultValue={product.subCategoryId}>
                {subCategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.category.name} → {sub.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label htmlFor="edit-desc" className={labelClass}>Description (optional)</label>
              <textarea id="edit-desc" name="description" rows={4} defaultValue={product.description ?? ""} placeholder="Description" className={inputClass} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label htmlFor="edit-tags" className={labelClass}>Tags (comma-separated)</label>
              <input id="edit-tags" type="text" name="tags" defaultValue={product.tags.join(", ")} placeholder="e.g. featured, new" className={inputClass} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Images</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label htmlFor="edit-image" className={labelClass}>Main image (choose a file to replace)</label>
              {product.imageUrl && (
                <div className="relative mb-2 h-24 w-24 overflow-hidden rounded-lg bg-slate-100">
                  <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="96px" />
                </div>
              )}
              <input id="edit-image" type="file" name="image" accept="image/*" className={fileClass} />
              <div className="mt-2"><LibraryImageInput name="imageFromLibrary" /></div>
            </div>
            <div>
              <label htmlFor="edit-gallery" className={labelClass}>Gallery (shown after the main image)</label>
              {product.images.length > 0 && (
                <ul className="mb-2 flex flex-wrap gap-3">
                  {product.images.map((url, i) => (
                    <li key={url} className="flex flex-col items-center gap-1">
                      <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-slate-100">
                        <Image src={url} alt={`${product.name} image ${i + 2}`} fill className="object-cover" sizes="80px" />
                      </div>
                      <label className="flex items-center gap-1 text-xs text-slate-600">
                        <input type="checkbox" name="removeImages" value={url} className="h-3.5 w-3.5 rounded border-slate-300 text-red-600" />
                        Remove
                      </label>
                    </li>
                  ))}
                </ul>
              )}
              <input id="edit-gallery" type="file" name="galleryImages" accept="image/*" multiple className={fileClass} />
              <div className="mt-2"><LibraryImageInput name="galleryFromLibrary" multiple /></div>
              <p className="mt-1 text-xs text-slate-500">Upload files or pick from the library to add them.</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Search &amp; social</h2>
          <p className="mb-4 text-xs text-slate-500">Optional. Defaults to the product name and description.</p>
          <div className="grid gap-4">
            <div>
              <label htmlFor="edit-metaTitle" className={labelClass}>SEO title</label>
              <input id="edit-metaTitle" type="text" name="metaTitle" maxLength={120} defaultValue={product.metaTitle ?? ""} placeholder={product.name} className={inputClass} />
            </div>
            <div>
              <label htmlFor="edit-metaDescription" className={labelClass}>SEO description</label>
              <textarea id="edit-metaDescription" name="metaDescription" maxLength={300} rows={2} defaultValue={product.metaDescription ?? ""} placeholder="Around 150 characters shown in Google results and link previews" className={inputClass} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            Save changes
          </button>
          <Link href="/admin/products" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </Link>
        </div>
      </form>

      <div className="rounded-xl border border-red-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-red-600">Remove product</h2>
        {orderCount > 0 ? (
          <>
            <p className="mt-1 text-sm text-slate-500">
              This product appears in {orderCount} order line{orderCount === 1 ? "" : "s"}, so it can&apos;t be deleted.
              Archiving hides it from the shop and keeps order history intact.
            </p>
            {product.status !== "ARCHIVED" && (
              <form action={bulkUpdateProducts} className="mt-3">
                <input type="hidden" name="ids" value={productId} />
                <input type="hidden" name="bulkAction" value="ARCHIVED" />
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Archive product
                </button>
              </form>
            )}
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-slate-500">
              This product has never been ordered, so it can be deleted permanently. It will also be removed from shoppers&apos; carts and wishlists.
            </p>
            <form action={deleteProduct.bind(null, productId)} className="mt-3">
              <ConfirmSubmitButton
                title="Delete product"
                description={`Permanently delete “${product.name}”? This cannot be undone.`}
              />
            </form>
          </>
        )}
      </div>
    </div>
  );
}
