import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSubCategoryByNames } from "@/lib/api";
import Breadcrumb from "@/components/Breadcrumb";
import { Suspense } from "react";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { ProductGridWithProviders } from "@/components/ProductGrid";
import { Product } from "@/types";
import { ProductProvider } from "@/lib/productContext";
import { slugToName, normalizeSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#166534",
};

export async function generateMetadata({ params }: { params: Promise<{ category: string; subCategory: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const normalizedCategorySlug = normalizeSlug(resolvedParams.category ?? "");
  const normalizedSubCategorySlug = normalizeSlug(resolvedParams.subCategory ?? "");
  const categoryName = slugToName(normalizedCategorySlug);
  const subCategoryName = slugToName(normalizedSubCategorySlug);

  const subCategory = await getSubCategoryByNames(categoryName, subCategoryName);
  if (!subCategory) return { title: "Not Found | Ziva Landscaping Co." };

  const title = `${subCategory.name} | ${categoryName} | Ziva Landscaping Co.`;
  const description = subCategory.description || `Shop ${subCategory.name} products in ${categoryName} at Ziva Landscaping Co.`;
  const url = process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/shop/${normalizedCategorySlug}/${normalizedSubCategorySlug}` : `https://zivalandscaping.co.ke/shop/${normalizedCategorySlug}/${normalizedSubCategorySlug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: subCategory.imageUrl ? [{ url: subCategory.imageUrl, width: 800, height: 600, alt: subCategory.name }] : undefined,
    }
  };
}

export default async function SubCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string; subCategory: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await both params and searchParams
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const normalizedCategorySlug = normalizeSlug(resolvedParams.category ?? "");
  const normalizedSubCategorySlug = normalizeSlug(resolvedParams.subCategory ?? "");
  const categoryName = slugToName(normalizedCategorySlug);
  const subCategoryName = slugToName(normalizedSubCategorySlug);
  const tag = typeof resolvedSearchParams.tag === "string" ? resolvedSearchParams.tag : undefined;

  if (!categoryName.trim() || !subCategoryName.trim()) {
    redirect("/shop");
  }

  const subCategory = await getSubCategoryByNames(categoryName, subCategoryName, tag);

  // Sort according to id in ascending order
  const sortedSubCategoryProducts = subCategory?.products.sort((a, b) => a.id - b.id) || [];

  if (!subCategory) {
    redirect(`/shop/${normalizedCategorySlug}`);
  }

  const breadcrumbPath = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    { name: subCategory.category.name, href: `/shop/${normalizedCategorySlug}` },
    {
      name: subCategory.name,
      href: `/shop/${normalizedCategorySlug}/${normalizedSubCategorySlug}`,
      isCurrent: !tag, // Current only if no tag is selected
    },
    ...(tag ? [{ name: tag, href: `#`, isCurrent: true }] : []), // Add tag to breadcrumb if present
  ];

  return (
    <ProductProvider>
      <div className="flex flex-col flex-1 min-h-full bg-[var(--background)]">
        <div className="container mx-auto py-8 px-2 sm:px-4 md:px-6 lg:px-8 flex-1">
          <div className="mb-6">
            <p className="text-[var(--muted)] text-lg font-medium leading-relaxed font-[family-name:var(--font-quicksand)]">
              {subCategory.description}
            </p>
          </div>
          <Breadcrumb path={breadcrumbPath} />
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-[var(--foreground)] font-[family-name:var(--font-quicksand)]">
            {subCategory.name}{tag ? ` - ${tag}` : ""}
          </h1>
          <Suspense fallback={<LoadingSkeleton count={subCategory.products.length || 4} />}>
            <ProductGridWithProviders
              products={sortedSubCategoryProducts as unknown as Product[]}
              categoryName={categoryName}
              subCategoryName={subCategoryName}
              categorySlug={normalizedCategorySlug}
              subCategorySlug={normalizedSubCategorySlug}
            />
          </Suspense>
        </div>
      </div>
    </ProductProvider>
  );
}