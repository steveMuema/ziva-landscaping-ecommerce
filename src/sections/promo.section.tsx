"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Collection } from "@/types";

const collections: Collection[] = [
  {
    id: 1,
    image: "/landscape.jpeg",
    category: "/shop/landscaping",
    alt: "Landscaping",
    description:
      "Landscape design and Sustainability: Incorporating landscaping with functionality, sustainability and environment friendly. Crafting vibrant eco-friendly outdoor spaces by designing with drought resistant plants, edible landscape and organic practices",
  },
  {
    id: 2,
    image: "/lawn-care.jpg",
    category: "/shop/landscaping/lawn-care-and-lawn-services",
    alt: "Lawn Care & Services",
    description:
      "Top dressing flowers/lawns, Termite treatment, weed treatment, fungal treatment.",
  },
  {
    id: 3,
    image: "/Rock Garden.jpg",
    category: "/shop/landscaping/lawn-designs",
    alt: "Landscape Designs",
    description: "Design your lawn with unique ideas.",
  },
  {
    id: 4,
    image: "/garden.jpg",
    category: "/shop/garden",
    alt: "Gardening",
    description:
      "We sell fresh organic fruits,vegetables and herbs from the farm.We practice organic farming avoiding synthetic pesticides & fertilizers. Instead we use natural alternatives to promote soil health, human health and reduce pollution.",
  },
  {
    id: 5,
    image: "/furniture.jpg",
    category: "/shop/furniture-and-fittings",
    alt: "Furniture & Fittings",
    description:
      "Quality,unique furniture & fittings.Designing with reclaimed Logs/woods,to add unique character to your home interiors and also reduce on waste.",
  },
  {
    id: 6,
    image: "/home-decor.jpg",
    category: "/shop/home-decor-and-furnishing",
    alt: "Home Décor & Furnishing",
    description:
      "Furnishing your home with beauty creativity,and functionality. Planting and choosing unique plants/herbs that do well indoors, that promote health allowing oxygen and fresh air circulate around your home.",
  },
];

const AUTOPLAY_INTERVAL_MS = 6500;
const PROMO_MIN_HEIGHT_VH = 52; // ~half the viewport or more

const textStagger = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 + i * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export default function PromoSection() {
  return (
    <section
      className="w-full bg-[var(--background)]"
      aria-label="Collections by category"
      style={{ minHeight: `${PROMO_MIN_HEIGHT_VH}vh` }}
    >
      <div className="relative w-full max-w-7xl mx-auto h-full">
        <Slideshow collections={collections} />
      </div>
    </section>
  );
}

function Slideshow({ collections }: { collections: Collection[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    skipSnaps: false,
    duration: 28,
    startIndex: 0,
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => emblaApi.scrollNext(), AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [emblaApi]);

  return (
    <div className="relative w-full h-full" style={{ minHeight: `${PROMO_MIN_HEIGHT_VH}vh` }}>
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full touch-pan-y" style={{ backfaceVisibility: "hidden" }}>
          {collections.map((collection, index) => (
            <Slide
              key={collection.id}
              collection={collection}
              isActive={index === selectedIndex}
              priority={index === 0}
            />
          ))}
        </div>
      </div>

      {collections.length > 1 && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 md:w-14 md:h-14 rounded-full bg-black/35 hover:bg-black/55 text-white flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 hover:scale-110 active:scale-95"
            aria-label="Previous slide"
          >
            <span className="text-2xl md:text-3xl font-light leading-none">‹</span>
          </button>
          <button
            type="button"
            onClick={scrollNext}
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 md:w-14 md:h-14 rounded-full bg-black/35 hover:bg-black/55 text-white flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 hover:scale-110 active:scale-95"
            aria-label="Next slide"
          >
            <span className="text-2xl md:text-3xl font-light leading-none">›</span>
          </button>
          <div
            className="absolute bottom-4 left-0 right-0 flex justify-center gap-2.5 z-10"
            role="tablist"
            aria-label="Slide index"
          >
            {collections.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === selectedIndex}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => scrollTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === selectedIndex
                    ? "w-10 bg-[var(--accent)] shadow-md"
                    : "w-2 bg-white/60 hover:bg-white/90 hover:scale-110"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Slide({
  collection,
  isActive,
  priority,
}: {
  collection: Collection;
  isActive: boolean;
  priority: boolean;
}) {
  return (
    <div className="relative flex-[0_0_100%] min-w-0 h-full" aria-hidden={!isActive}>
      <div
        className="flex flex-col md:flex-row w-full h-full min-h-[55vh] md:min-h-[58vh]"
        style={{ minHeight: `${PROMO_MIN_HEIGHT_VH}vh` }}
      >
        {/* Image — left on desktop, top on mobile */}
        <div className="relative w-full md:w-1/2 min-h-[36vh] md:min-h-[58vh] shrink-0 overflow-hidden">
          <motion.div
            className="absolute inset-0"
            initial={false}
            animate={{
              scale: isActive ? 1 : 1.05,
              opacity: isActive ? 1 : 0.92,
            }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Image
              src={collection.image}
              alt={collection.alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={priority}
            />
            <div
              className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/20 via-transparent to-transparent pointer-events-none"
              aria-hidden
            />
          </motion.div>
        </div>

        {/* Text — right on desktop, bottom on mobile */}
        <div className="flex flex-col justify-center w-full md:w-1/2 py-8 px-6 sm:py-10 sm:px-8 md:py-12 md:px-14 lg:px-16 bg-[var(--card-bg)] border-t md:border-t-0 md:border-l border-[var(--card-border)]">
          <motion.div
            className="flex flex-col"
            initial="hidden"
            animate={isActive ? "visible" : "hidden"}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.08, delayChildren: 0.05 },
              },
            }}
          >
            <motion.h2
              variants={textStagger}
              custom={0}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--foreground)] font-[family-name:var(--font-quicksand)] mb-4 md:mb-6 leading-tight"
            >
              {collection.alt}
            </motion.h2>
            <motion.p
              variants={textStagger}
              custom={1}
              className="text-[var(--muted)] text-base sm:text-lg md:text-xl mb-6 md:mb-8 font-[family-name:var(--font-quicksand)] leading-relaxed max-w-xl"
            >
              {collection.description}
            </motion.p>
            <motion.div variants={textStagger} custom={2}>
              <Link
                href={collection.category}
                className="group inline-flex items-center gap-2 bg-[var(--accent)] text-white px-8 py-4 rounded-lg hover:opacity-95 transition-all duration-300 font-semibold font-[family-name:var(--font-quicksand)] text-base sm:text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              >
                Shop Now
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
                  →
                </span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
