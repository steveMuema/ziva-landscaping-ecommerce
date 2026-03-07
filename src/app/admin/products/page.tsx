import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { uploadImage } from "@/lib/cloudinary";
import Image from "next/image";
import { PlusIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

const LOW_STOCK_THRESHOLD = 5;

export const dynamic = "force-dynamic";

async function updateProductStock(formData: FormData) {
  "use server";
  const productId = parseInt(formData.get("productId") as string, 10);
  const stock = parseInt(formData.get("stock") as string, 10);
  if (isNaN(productId) || isNaN(stock) || stock < 0) return;
  await prisma.product.update({
    where: { id: productId },
    data: { stock },
  });
  revalidatePath("/admin/products");
  revalidatePath("/admin");
  revalidatePath("/shop");
  revalidatePath("/shop", "layout");
  revalidatePath("/");
}

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    include: { subCategory: { include: { category: true } } },
    orderBy: { id: "desc" },
  });
  const subCategories = await prisma.subCategory.findMany({
    include: { category: true },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });

  async function createProduct(formData: FormData) {
    "use server";
    const name = (formData.get("name") as string)?.trim();
    if (!name) return;
    const description = (formData.get("description") as string)?.trim() || null;
    const price = parseFloat(formData.get("price") as string);
    const costRaw = formData.get("cost") as string;
    const cost = costRaw !== "" && costRaw != null ? parseFloat(costRaw) : null;
    const stock = parseInt(formData.get("stock") as string, 10);
    const subCategoryId = parseInt(formData.get("subCategoryId") as string, 10);
    if (isNaN(price) || isNaN(stock) || isNaN(subCategoryId)) return;
    const costPrice = cost != null && !isNaN(cost) ? cost : Math.round(price * 0.9 * 100) / 100;
    const imageFile = formData.get("image") as File | null;
    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadImage(imageFile);
    }
    const tagsRaw = (formData.get("tags") as string)?.trim() || "";
    const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];
    await prisma.product.create({
      data: { name, description, price, cost: costPrice, stock, subCategoryId, imageUrl, tags },
    });
    revalidatePath("/admin/products");
    revalidatePath("/admin");
    revalidatePath("/shop");
    revalidatePath("/shop", "layout");
    revalidatePath("/");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your product catalog. Add tags like &quot;featured&quot; for homepage.</p>
      </div>

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

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-slate-900">All products</h2>
            <p className="text-sm text-slate-500">{products.length} total · Stock management: set new value and click Update</p>
          </div>
          {products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).length > 0 && (
            <p className="text-sm text-amber-700 font-medium">
              {products.filter((p) => p.stock === 0).length} out of stock · {products.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length} low stock (≤{LOW_STOCK_THRESHOLD})
            </p>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Product</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Category</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Selling price</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Cost</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Stock</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Tags</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {products.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {prod.imageUrl ? (
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          <Image
                            src={prod.imageUrl}
                            alt={prod.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-200" />
                      )}
                      <span className="font-medium text-slate-900">{prod.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">
                    {prod.subCategory.category.name} / {prod.subCategory.name}
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-slate-900">
                    {Number(prod.price).toLocaleString()} KSH
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600">
                    {prod.cost != null ? `${Number(prod.cost).toLocaleString()} KSH` : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <form action={updateProductStock} className="flex items-center justify-end gap-2">
                      <input type="hidden" name="productId" value={prod.id} />
                      <input
                        type="number"
                        name="stock"
                        min={0}
                        defaultValue={prod.stock}
                        className={`w-20 rounded-lg border px-2 py-1.5 text-right text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${prod.stock === 0
                          ? "border-red-300 bg-red-50 text-red-900"
                          : prod.stock <= LOW_STOCK_THRESHOLD
                            ? "border-amber-300 bg-amber-50 text-amber-900"
                            : "border-slate-300 text-slate-900"
                          }`}
                        aria-label={`Stock for ${prod.name}`}
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                      >
                        Update
                      </button>
                    </form>
                  </td>
                  <td className="px-5 py-3">
                    {prod.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {(prod.tags as string[] || []).map((t, idx) => (
                          <span
                            key={idx}
                            className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                          >
                            {String(t)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/products/${prod.id}/edit`}
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
        {products.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-slate-500">No products yet. Add one above.</p>
        )}
      </div>
    </div>
  );
}
