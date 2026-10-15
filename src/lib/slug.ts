/**
 * Slugify a display name for use in URLs.
 * Replaces "&" with "-and-" so URLs never contain "&" (which breaks navigation).
 */
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s*&\s*/g, "-and-")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

/**
 * Convert a URL slug back to a display name (e.g. for API lookup or breadcrumbs).
 * Treats "-and-" in the slug as " & " in the display name.
 */
export function slugToName(slug: string): string {
  if (!slug.trim()) return "";
  const withSpaces = slug.replace(/-/g, " ");
  const withAmpersand = withSpaces.replace(/\b and \b/gi, " & ");
  return withAmpersand
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Normalize a slug from URL params (e.g. "lawn-seed-&-feed") to a safe slug ("lawn-seed-and-feed").
 */
export function normalizeSlug(slug: string): string {
  return slug.replace(/&/g, "and").replace(/\s+/g, "-").toLowerCase();
}

/** Valid blog post slug: lowercase letters, digits and single hyphens. */
export const BLOG_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Build a blog post slug from a title (e.g. "Lawn Care 101!" → "lawn-care-101"). */
export function blogSlug(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Category and subcategory names become URLs via slugify() and are looked up again
 * via slugToName(), so only characters that survive that round trip are allowed.
 */
export function catalogNameError(name: string): string | null {
  if (!name) return "Name is required.";
  if (name.length > 80) return "Keep the name under 80 characters.";
  if (!/^[A-Za-z0-9][A-Za-z0-9 &]*$/.test(name)) {
    return "Use only letters, numbers, spaces and & (other characters break the shop URLs).";
  }
  return null;
}
