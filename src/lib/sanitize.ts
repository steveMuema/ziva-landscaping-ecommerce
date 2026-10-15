import sanitizeHtml from "sanitize-html";

/** Tags and attributes the TipTap editor (StarterKit + Link + Image) can produce. */
const BLOG_HTML_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6",
    "strong", "b", "em", "i", "u", "s", "code", "pre", "blockquote",
    "ul", "ol", "li", "a", "img",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "class"],
    ol: ["start"],
    code: ["class"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: attribs.target === "_blank" ? { ...attribs, rel: "noopener noreferrer" } : attribs,
    }),
  },
};

/** Strip scripts, event handlers and unsafe URLs from blog post HTML. */
export function sanitizeBlogHtml(html: string): string {
  return sanitizeHtml(html, BLOG_HTML_OPTIONS);
}
