"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";
import cloudinaryLoader from "@/lib/cloudinaryLoader";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

interface ProductSlideshowSectionProps {
  products: (Product & { subCategory?: { name: string; category?: { name: string } } })[];
}

export default function ProductSlideshowSection({ products }: ProductSlideshowSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  useEffect(() => {
    if (products.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [products.length, isPaused]);

  if (!products.length) return null;

  const product = products[currentIndex];
  const categorySlug = product.subCategory?.category?.name
    ? slugify(product.subCategory.category.name)
    : "shop";
  const subCategorySlug = product.subCategory?.name
    ? slugify(product.subCategory.name)
    : "products";
  const productHref = `/shop/${categorySlug}/${subCategorySlug}/${product.id}`;

  return (
    <section
      className="w-full overflow-hidden"
      aria-roledescription="carousel"
      aria-label="Products — click an image to open that product"
    >
      <div className="relative w-full aspect-[16/9] min-h-[280px] max-h-[520px] bg-[var(--card-bg)]">
        {products.map((p, i) => {
          const catSlug = p.subCategory?.category?.name ? slugify(p.subCategory.category.name) : "shop";
          const subSlug = p.subCategory?.name ? slugify(p.subCategory.name) : "products";
          const href = `/shop/${catSlug}/${subSlug}/${p.id}`;
          const isActive = i === currentIndex;
          return (
            <Link
              key={p.id}
              href={href}
              className={`absolute inset-0 block transition-opacity duration-600 ${
                isActive ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none"
              }`}
              aria-hidden={!isActive}
              aria-current={isActive ? "true" : undefined}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <Image
                src={p.imageUrl || "/image-1.jpg"}
                alt={p.name}
                fill
                className="object-cover"
                sizes="100vw"
                loader={p.imageUrl ? cloudinaryLoader : undefined}
                priority={i === 0}
                fetchPriority={i === 0 ? "high" : "low"}
              />
              <span className="absolute inset-0 bg-black/35 transition-opacity hover:bg-black/25" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 text-white">
                <p className="font-[family-name:var(--font-quicksand)] text-sm uppercase tracking-wider opacity-90">
                  {p.subCategory?.category?.name ?? "Shop"}
                </p>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-[family-name:var(--font-quicksand)] mt-1">
                  {p.name}
                </h2>
                <p className="mt-2 text-lg font-semibold">
                  KSH {p.price.toFixed(0)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {products.length > 1 && (
        <div className="flex items-center justify-center gap-3 py-4 px-4 bg-[var(--background)] border-b border-[var(--card-border)]">
          <button
            type="button"
            onClick={() => goTo((currentIndex - 1 + products.length) % products.length)}
            className="w-10 h-10 rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--foreground)] flex items-center justify-center hover:border-[var(--accent)] transition-colors"
            aria-label="Previous slide"
          >
            <span className="text-lg leading-none">‹</span>
          </button>
          <div className="flex gap-2" role="tablist" aria-label="Slide index">
            {products.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === currentIndex}
                aria-label={`Slide ${i + 1}: ${products[i].name}`}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all ${
                  i === currentIndex
                    ? "w-8 bg-[var(--accent)]"
                    : "w-2 bg-[var(--muted)] hover:bg-[var(--foreground)]"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => goTo((currentIndex + 1) % products.length)}
            className="w-10 h-10 rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--foreground)] flex items-center justify-center hover:border-[var(--accent)] transition-colors"
            aria-label="Next slide"
          >
            <span className="text-lg leading-none">›</span>
          </button>
        </div>
      )}
    </section>
  );
}
