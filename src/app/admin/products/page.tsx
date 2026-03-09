import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { uploadImage } from "@/lib/cloudinary";
import { PlusIcon } from "@heroicons/react/24/outline";
import { AdminProductList } from "@/components/admin/AdminProductList";
import { PAGE_SIZE } from "@/lib/pagination";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

const LOW_STOCK_THRESHOLD = 5;

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [totalCount, products] = await Promise.all([
    prisma.product.count(),
    prisma.product.findMany({
      include: { subCategory: { include: { category: true } } },
      orderBy: { id: "desc" },
      take: PAGE_SIZE,
    })
  ]);

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

      <AdminProductList initialProducts={products} totalCount={totalCount} />
    </div>
  );
}
