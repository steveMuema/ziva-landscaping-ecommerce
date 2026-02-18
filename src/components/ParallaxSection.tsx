"use client";

import Image from "next/image";
import cloudinaryLoader from "@/lib/cloudinaryLoader";

const DEFAULT_IMAGE = "/landscape.jpeg";

/** Min height of the section (viewport units) */
const SECTION_MIN_HEIGHT_VH = 42;

type ParallaxSectionProps = {
  imageUrl: string;
  /** Optional overlay opacity 0–1 (darkens image so text is readable). */
  overlayOpacity?: number;
  /** Optional headline shown over the image. */
  headline?: string;
  /** Optional subline. */
  subline?: string;
};

/** Hero section with a static background image (no scroll parallax). */
export function ParallaxSection({
  imageUrl,
  overlayOpacity = 0.4,
  headline,
  subline,
}: ParallaxSectionProps) {
  const url = (imageUrl || DEFAULT_IMAGE).trim() || DEFAULT_IMAGE;
  const useCloudinary = url.startsWith("https://res.cloudinary.com");
  const isLocal = url.startsWith("/");

  return (
    <section
      className="relative overflow-hidden bg-[var(--card-bg)]"
      style={{ minHeight: `${SECTION_MIN_HEIGHT_VH}vh` }}
      aria-label="Hero banner"
    >
      <div className="absolute inset-0">
        {!isLocal && !useCloudinary ? (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${url})` }}
          />
        ) : (
          <Image
            src={url}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority={false}
            loader={useCloudinary ? cloudinaryLoader : undefined}
          />
        )}
      </div>
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
        aria-hidden
      />
      <div
        className="relative z-20 flex min-h-[42vh] flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.25) 100%)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        {headline && (
          <h2 className="text-3xl font-bold text-white drop-shadow-lg sm:text-4xl md:text-5xl font-[family-name:var(--font-quicksand)]" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
            {headline}
          </h2>
        )}
        {subline && (
          <p className="mt-4 max-w-2xl text-lg text-white/95 drop-shadow-lg sm:text-xl font-[family-name:var(--font-quicksand)]" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.4)" }}>
            {subline}
          </p>
        )}
      </div>
    </section>
  );
}
