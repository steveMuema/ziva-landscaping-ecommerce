import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { uploadImage } from "@/lib/cloudinary";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    include: { subCategory: { include: { category: true } } },
  });

  async function createProduct(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const stock = parseInt(formData.get("stock") as string);
    const subCategoryId = parseInt(formData.get("subCategoryId") as string);
    const imageFile = formData.get("image") as File | null;
    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
    }
    await prisma.product.create({
      data: { name, description, price, stock, subCategoryId, imageUrl },
    });
    revalidatePath("/admin/products");
  }

  const subCategories = await prisma.subCategory.findMany({ include: { category: true } });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Manage Products</h1>
      <form action={createProduct} className="mb-4 space-y-2">
        <input
          type="text"
          name="name"
          placeholder="Product Name"
          className="p-2 border rounded w-full text-gray-800"
          required
        />
        <input
          type="text"
          name="description"
          placeholder="Description"
          className="p-2 border rounded w-full text-gray-800"
        />
        <input
          type="number"
          name="price"
          placeholder="Price"
          step="0.01"
          className="p-2 border rounded w-full text-gray-800"
          required
        />
        <input
          type="number"
          name="stock"
          placeholder="Stock"
          className="p-2 border rounded w-full text-gray-800"
          required
        />
        <input
          type="file"
          name="image"
          accept="image/*"
          className="p-2 border rounded w-full"
        />
        <select name="subCategoryId" className="p-2 border rounded w-full text-gray-800" required>
          <option value="">Select Subcategory</option>
          {subCategories.map((sub) => (
            <option key={sub.id} value={sub.id} className="text-gray-800">
              {sub.category.name} {">"} {sub.name}
            </option>
          ))}
        </select>
        <button type="submit" className="bg-green-600 text-white p-2 rounded">Add</button>
      </form>
      <ul>
        {products.map((prod) => (
          <li key={prod.id} className="mb-2">
            {prod.name} (Subcategory: {prod.subCategory.name}, Category: {prod.subCategory.category.name})
          </li>
        ))}
      </ul>
    </div>
  );
}