/**
 * Slugify a display name for use in URLs.
 * Replaces "&" with "-and-" so URLs never contain "&" (which breaks navigation).
 */
export function slugify(name: string): string {
  return name
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
