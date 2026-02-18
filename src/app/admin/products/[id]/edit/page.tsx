import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { uploadImage } from "@/lib/cloudinary";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

export const dynamic = "force-dynamic";

async function updateProduct(productId: number, formData: FormData) {
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
  const tagsRaw = (formData.get("tags") as string)?.trim() || "";
  const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];

  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (!existing) return;

  let imageUrl: string | null = existing.imageUrl;
  if (imageFile && imageFile.size > 0) {
    imageUrl = await uploadImage(imageFile);
  }

  await prisma.product.update({
    where: { id: productId },
    data: { name, description, price, cost: costPrice, stock, subCategoryId, imageUrl, tags },
  });
  revalidatePath("/admin/products");
  revalidatePath("/admin");
  revalidatePath("/shop");
  revalidatePath("/shop", "layout");
  revalidatePath("/");
  redirect("/admin/products");
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/auth/signin");
  }
  const { id } = await params;
  const productId = parseInt(id, 10);
  if (isNaN(productId)) notFound();

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { subCategory: { include: { category: true } } },
  });
  if (!product) notFound();

  const subCategories = await prisma.subCategory.findMany({
    include: { category: true },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Products
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Edit product
        </h1>
        <p className="mt-1 text-sm text-slate-500">{product.name}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <form
          action={updateProduct.bind(null, productId)}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div>
            <label htmlFor="edit-name" className={labelClass}>
              Name
            </label>
            <input
              id="edit-name"
              type="text"
              name="name"
              defaultValue={product.name}
              placeholder="Product name"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label htmlFor="edit-price" className={labelClass}>
              Selling price (KSH)
            </label>
            <input
              id="edit-price"
              type="number"
              name="price"
              step="0.01"
              min={0}
              defaultValue={product.price}
              placeholder="0.00"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label htmlFor="edit-cost" className={labelClass}>
              Cost (KSH)
            </label>
            <input
              id="edit-cost"
              type="number"
              name="cost"
              step="0.01"
              min={0}
              defaultValue={product.cost ?? ""}
              placeholder="10% below price"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="edit-stock" className={labelClass}>
              Stock
            </label>
            <input
              id="edit-stock"
              type="number"
              name="stock"
              min={0}
              defaultValue={product.stock}
              placeholder="0"
              className={inputClass}
              required
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="edit-desc" className={labelClass}>
              Description (optional)
            </label>
            <input
              id="edit-desc"
              type="text"
              name="description"
              defaultValue={product.description ?? ""}
              placeholder="Short description"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="edit-sub" className={labelClass}>
              Subcategory
            </label>
            <select
              id="edit-sub"
              name="subCategoryId"
              className={inputClass}
              required
              defaultValue={product.subCategoryId}
            >
              {subCategories.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.category.name} → {sub.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="edit-tags" className={labelClass}>
              Tags (comma-separated)
            </label>
            <input
              id="edit-tags"
              type="text"
              name="tags"
              defaultValue={product.tags.join(", ")}
              placeholder="e.g. featured, new"
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="edit-image" className={labelClass}>
              Image (optional — choose a new file to replace)
            </label>
            {product.imageUrl ? (
              <div className="mb-2 flex items-center gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <span className="text-sm text-slate-500">Current image</span>
              </div>
            ) : null}
            <input
              id="edit-image"
              type="file"
              name="image"
              accept="image/*"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-slate-700"
            />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              Save changes
            </button>
            <Link
              href="/admin/products"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
