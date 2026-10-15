import type { Metadata } from "next";

export const SITE_NAME = "Ziva Landscaping Co.";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://zivalandscaping.co.ke";

const DEFAULT_IMAGE = { url: "/ziva_logo.jpg", width: 800, height: 600, alt: "Ziva Landscaping Co. Logo" };

/**
 * Link-preview tags (Open Graph + Twitter) for a page. Next.js replaces rather than merges
 * a parent's `openGraph`/`twitter`, so each page needs the complete set — including the
 * site name and a fallback image — or previews lose them.
 */
export function socialMetadata({
  title,
  description,
  path,
  image,
  imageAlt,
  type = "website",
}: {
  /** Page title without the site name (the root title template adds it to <title>). */
  title: string;
  description: string;
  path: string;
  image?: string | null;
  imageAlt?: string;
  type?: "website" | "article";
}): Pick<Metadata, "openGraph" | "twitter"> {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const images = image ? [{ url: image, alt: imageAlt ?? title }] : [DEFAULT_IMAGE];
  return {
    openGraph: {
      title: fullTitle,
      description,
      url: `${SITE_URL}${path}`,
      siteName: SITE_NAME,
      locale: "en_KE",
      type,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: images.map((i) => i.url),
    },
  };
}
