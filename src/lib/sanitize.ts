import sanitizeHtml from "sanitize-html";

const TEXT_ALIGN = { "text-align": [/^(left|right|center|justify)$/] };
const IMAGE_ALIGNMENTS = new Set(["left", "center", "right", "full"]);
const BLOCKS_WITH_ALIGNMENT = ["p", "h1", "h2", "h3", "h4", "h5", "h6"] as const;

/** Tags and attributes the rich text editor (see RichTextEditor) can produce. */
const BLOG_HTML_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6",
    "strong", "b", "em", "i", "u", "s", "code", "pre", "blockquote",
    "ul", "ol", "li", "a", "img",
    // YouTube embeds: <div data-youtube-video><iframe src="https://www.youtube-nocookie.com/embed/…">
    "div", "iframe",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "title"],
    img: ["src", "alt", "title", "width", "height", "data-align"],
    ol: ["start"],
    code: ["class"],
    div: ["data-youtube-video"],
    iframe: ["src", "width", "height", "title", "allow", "allowfullscreen", "frameborder"],
    ...Object.fromEntries(BLOCKS_WITH_ALIGNMENT.map((tag) => [tag, ["style"]])),
  },
  allowedStyles: Object.fromEntries(BLOCKS_WITH_ALIGNMENT.map((tag) => [tag, TEXT_ALIGN])),
  allowedSchemes: ["http", "https", "mailto", "tel"],
  // data: kept for images in older posts that were pasted before uploads were automatic
  allowedSchemesByTag: { img: ["http", "https", "data"], iframe: ["https"] },
  allowProtocolRelative: false,
  allowedIframeHostnames: ["www.youtube-nocookie.com", "www.youtube.com", "youtube.com"],
  allowIframeRelativeUrls: false,
  transformTags: {
    a: (tagName, attribs) => {
      const next = { ...attribs };
      if (next.target === "_blank") next.rel = "noopener noreferrer";
      else delete next.target;
      return { tagName, attribs: next };
    },
    img: (tagName, attribs) => {
      const next = { ...attribs };
      if (next["data-align"] && !IMAGE_ALIGNMENTS.has(next["data-align"])) delete next["data-align"];
      return { tagName, attribs: next };
    },
  },
  // An iframe whose src was removed (not YouTube) is dropped entirely.
  exclusiveFilter: (frame) => frame.tag === "iframe" && !frame.attribs.src,
};

/** Strip scripts, event handlers, unsafe URLs and non-YouTube embeds from blog/page HTML. */
export function sanitizeBlogHtml(html: string): string {
  return sanitizeHtml(html, BLOG_HTML_OPTIONS);
}
