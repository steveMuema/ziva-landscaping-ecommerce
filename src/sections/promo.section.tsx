"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Collection } from "@/types";

const collections: Collection[] = [
  {
    id: 1,
    image: "/landscaping.jpg",
    category: "/shop/landscaping",
    alt: "Landscaping",
    description: "Landscape design and Sustainability: Incorporating landscaping with functionality, sustainability and environment friendly. Crafting vibrant eco-friendly outdoor spaces by designing with drought resistant plants, edible landscape and organic practices",
  },
  {
    id: 2,
    image: "/lawn-care.jpg",
    category: "/shop/landscaping/lawn-care-and-lawn-services",
    alt: "Lawn Care & Services",
    description: "Top dressing flowers/lawns, Termite treatment, weed treatment, fungal treatment.",
  },
  {
    id: 3,
    image: "/Rock Garden.jpg",
    category: "/shop/landscaping/lawn-designs",
    alt: "Lawn Designs",
    description: "Design your lawn with unique ideas.",
  },
  {
    id: 4,
    image: "/garden.jpg",
    category: "/shop/garden",
    alt: "Gardening",
    description: "We sell fresh organic fruits,vegetables and herbs from the farm.We practice organic farming avoiding synthetic pesticides & fertilizers. Instead we use natural alternatives to promote soil health, human health and reduce pollution.",
  },
  {
    id: 5,
    image: "/furniture.jpg",
    category: "/shop/furniture-and-fittings",
    alt: "Furniture & Fittings",
    description: "Quality,unique furniture & fittings.Designing with reclaimed Logs/woods,to add unique character to your home interiors and also reduce on waste.",
  },
  {
    id: 6,
    image: "/home-decor.jpg",
    category: "/shop/home-decor-and-furnishing",
    alt: "Home Décor & Furnishing",
    description: "Furnishing your home with beauty creativity,and functionality. Planting and choosing unique plants/herbs that do well indoors, that promote health allowing oxygen and fresh air circulate around your home.",
  }
  
];

export default function PromoSection() {
  return (
    <section className="w-full py-4 bg-white">
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
                        href={collection.category}
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