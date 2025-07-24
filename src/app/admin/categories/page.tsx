import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { uploadImage } from "@/lib/cloudinary";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { subCategories: true },
  });

  async function createCategory(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const imageFile = formData.get("image") as File | null;
    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
    }
    await prisma.category.create({ data: { name, imageUrl } });
    revalidatePath("/admin/categories");
  }

  return (
    <div>
      <h1 className="text-2xl text-gray-800 font-bold mb-4">Manage Categories</h1>
      <form action={createCategory} className="mb-4">
        <input
          type="text"
          name="name"
          placeholder="New Category Name"
          className="p-2 border rounded text-gray-800"
          required
        />
         <input
          type="file"
          name="image"
          accept="image/*"
          className="p-2 border rounded w-full text-gray-800"
        />
        <button type="submit" className="ml-2 bg-green-600 text-white p-2 rounded">Add</button>
      </form>
      <ul>
        {categories.map((cat) => (
          <li key={cat.id} className="mb-2 text-gray-800">
            {cat.name} ({cat.subCategories.length} subcategories)
          </li>
        ))}
      </ul>
    </div>
  );
}