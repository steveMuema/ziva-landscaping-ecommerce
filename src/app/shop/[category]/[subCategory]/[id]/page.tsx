import Footer from "@/components/Footer";
import ProductSection from "@/sections/product.section";
import { ProductProvider } from "@/lib/productContext";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { getProductById } from "@/lib/api";
import { Product } from "@/types";
import { Suspense } from "react";
import { normalizeSlug, slugToName } from "@/lib/slug";

export const dynamic = "force-dynamic";

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
  const categorySlug = normalizeSlug(category);
  const subCategorySlug = normalizeSlug(subCategory);
  const categoryName = slugToName(categorySlug);
  const subCategoryName = slugToName(subCategorySlug);

  if (!product) {
    return (
      <div className="flex flex-col flex-1 min-h-full bg-[var(--background)]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-[var(--muted)] py-8">Product not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-full bg-[var(--background)]">
      <div className="flex-1">
        <ProductSection
          product={product as unknown as Product}
          categoryName={categoryName}
          subCategoryName={subCategoryName}
          categorySlug={categorySlug}
          subCategorySlug={subCategorySlug}
        />
      </div>
      <Footer />
    </div>
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
              <div className="flex flex-col flex-1 min-h-full bg-[var(--background)] items-center justify-center">
                <div className="text-center text-[var(--muted)] py-8">Loading product...</div>
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