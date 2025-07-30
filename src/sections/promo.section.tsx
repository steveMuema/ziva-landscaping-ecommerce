"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Collection } from "@/types";

const collections: Collection[] = [
  {
    id: 1,
    image: "/landscaping.jpg",
    category: "landscaping",
    alt: "Landscaping",
    description: "Enhance your outdoor space with professional landscaping services.",
  },
  {
    id: 2,
    image: "/garden.jpg",
    category: "garden",
    alt: "Gardening",
    description: "Create a thriving garden with our expert gardening supplies.",
  },
  {
    id: 3,
    image: "/furniture.jpg",
    category: "furniture-and-fittings",
    alt: "Furniture & Fittings",
    description: "Quality furniture and fittings for every room in your house.",
  },
  {
    id: 4,
    image: "/home-decor.jpg",
    category: "home-decor-and-furnishing",
    alt: "Home Décor & Furnishing",
    description: "Transform your home with elegant décor and furnishing options.",
  }
  
];

export default function PromoSection() {
  return (
    <section className="w-full py-4 bg-gray-100">
      <div className="relative w-full max-w-7xl mx-auto">
        <Slideshow collections={collections} />
      </div>
    </section>
  );
}

function Slideshow({ collections }: { collections: Collection[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(-1);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrevIndex(currentIndex);
      setCurrentIndex((prevIndex) =>
        prevIndex === collections.length - 1 ? 0 : prevIndex + 1
      );
    }, 10000); // 10 seconds per slide
    return () => clearInterval(interval);
  }, [collections.length, currentIndex]);

  const imageHeight = 400; // Fixed image height

  return (
    <div className="relative w-full">
      {collections.map((collection, index) => {
        const isActive = index === currentIndex;
        const isExiting = index === prevIndex;

        return (
          <div
            key={collection.id}
            className={`w-full transition-opacity duration-1000 ${
              isActive ? "opacity-100" : "opacity-0 hidden"
            }`}
            style={{
              transition: "opacity 1s ease-out",
            }}
          >
            <div className="flex flex-col md:flex md:flex-row gap-6">
              {/* Image Container (Desktop: Left, Mobile: Top) */}
              <div className="relative w-full md:w-1/2">
                <div
                  className="w-full"
                  style={{
                    height: `${imageHeight}px`,
                    animation: isActive
                      ? "slideInLeft 1s ease-out forwards"
                      : isExiting
                      ? "slideOutLeft 1s ease-out forwards"
                      : "none",
                  }}
                >
                  <Image
                    src={collection.image}
                    alt={collection.alt}
                    className="w-full h-full object-cover"
                    width={800}
                    height={400}
                  />
                </div>
              </div>

              {/* Description Container (Desktop: Right, Mobile: Bottom) */}
              <div
                className="w-full h-full md:w-1/2 flex flex-col p-4 md:p-0"
                // style={{ minHeight: `${imageHeight}px` }}
              >
                <div
                  className="flex flex-col"
                  style={{
                    animation: isActive
                      ? "slideInRight 1s ease-out"
                      : isExiting
                      ? "slideOutRight 1s ease-out"
                      : "none",
                  }}
                >
                  {/* Title Container (Top) */}
                  <div className="mb-4">
                    <h2 className="text-5xl md:text-3xl font-bold text-gray-900 font-[family-name:var(--font-quicksand)]">
                      {collection.alt}
                    </h2>
                  </div>
                  {/* Description and Button Container (Centered in Desktop) */}
                  <div className="flex flex-col justify-center flex-grow">
                    <p className="text-gray-600 mb-6 font-[family-name:var(--font-quicksand)] font-medium">
                      {collection.description}
                    </p>
                    <div>
                      <Link
                        href={`/shop/${collection.category.toLowerCase()}`}
                        className="inline-block bg-emerald-700 text-white px-6 py-3 rounded-md hover:bg-[#044b3b] transition-colors duration-300"
                      >
                        Shop Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}