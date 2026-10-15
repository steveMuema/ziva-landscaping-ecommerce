import { z } from "zod";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { DEFAULT_POLICY_UPDATED, DEFAULT_PRIVACY_HTML, DEFAULT_TERMS_HTML } from "@/lib/content-defaults";

/**
 * Editable site content. Each key has a zod schema (validated on save and on read)
 * and a default that matches the site's original hard-coded text, so nothing changes
 * until an admin edits it.
 */

const text = (max: number) => z.string().trim().max(max, `Keep it under ${max} characters`);
const required = (max: number) => text(max).min(1, "Required");
/** Absolute https URL or a site path like /shop/garden. */
const link = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\/\S+$/i.test(v), "Use a full URL (https://…) or a path starting with /");
const image = link.refine((v) => v !== "", "Choose an image");

export const CONTENT_SCHEMAS = {
  announcement: z.object({
    enabled: z.boolean(),
    text: text(200),
    linkUrl: link,
    linkLabel: text(40),
  }),
  "home.slides": z.object({
    slides: z
      .array(
        z.object({
          image,
          link,
          title: required(80),
          description: text(400),
        })
      )
      .min(1, "Add at least one slide")
      .max(12, "Use at most 12 slides"),
  }),
  "home.about": z.object({
    badge: text(40),
    heading: required(120),
    intro: text(600),
    points: z.array(required(400)).max(15, "Use at most 15 points"),
    closing: text(600),
  }),
  "page.company": z.object({
    heroTitle: required(80),
    heroSubtitle: text(300),
    visionHeading: required(80),
    visionText: text(1000),
  }),
  faq: z.object({
    title: required(80),
    intro: text(400),
    items: z
      .array(z.object({ question: required(200), answer: required(2000) }))
      .max(50, "Use at most 50 questions"),
  }),
  "page.privacy": z.object({
    title: required(80),
    lastUpdated: text(40),
    metaDescription: text(300),
    html: z.string().max(100_000),
  }),
  "page.terms": z.object({
    title: required(80),
    lastUpdated: text(40),
    metaDescription: text(300),
    html: z.string().max(100_000),
  }),
} as const;

export type ContentKey = keyof typeof CONTENT_SCHEMAS;

type PolicyContent = { title: string; lastUpdated: string; metaDescription: string; html: string };

/**
 * Shapes of each block. Spelled out (rather than z.infer) because this project's tsconfig
 * isn't strict, which makes zod infer every field as optional.
 */
type ContentTypes = {
  announcement: { enabled: boolean; text: string; linkUrl: string; linkLabel: string };
  "home.slides": { slides: { image: string; link: string; title: string; description: string }[] };
  "home.about": { badge: string; heading: string; intro: string; points: string[]; closing: string };
  "page.company": { heroTitle: string; heroSubtitle: string; visionHeading: string; visionText: string };
  faq: { title: string; intro: string; items: { question: string; answer: string }[] };
  "page.privacy": PolicyContent;
  "page.terms": PolicyContent;
};
export type Content<K extends ContentKey> = ContentTypes[K];

export const CONTENT_KEYS = Object.keys(CONTENT_SCHEMAS) as ContentKey[];

export function isContentKey(value: string): value is ContentKey {
  return value in CONTENT_SCHEMAS;
}

export const CONTENT_INFO: Record<ContentKey, { label: string; description: string; publicPath: string }> = {
  announcement: { label: "Announcement bar", description: "A short message shown above the navbar on every page.", publicPath: "/" },
  "home.slides": { label: "Homepage slides", description: "The category slideshow at the top of the homepage.", publicPath: "/" },
  "home.about": { label: "About section", description: "“About us” on the homepage and company page.", publicPath: "/" },
  "page.company": { label: "Company page", description: "Hero text and vision on the company page.", publicPath: "/company" },
  faq: { label: "FAQ", description: "Questions and answers on the FAQ page.", publicPath: "/faq" },
  "page.privacy": { label: "Privacy policy", description: "The privacy policy page.", publicPath: "/privacy" },
  "page.terms": { label: "Terms of service", description: "The terms of service page.", publicPath: "/terms" },
};

export const CONTENT_DEFAULTS: { [K in ContentKey]: Content<K> } = {
  announcement: { enabled: false, text: "", linkUrl: "", linkLabel: "" },
  "home.slides": {
    slides: [
      {
        image: "/landscape.jpeg",
        link: "/shop/landscaping",
        title: "East Africa's Premier Landscaping",
        description:
          "Landscape design and Sustainability across East Africa. Crafting vibrant eco-friendly outdoor spaces by designing with drought resistant plants, edible landscape and organic practices.",
      },
      {
        image: "/lawn-care.jpg",
        link: "/shop/landscaping/lawn-care-and-lawn-services",
        title: "Lawn Care & Services",
        description: "Top dressing flowers/lawns, Termite treatment, weed treatment, fungal treatment.",
      },
      {
        image: "/Rock Garden.jpg",
        link: "/shop/landscaping/lawn-designs",
        title: "Landscape Designs",
        description: "Design your lawn with unique ideas.",
      },
      {
        image: "/garden.jpg",
        link: "/shop/garden",
        title: "Gardening",
        description:
          "We sell fresh organic fruits,vegetables and herbs from the farm.We practice organic farming avoiding synthetic pesticides & fertilizers. Instead we use natural alternatives to promote soil health, human health and reduce pollution.",
      },
      {
        image: "/furniture.jpg",
        link: "/shop/furniture-and-fittings",
        title: "Furniture & Fittings",
        description:
          "Quality,unique furniture & fittings.Designing with reclaimed Logs/woods,to add unique character to your home interiors and also reduce on waste.",
      },
      {
        image: "/home-decor.jpg",
        link: "/shop/home-decor-and-furnishing",
        title: "Home Decor & Furnishing",
        description:
          "Furnishing your home with beauty creativity,and functionality. Planting and choosing unique plants/herbs that do well indoors, that promote health allowing oxygen and fresh air circulate around your home.",
      },
    ],
  },
  "home.about": {
    badge: "About us",
    heading: "East Africa's Most Trusted Landscaping Experts",
    intro:
      "At Ziva Landscaping Co., we are the premier choice for crafting vibrant, eco-friendly outdoor spaces across East Africa. We achieve this by:",
    points: [
      "Designing with drought resistant plants edible Landscape & Organic Practices.",
      "Using Organic practices and innovative solutions.",
      "Listening to our customers passion and dreams and bringing them to life with exceptional services and attention to detail.",
      "Water conservation:Implementing rain water harvesting systems, drip irrigation and drought resistant plants to minimize water waste.",
      "Recycled material:Incorporating recycled material such us reclaimed wood or repurposed stones, can reduce waste & add unique character to your landscape.",
      "Wildlife-friendly: Creating habitats for local wildlife, like bees butterflies & birds can enhance biodiversity and ecosystem health.e.g. adding Orchards in your landscape.",
      "Minimizing chemical use and opting for natural pest control by planting herbs around your landscape and gardens.",
      "Creating sustainable home by designing your landscape with a garden/orchard, conserving water for irrigation, installation of solar panels. With innovative ideas by listening to our customers wants and needs.",
    ],
    closing:
      "Our goal is to exceed expectations, inspire creativity and make a positive impact on our community and the environment.",
  },
  "page.company": {
    heroTitle: "Ziva Landscaping Co.",
    heroSubtitle:
      "Sustainable living through landscape design: functionality, sustainability, and environment-friendly practices across East Africa.",
    visionHeading: "Our vision",
    visionText:
      "To be the leading provider of sustainable landscaping and eco-friendly outdoor solutions in East Africa—crafting vibrant spaces that promote well-being, conserve resources, and support local ecosystems.",
  },
  faq: {
    title: "Frequently asked questions",
    intro: "",
    items: [],
  },
  "page.privacy": {
    title: "Privacy Policy",
    lastUpdated: DEFAULT_POLICY_UPDATED.privacy,
    metaDescription: "Privacy policy for Ziva Landscaping Co. How we collect, use, and protect your information.",
    html: DEFAULT_PRIVACY_HTML,
  },
  "page.terms": {
    title: "Terms of Service",
    lastUpdated: DEFAULT_POLICY_UPDATED.terms,
    metaDescription: "Terms of service for using Ziva Landscaping Co. website and ordering products.",
    html: DEFAULT_TERMS_HTML,
  },
};

const readBlock = unstable_cache(
  async (key: string): Promise<unknown> => {
    if (!process.env.DATABASE_URL) return null;
    try {
      const row = await prisma.contentBlock.findUnique({ where: { key } });
      return row?.data ?? null;
    } catch {
      return null;
    }
  },
  ["content-block"],
  { tags: ["content"], revalidate: 3600 }
);

/** Saved content for `key`, or its default when nothing (valid) has been saved yet. */
export async function getContent<K extends ContentKey>(key: K): Promise<Content<K>> {
  const stored = await readBlock(key);
  if (stored == null) return CONTENT_DEFAULTS[key];
  const parsed = CONTENT_SCHEMAS[key].safeParse(stored);
  if (!parsed.success) {
    console.error(`Content block “${key}” is invalid; using the default.`, parsed.error.issues);
    return CONTENT_DEFAULTS[key];
  }
  return parsed.data as Content<K>;
}

/** Whether an admin has saved this block (false = the built-in default is showing). */
export async function hasCustomContent(key: ContentKey): Promise<boolean> {
  return (await readBlock(key)) != null;
}
