import { getSubCategoryByNames } from "@/lib/api";
import Breadcrumb from "@/components/Breadcrumb";
import { Suspense } from "react";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { ProductGridWithProviders } from "@/components/ProductGrid";
import NavigationBar from "@/components/navbar";
import { Product } from "@/types";
import Footer from "@/components/Footer";

// Function to capitalize first letter of each word
const capitalizeWords = (str: string) => {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const revalidate = 60; // Updated to 60 seconds for better caching

export default async function SubCategoryPage({
  params,
}: {
  params: Promise<{ category: string; subCategory: string }>;
}) {
  // Await the params Promise
  const resolvedParams = await params;
  console.log("Resolved Params (raw):", resolvedParams); // Debug raw params

  const categoryName = resolvedParams.category
    ? capitalizeWords(resolvedParams.category.replace(/-/g, ' '))
    : "";
  const subCategoryName = resolvedParams.subCategory
    ? capitalizeWords(resolvedParams.subCategory.replace(/-/g, ' '))
    : "";
  console.log("Derived Names - categoryName:", categoryName, "subCategoryName:", subCategoryName); // Debug derived names

  if (!categoryName.trim() || !subCategoryName.trim()) {
    console.error("Invalid names detected - categoryName:", categoryName, "subCategoryName:", subCategoryName);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500 py-8">Invalid category or subcategory</div>
      </div>
    );
  }

  const subCategory = await getSubCategoryByNames(categoryName, subCategoryName);
  console.log("SubCategory fetched:", subCategory); // Debug API response
  
  // Sort according to id in ascending order
  const sortedSubCategoryProducts = subCategory.products.sort((a, b) => a.id - b.id);

  if (!subCategory) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-gray-500 py-8">Subcategory not found</div>
      </div>
    );
  }

  const breadcrumbPath = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    { name: subCategory.category.name, href: `/shop/${resolvedParams.category.toLowerCase().replace(/\s+/g, '-')}` },
    { name: subCategory.name, href: `/shop/${resolvedParams.category.toLowerCase().replace(/\s+/g, '-')}/${resolvedParams.subCategory.toLowerCase().replace(/\s+/g, '-')}` },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <NavigationBar />
      <main className="flex-grow">
        <div className="container mx-auto py-8 px-2 sm:px-4 md:px-6 lg:px-8">
          <Breadcrumb path={breadcrumbPath} />
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-gray-900 font-[family-name:var(--font-quicksand)]">
            {subCategory.name} Products
          </h1>
          <Suspense
            fallback={<LoadingSkeleton count={subCategory.products.length || 4} />}
          >
            <ProductGridWithProviders
              products={sortedSubCategoryProducts as Product[]}
              categoryName={categoryName}
              subCategoryName={subCategoryName}
            />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}