import prisma from "@/lib/prisma";
import { PlusIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { AdminProductList } from "@/components/admin/AdminProductList";
import { requireEditor } from "@/lib/admin-auth";
import { getAdminProducts } from "@/lib/actions/admin";
import { createProduct, importProductsCsv } from "@/lib/actions/products-admin";
import { FlashMessage } from "@/components/admin/FlashMessage";
import { LibraryImageInput } from "@/components/admin/LibraryImageInput";
import { PRODUCT_STATUSES, PRODUCT_STATUS_LABELS } from "@/lib/product-fields";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

const LOW_STOCK_THRESHOLD = 5;

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; error?: string; notice?: string }>;
}) {
  await requireEditor();
  const { q = "", status = "", error, notice } = await searchParams;
  const filter = { q, status };

  const [{ totalCount, products }, subCategories] = await Promise.all([
    getAdminProducts(1, filter),
    prisma.subCategory.findMany({
      include: { category: true },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    }),
  ]);

  const returnTo = `/admin/products?${new URLSearchParams(filter).toString()}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your product catalog. Add tags like &quot;featured&quot; for homepage. Only Active products appear in the shop.</p>
      </div>

      <FlashMessage error={error} notice={notice} />

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Add product</h2>
        <form action={createProduct} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="prod-name" className={labelClass}>Name</label>
            <input id="prod-name" type="text" name="name" placeholder="Product name" className={inputClass} required />
          </div>
          <div>
            <label htmlFor="prod-price" className={labelClass}>Selling price (KSH)</label>
            <input id="prod-price" type="number" name="price" step="0.01" min="0" placeholder="0.00" className={inputClass} required />
          </div>
          <div>
            <label htmlFor="prod-cost" className={labelClass}>Cost (KSH, optional — default 10% below price)</label>
            <input id="prod-cost" type="number" name="cost" step="0.01" min="0" placeholder="Auto" className={inputClass} />
          </div>
          <div>
            <label htmlFor="prod-compare" className={labelClass}>&quot;Was&quot; price (KSH, optional)</label>
            <input id="prod-compare" type="number" name="compareAtPrice" step="0.01" min="0" placeholder="Shows as a sale" className={inputClass} />
          </div>
          <div>
            <label htmlFor="prod-sku" className={labelClass}>SKU (optional)</label>
            <input id="prod-sku" type="text" name="sku" placeholder="e.g. ZL-0001" className={inputClass} />
          </div>
          <div>
            <label htmlFor="prod-status" className={labelClass}>Status</label>
            <select id="prod-status" name="status" defaultValue="ACTIVE" className={inputClass}>
              {PRODUCT_STATUSES.map((st) => (
                <option key={st} value={st}>{PRODUCT_STATUS_LABELS[st]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="prod-stock" className={labelClass}>Stock</label>
            <input id="prod-stock" type="number" name="stock" min="0" placeholder="0" className={inputClass} required />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="prod-desc" className={labelClass}>Description (optional)</label>
            <input id="prod-desc" type="text" name="description" placeholder="Short description" className={inputClass} />
          </div>
          <div>
            <label htmlFor="prod-sub" className={labelClass}>Subcategory</label>
            <select id="prod-sub" name="subCategoryId" className={inputClass} required>
              <option value="">Select subcategory</option>
              {subCategories.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.category.name} → {sub.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="prod-tags" className={labelClass}>Tags (comma-separated)</label>
            <input id="prod-tags" type="text" name="tags" placeholder="e.g. featured, new" className={inputClass} />
          </div>
          <div>
            <label htmlFor="prod-image" className={labelClass}>Image (optional)</label>
            <input
              id="prod-image"
              type="file"
              name="image"
              accept="image/*"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-slate-700"
            />
            <div className="mt-2"><LibraryImageInput name="imageFromLibrary" /></div>
          </div>
          <div className="flex items-end sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <PlusIcon className="h-4 w-4" />
              Add product
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <form method="get" className="flex flex-1 flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <label htmlFor="filter-q" className={labelClass}>Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input id="filter-q" type="search" name="q" defaultValue={q} placeholder="Name or SKU" className={`${inputClass} pl-9`} />
              </div>
            </div>
            <div>
              <label htmlFor="filter-status" className={labelClass}>Status</label>
              <select id="filter-status" name="status" defaultValue={status} className={inputClass}>
                <option value="">All</option>
                {PRODUCT_STATUSES.map((st) => (
                  <option key={st} value={st}>{PRODUCT_STATUS_LABELS[st]}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Filter
            </button>
          </form>

          <div className="flex flex-wrap items-end gap-3">
            <a
              href="/api/admin/products/export"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export CSV
            </a>
            <form action={importProductsCsv} className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                name="file"
                accept=".csv,text/csv"
                required
                aria-label="CSV file to import"
                className="max-w-[220px] text-sm text-slate-600 file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-slate-700"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <ArrowUpTrayIcon className="h-4 w-4" />
                Import CSV
              </button>
            </form>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Import updates existing products only: export, edit name, SKU, status, prices, stock or tags, then import the file.
          Rows are matched by id (or SKU). If any row has a problem, nothing is changed.
        </p>
      </div>

      <AdminProductList
        key={returnTo}
        initialProducts={products}
        totalCount={totalCount}
        filter={filter}
        returnTo={returnTo}
      />
    </div>
  );
}
