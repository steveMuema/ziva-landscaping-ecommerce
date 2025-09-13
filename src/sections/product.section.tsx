"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Product } from "@/types";
import Breadcrumb from "@/components/Breadcrumb";
import cloudinaryLoader from "@/lib/cloudinaryLoader";
import ProductActions from "@/components/ProductActions";
import { useCart } from "@/lib/cart";

interface ProductSectionProps {
  product: Product;
  categoryName: string;
  subCategoryName: string;
}

const ProductSection = ({ product, categoryName, subCategoryName }: ProductSectionProps) => {
  const { items } = useCart();
  const [quantity, setQuantity] = useState(() => {
    if (typeof window === "undefined") return 1;
    try {
      const storedQuantities = localStorage.getItem("cartQuantities");
      const quantities = storedQuantities ? JSON.parse(storedQuantities) : {};
      return quantities[product.id] || 1;
    } catch (error) {
      console.error("Error parsing cartQuantities from localStorage:", error);
      return 1;
    }
  });

  // Sync quantity with cart.items
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedQuantities = localStorage.getItem("cartQuantities");
        const quantities = storedQuantities ? JSON.parse(storedQuantities) : {};
        if (!items.some(item => item.id === product.id)) {
          delete quantities[product.id];
          localStorage.setItem("cartQuantities", JSON.stringify(quantities));
          console.log(`Removed quantity for product ${product.id} from cartQuantities (not in cart)`);
        } else {
          quantities[product.id] = quantity;
          localStorage.setItem("cartQuantities", JSON.stringify(quantities));
          console.log(`Saved quantity ${quantity} for product ${product.id} to cartQuantities`);
        }
      } catch (error) {
        console.error("Error syncing cartQuantities:", error);
      }
    }
  }, [quantity, product.id, items]);

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => {
      const newQuantity = prev + delta;
      if (newQuantity < 1) return 1;
      if (newQuantity > product.stock) return product.stock;
      return newQuantity;
    });
  };

  const breadcrumbPath = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    {
      name: capitalizeWords(categoryName.replace(/-/g, " ")),
      href: `/shop/${categoryName.toLowerCase().replace(/\s+/g, "-")}`,
    },
    {
      name: capitalizeWords(subCategoryName.replace(/-/g, " ")),
      href: `/shop/${categoryName.toLowerCase().replace(/\s+/g, "-")}/${subCategoryName
        .toLowerCase()
        .replace(/\s+/g, "-")}`,
    },
    { name: product.name, href: "#", isCurrent: true },
  ];

  function capitalizeWords(str: string) {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  // Split description into paragraphs based on newlines or three spaces after a period
  const descriptionParagraphs = product.description
    ? product.description
        .split(/\n|.\s\s\s/)
        .filter((line) => line.trim() !== "")
        .map((line) => line.replace(/^.\s\s\s/, "")) // Remove leading period and spaces if split on them
    : ["No description available."];

  return (
    <div className="bg-white mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb path={breadcrumbPath} />
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        <div className="space-y-8 w-full lg:w-1/2 order-2 lg:order-1">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4 font-[family-name:var(--font-quicksand)]">
              {product.name}
            </h1>
            <div className="flex items-center space-x-4 mb-6">
              <span className="text-2xl font-bold text-gray-900">
                Kshs. {product.price.toFixed(2)}
              </span>
            </div>
            <div className="mb-6">
              {descriptionParagraphs.map((paragraph, index) => (
                <p key={index} className="text-gray-600 leading-relaxed mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
            <div className="mb-6">
                <p className="text-gray-600 leading-relaxed mb-4">
                  {product.tags.join(", ") }
                </p>
            </div>
            <div className="flex items-center space-x-2 mb-8">
              {product.stock > 0 ? (
                <>
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-green-600 font-medium">
                    in stock and ready to ship
                  </span>
                </>
              ) : (
                <span className="text-red-600 font-medium">Out of stock</span>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="w-10 h-10 flex items-center justify-center bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                  aria-label="Decrease quantity"
                >
                  <span className="text-xl">-</span>
                </button>
                <span className="text-lg font-medium w-12 text-gray-900 text-center">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock}
                  className="w-10 h-10 flex items-center justify-center bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                  aria-label="Increase quantity"
                >
                  <span className="text-xl">+</span>
                </button>
              </div>
              <ProductActions productId={product.id} stock={product.stock} quantity={quantity} />
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-gray-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">Quality Guaranteed</span>
              </div>
            </div>
          </div>
        </div>
        <div className="relative w-full lg:w-1/2 order-1 lg:order-2">
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden shadow-lg">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                loader={cloudinaryLoader}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-sm">No Image</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSection;
