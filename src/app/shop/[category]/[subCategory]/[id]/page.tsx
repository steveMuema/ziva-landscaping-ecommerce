import Footer from "@/components/Footer";
import ProductSection from "@/sections/product.section";
import { ProductProvider } from "@/lib/productContext";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { getProductById } from "@/lib/api";
import { Product } from "@/types";
import { Suspense } from "react";

// Define the expected props structure for Next.js 15 dynamic route
type PageProps = {
  params: Promise<{
    category: string;
    subCategory: string;
    id: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

// Server component to handle product fetching and rendering
async function ProductPageContent({ id, category, subCategory }: { id: string; category: string; subCategory: string }) {
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
        product={product as unknown as Product}
        categoryName={category}
        subCategoryName={subCategory}
      />
      <Footer />
    </>
  );
}

export default async function ProductPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { category, subCategory, id } = resolvedParams;

  return (
    <ProductProvider>
      <CartProvider>
        <WishlistProvider>
          <Suspense
            fallback={
              <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center text-gray-500 py-8">Loading product...</div>
              </div>
            }
          >
            <ProductPageContent id={id} category={category} subCategory={subCategory} />
          </Suspense>
        </WishlistProvider>
      </CartProvider>
    </ProductProvider>
  );
}