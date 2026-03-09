"use client";
import { motion, useAnimation } from "framer-motion";
import { SubCategory } from "@/types";
import { useEffect, useMemo, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { slugify } from "@/lib/slug";

interface SubCategoryGridProps {
  subCategories: SubCategory[];
  categoryName: string;
}

const SubCategoryGridComponent = ({ subCategories: initialSubCategories, categoryName }: SubCategoryGridProps) => {
  const controls = useAnimation();
  const memoizedSubCategories = useMemo(() => initialSubCategories, [initialSubCategories]);

  useEffect(() => {
    controls.start({ opacity: 1 });
  }, [controls]);

  if (!memoizedSubCategories || memoizedSubCategories.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16">
        <p className="text-[var(--muted)] font-[family-name:var(--font-quicksand)]">Check back soon for more.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 px-2 sm:px-0 min-h-[300px]">
      {memoizedSubCategories.map((subCategory) => {
        // const firstProduct = subCategory.products[0];
        const subCategoryUrl = slugify(subCategory.name);
        const categoryUrl = slugify(categoryName);
        return (
          <motion.div
            key={subCategory.id}
            className="bg-[var(--card-bg)] shadow-md rounded-lg overflow-hidden relative group hover:shadow-lg transition-shadow duration-300 min-h-[200px] border border-[var(--card-border)]"
            initial={{ opacity: 0 }}
            animate={controls}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.3 }}
          >
            <Link href={`/shop/${categoryUrl}/${subCategoryUrl}`}>
              <div className="relative w-full h-32 sm:h-40 md:h-48">
                {subCategory?.imageUrl ? (
                  <Image
                    src={subCategory.imageUrl}
                    alt={subCategory.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full bg-[var(--muted-bg)] flex items-center justify-center">
                    <span className="text-[var(--muted)] text-sm">No Image</span>
                  </div>
                )}
              </div>
              <div className="p-2 sm:p-3 text-center">
                <h3 className="text-base sm:text-sm font-bold text-[var(--foreground)] mb-1 sm:mb-2 font-[family-name:var(--font-quicksand)]">{subCategory.name}</h3>
                <p className="text-base sm:text-sm text-[var(--muted)] mb-2 font-[family-name:var(--font-quicksand)]">
                  {subCategory.products.length} products
                </p>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
};

export const SubCategoryGrid = memo(SubCategoryGridComponent);