/** URL helpers for the rich text editor. Pure functions, no DOM. */

export type NormalizedUrl = { ok: true; href: string; external: boolean } | { ok: false; error: string };

/**
 * Turn what an editor typed into a safe link target:
 * - "/shop", "#faq"            → kept as site-relative
 * - "example.com/page"         → https://example.com/page
 * - "name@example.com"         → mailto:name@example.com
 * - "+254 712 345678"          → tel:+254712345678
 * - http(s):, mailto:, tel:    → kept
 * Anything else (javascript:, data:, spaces…) is rejected.
 */
export function normalizeLinkUrl(input: string): NormalizedUrl {
  const value = input.trim();
  if (!value) return { ok: false, error: "Enter a link." };
  if (/\s/.test(value) && !/^\+?[\d\s()-]+$/.test(value)) return { ok: false, error: "Links can't contain spaces." };

  if (value.startsWith("/") || value.startsWith("#")) {
    if (value.startsWith("//")) return { ok: false, error: "Start site links with a single /." };
    return { ok: true, href: value, external: false };
  }
  if (/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/i.test(value)) return { ok: true, href: value, external: false };
  if (/^tel:\+?[\d-]{6,}$/i.test(value)) return { ok: true, href: value, external: false };
  if (/^[^@\s/:]+@[^@\s/]+\.[a-z]{2,}$/i.test(value)) return { ok: true, href: `mailto:${value}`, external: false };
  if (/^\+?[\d\s()-]{7,}$/.test(value)) return { ok: true, href: `tel:${value.replace(/[^\d+]/g, "")}`, external: false };

  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return { ok: false, error: "That doesn't look like a valid link." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, error: "Only web (https://), email and phone links are allowed." };
  }
  if (!url.hostname.includes(".") && url.hostname !== "localhost") {
    return { ok: false, error: "That doesn't look like a valid web address." };
  }
  return { ok: true, href: url.toString(), external: true };
}

/** Whether a link points away from this site (so it should open in a new tab by default). */
export function isExternalHref(href: string, siteOrigin?: string): boolean {
  if (!/^https?:\/\//i.test(href)) return false;
  if (!siteOrigin) return true;
  try {
    return new URL(href).origin !== new URL(siteOrigin).origin;
  } catch {
    return true;
  }
}

/** Extract a YouTube video id from watch, youtu.be, shorts, embed and live URLs. */
export function youtubeVideoId(input: string): string | null {
  const value = input.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "music.youtube.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else {
      const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
      id = m?.[1] ?? null;
    }
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

/** Image URL typed by hand: absolute http(s) or a site path. */
export function normalizeImageUrl(input: string): NormalizedUrl {
  const value = input.trim();
  if (!value) return { ok: false, error: "Enter an image URL." };
  if (value.startsWith("/") && !value.startsWith("//")) return { ok: true, href: value, external: false };
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") return { ok: true, href: url.toString(), external: true };
  } catch {
    /* fall through */
  }
  return { ok: false, error: "Use a full image URL (https://…) or a path starting with /." };
}
