import Image from "next/image";
import { DEFAULT_BLOG_IMAGE } from "./BlogSidebar";

export function getFeaturedImageUrl(imageUrl: string | null | undefined): string {
  if (imageUrl?.trim()) return imageUrl.trim();
  return DEFAULT_BLOG_IMAGE;
}

export function FeaturedImage({
  src,
  alt,
  className = "",
  priority,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const url = getFeaturedImageUrl(src);
  return (
    <Image
      src={url}
      alt={alt}
      width={800}
      height={450}
      className={className}
      sizes="(max-width: 768px) 100vw, 800px"
      priority={priority}
    />
  );
}
