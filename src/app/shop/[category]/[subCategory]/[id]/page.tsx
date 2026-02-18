import type { Metadata } from "next";
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

type PageProps = {
  params: Promise<{
    category: string;
    subCategory: string;
    id: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zivalandscaping.co.ke";
const siteName = "Ziva Landscaping Co.";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, category, subCategory } = await params;
  const product = await getProductById(id);
  if (!product) {
    return { title: `Product not found | ${siteName}` };
  }
  const title = `${product.name} | ${siteName}`;
  const description =
    (product.description?.trim() && product.description.length > 160)
      ? product.description.slice(0, 157) + "..."
      : (product.description?.trim() ?? `Shop ${product.name} at ${siteName}. Sustainable landscaping and eco-friendly outdoor solutions.`);
  const canonicalUrl = `${baseUrl}/shop/${encodeURIComponent(category)}/${encodeURIComponent(subCategory)}/${id}`;
  const images = product.imageUrl
    ? [{ url: product.imageUrl, width: 1200, height: 630, alt: product.name }]
    : [];
  return {
    title,
    description,
    openGraph: {
      title: product.name,
      description,
      url: canonicalUrl,
      siteName,
      type: "website",
      images,
      locale: "en_KE",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: product.imageUrl ? [product.imageUrl] : undefined,
    },
    alternates: { canonical: canonicalUrl },
  };
}

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