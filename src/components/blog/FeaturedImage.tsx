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
    <img
      src={url}
      alt={alt}
      className={className}
      {...(priority ? { fetchPriority: "high" as const } : {})}
    />
  );
}
