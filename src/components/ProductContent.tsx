"use server"
import Footer from "@/components/Footer";
import ProductSection from "@/sections/product.section";
import { getProductById } from "@/lib/api";
import { Product } from "@/types";
// Server component for fetching product data
export async function ProductContent({
  id,
  category,
  subCategory,
}: {
  id: string;
  category: string;
  subCategory: string;
}) {
 

  const product = await getProductById(id);

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-gray-500 py-8">Product not found</div>
      </div>
    );
  }

  return (
    <>
      <ProductSection
        product={product as Product}
        categoryName={category}
        subCategoryName={subCategory}
      />
      <Footer />
    </>
  );
}