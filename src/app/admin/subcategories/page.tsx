import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { uploadImage } from "@/lib/cloudinary";

export default async function SubCategoriesPage() {
  const subCategories = await prisma.subCategory.findMany({
    include: { category: true },
  });

  async function createSubCategory(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const categoryId = parseInt(formData.get("categoryId") as string);
    const imageFile = formData.get("image") as File | null;
    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
    }
    await prisma.subCategory.create({ data: { name, categoryId, imageUrl } });
    revalidatePath("/admin/subcategories");
  }

  const categories = await prisma.category.findMany();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Manage Subcategories</h1>
      <form action={createSubCategory} className="mb-4">
        <input
          type="text"
          name="name"
          placeholder="New Subcategory Name"
          className="p-2 border rounded text-gray-800"
          required
        />
        <select name="categoryId" className="ml-2 p-2 border rounded text-gray-800" required>
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <input
          type="file"
          name="image"
          accept="image/*"
          className="p-2 border rounded w-full"
        />
        <button type="submit" className="ml-2 bg-green-600 text-white p-2 rounded">Add</button>
      </form>
      <ul>
        {subCategories.map((sub) => (
          <li key={sub.id} className="mb-2 text-gray-800">
            {sub.name} (Category: {sub.category.name})
          </li>
        ))}
      </ul>
    </div>
  );
}