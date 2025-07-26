import { getSubCategoryByNames } from "@/lib/api";
import Breadcrumb from "@/components/Breadcrumb";
import { Suspense } from "react";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import {ProductGridWithProviders} from "@/components/ProductGrid";
import NavigationBar from "@/components/navbar";
import { Product } from "@/types";

// Function to capitalize first letter of each word
const capitalizeWords = (str: string) => {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const revalidate = 10;

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
    console.log("Invalid names detected - categoryName:", categoryName, "subCategoryName:", subCategoryName);
    return <div className="text-center text-gray-500 py-8">Invalid category or subcategory</div>;
  }

  const subCategory = await getSubCategoryByNames(categoryName, subCategoryName);
  console.log("SubCategory fetched:", subCategory); // Debug API response
  if (!subCategory) {
    return <div className="text-center text-gray-500 py-8">Subcategory not found</div>;
  }

  const breadcrumbPath = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    { name: subCategory.category.name, href: `/shop/${resolvedParams.category.toLowerCase().replace(/\s+/g, '-')}` },
    { name: subCategory.name, href: `/shop/${resolvedParams.category.toLowerCase().replace(/\s+/g, '-')}/${resolvedParams.subCategory.toLowerCase().replace(/\s+/g, '-')}` },
  ];
  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />
      <div className="container mx-auto py-4 px-2 sm:px-4 md:px-6 lg:px-8 min-h-[400px]">
        <Breadcrumb path={breadcrumbPath} />
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-gray-900">
          {subCategory.name} Products
        </h1>
        <Suspense fallback={<LoadingSkeleton count={subCategory.products.length || 4} />}>
          <ProductGridWithProviders products={subCategory.products as Product[]} />
        </Suspense>
      </div>
    </div>
  );
}