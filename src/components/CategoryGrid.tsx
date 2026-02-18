"use client";
import { motion, useAnimation } from "framer-motion";
import { Category } from "@/types";
import { useEffect, useMemo, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import cloudinaryLoader from "@/lib/cloudinaryLoader";
import { slugify } from "@/lib/slug";

interface CategoryGridProps {
  categories: Category[];
}

const CategoryGridComponent = ({ categories: initialCategories }: CategoryGridProps) => {
  const controls = useAnimation();
  const memoizedCategories = useMemo(() => initialCategories, [initialCategories]);

  useEffect(() => {
    controls.start({ opacity: 1 });
  }, [controls]);

  if (!memoizedCategories || memoizedCategories.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16">
        <p className="text-[var(--muted)] font-[family-name:var(--font-quicksand)]">Shop is being updated. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 px-2 sm:px-0 min-h-[300px]">
      {memoizedCategories.map((category) => {
        const totalSubcategories = category.subCategories.length;
        return (
          <motion.div
            key={category.id}
            className="bg-[var(--card-bg)] shadow-md rounded-lg overflow-hidden relative group hover:shadow-lg transition-shadow duration-300 min-h-[200px] border border-[var(--card-border)]"
            initial={{ opacity: 0 }}
            animate={controls}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.3 }}
          >
            <Link href={`/shop/${slugify(category.name)}`}>
              <div className="relative w-full h-32 sm:h-40 md:h-48">
                  {category.imageUrl ? (
                      <Image
                        src={category.imageUrl}
                        alt={category.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                        loader={category.imageUrl?.startsWith("https://res.cloudinary.com") ? cloudinaryLoader : undefined} 
                      />
                    ) : (
<div className="w-full h-full bg-[var(--muted-bg)] flex items-center justify-center">
                    <span className="text-[var(--muted)] text-sm">No Image</span>
                      </div>
                    )}
              </div>
              <div className="p-2 sm:p-3 text-center">
                <h3 className="text-base sm:text-sm font-bold text-[var(--foreground)] mb-1 sm:mb-2 font-[family-name:var(--font-quicksand)]">{category.name}</h3>
                <p className="text-base sm:text-sm text-[var(--muted)] mb-2 font-[family-name:var(--font-quicksand)]">
                  {totalSubcategories} Categories
                </p>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
};

export const CategoryGrid = memo(CategoryGridComponent);