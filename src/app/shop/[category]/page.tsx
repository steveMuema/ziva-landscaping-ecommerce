import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryBySlug } from "@/lib/api";
import Breadcrumb from "@/components/Breadcrumb";
import { Suspense } from "react";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { SubCategoryGrid } from "@/components/SubCategoryGrid";
import { SubCategory } from "@/types";
export const dynamic = "force-dynamic";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#166534",
};

/** Normalize URL param to match getCategoryBySlug (handles & and strips invalid chars). */
function slugFromParam(param: string) {
  return param
    .replace(/&/g, "and")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.category?.trim() ?? "";
  const normalizedSlug = slugFromParam(slug);
  const category = await getCategoryBySlug(normalizedSlug);

  if (!category) return { title: "Category Not Found | Ziva Landscaping Co." };

  const title = `${category.name} | Shop | Ziva Landscaping Co.`;
  const description = category.description || `Shop ${category.name} at Ziva Landscaping Co. Eco-friendly outdoor solutions.`;
  const url = process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/shop/${normalizedSlug}` : `https://zivalandscaping.co.ke/shop/${normalizedSlug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: category.imageUrl ? [{ url: category.imageUrl, width: 800, height: 600, alt: category.name }] : undefined,
    }
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.category?.trim() ?? "";

  if (!slug) {
    redirect("/shop");
  }

  const normalizedSlug = slugFromParam(slug);
  if (normalizedSlug === "shop") {
    redirect("/shop");
  }

  const category = await getCategoryBySlug(normalizedSlug);
  if (!category) {
    redirect("/shop");
  }

  const categorySlug = normalizedSlug;
  const categoryName = category.name;

  const sortedSubCategories = category.subCategories.sort((a, b) => a.id - b.id);
  const breadcrumbPath = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    { name: category.name, href: `/shop/${categorySlug}`, isCurrent: true },
  ];
  return (
    <div className="flex flex-col flex-1 min-h-full bg-[var(--background)]">
      <div className="container mx-auto py-8 px-2 sm:px-4 md:px-6 lg:px-8 min-h-[400px] flex-1">
        <div className="mb-6">
          <p className="text-[var(--muted)] text-lg font-medium leading-relaxed font-[family-name:var(--font-quicksand)]">
            {category.description}
          </p>
        </div>
        <Breadcrumb path={breadcrumbPath} />
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-[var(--foreground)] font-[family-name:var(--font-quicksand)]">
          {categoryName}
        </h1>
        <Suspense fallback={<LoadingSkeleton count={category.subCategories.length || 4} />}>
          <SubCategoryGrid subCategories={sortedSubCategories as unknown as SubCategory[]} categoryName={categoryName} />
        </Suspense>
      </div>
    </div>
  );
}