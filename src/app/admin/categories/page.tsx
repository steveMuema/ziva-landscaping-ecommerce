import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { uploadImage } from "@/lib/cloudinary";
import { PlusIcon } from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { subCategories: true },
    orderBy: { name: "asc" },
  });

  async function createCategory(formData: FormData) {
    "use server";
    const name = (formData.get("name") as string)?.trim();
    if (!name) return;
    const imageFile = formData.get("image") as File | null;
    let imageUrl = null;
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadImage(imageFile);
    }
    const isAgriculture = formData.get("isAgriculture") === "on";
    await prisma.category.create({ data: { name, imageUrl, isAgriculture } });
    revalidatePath("/admin/categories");
    revalidatePath("/admin");
    revalidatePath("/shop");
    revalidatePath("/shop", "layout");
    revalidatePath("/");
    revalidatePath("/agriculture");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Categories</h1>
        <p className="mt-1 text-sm text-slate-500">Manage product categories. Add an image and optionally mark as Agriculture.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Add category</h2>
        <form action={createCategory} className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px] flex-1">
            <label htmlFor="cat-name" className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input
              id="cat-name"
              type="text"
              name="name"
              placeholder="e.g. Garden Tools"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>
          <div className="min-w-[200px] flex-1">
            <label htmlFor="cat-image" className="mb-1 block text-sm font-medium text-slate-700">Image (optional)</label>
            <input
              id="cat-image"
              type="file"
              name="image"
              accept="image/*"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-slate-700"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="isAgriculture" className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
            Agriculture module
          </label>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <PlusIcon className="h-4 w-4" />
            Add category
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">All categories</h2>
          <p className="text-sm text-slate-500">{categories.length} total</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Subcategories</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Module</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-medium text-slate-900">{cat.name}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{cat.subCategories.length}</td>
                  <td className="px-5 py-3">
                    {cat.isAgriculture ? (
                      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                        Agriculture
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {categories.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-slate-500">No categories yet. Add one above.</p>
        )}
      </div>
    </div>
  );
}
