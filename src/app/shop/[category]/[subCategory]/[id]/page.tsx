import Footer from "@/components/Footer";
import ProductSection from "@/sections/product.section";
import { ProductProvider } from "@/lib/productContext";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { getProductById } from "@/lib/api";
import { Product } from "@/types";
import { Suspense } from "react";

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
        product={product as Product}
        categoryName={category}
        subCategoryName={subCategory}
      />
      <Footer />
    </>
  );
}

export default async function ProductPage({ params }: { params: { category: string; subCategory: string; id: string } }) {
  const { category, subCategory, id } = await params;

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