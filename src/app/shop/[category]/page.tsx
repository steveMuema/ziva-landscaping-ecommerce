import { redirect } from "next/navigation";
import Link from "next/link";
import { getCategoryBySlug } from "@/lib/api";
import Breadcrumb from "@/components/Breadcrumb";
import { Suspense } from "react";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { SubCategoryGrid } from "@/components/SubCategoryGrid";
import { SubCategory } from "@/types";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

function slugFromParam(param: string) {
  return param.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.category?.trim() ?? "";

  if (!slug) {
    return <div className="text-center text-gray-500 py-8">Invalid category</div>;
  }

  const normalizedSlug = slugFromParam(slug);
  if (normalizedSlug === "shop") {
    redirect("/shop");
  }

  const category = await getCategoryBySlug(normalizedSlug);
  if (!category) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center px-4 py-12">
        <p className="text-lg text-[var(--muted)] mb-6">Category not found.</p>
        <Link
          href="/shop"
          className="text-[var(--accent)] font-medium hover:underline"
        >
          Browse all categories →
        </Link>
      </div>
    );
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
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container mx-auto py-8 px-2 sm:px-4 md:px-6 lg:px-8 min-h-[400px]">
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
          <SubCategoryGrid subCategories={sortedSubCategories as SubCategory[]} categoryName={categoryName} />
        </Suspense>
      </div>
      <Footer/>
    </div>
  );
}