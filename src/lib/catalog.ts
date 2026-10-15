import type { Prisma } from "@prisma/client";

/** Products the storefront may show or sell. Drafts and archived products stay admin-only. */
export const activeProduct = { status: "ACTIVE" } satisfies Prisma.ProductWhereInput;

/** Posts visible to the public: published, with a publish date that is not in the future. */
export function livePost(): Prisma.BlogPostWhereInput {
  return { published: true, publishedAt: { lte: new Date() } };
}
