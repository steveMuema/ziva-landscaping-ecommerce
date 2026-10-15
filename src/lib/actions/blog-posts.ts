"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireEditor } from "@/lib/admin-auth";
import { audit, diff } from "@/lib/audit";
import { sanitizeBlogHtml } from "@/lib/sanitize";
import { BLOG_SLUG_PATTERN, blogSlug } from "@/lib/slug";

export type BlogFormState = {
    error?: string;
    fieldErrors?: Partial<Record<"title" | "slug" | "publishedAt" | "metaTitle" | "metaDescription", string>>;
};

const MAX_TITLE = 200;
const MAX_META_TITLE = 120;
const MAX_META_DESCRIPTION = 300;

/** Returns the title of another post that already uses `slug` (current or old slug), or null. */
async function findSlugConflict(slug: string, excludeId?: number): Promise<string | null> {
    const other = await prisma.blogPost.findFirst({
        where: {
            OR: [{ slug }, { previousSlugs: { has: slug } }],
            ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
        select: { title: true },
    });
    return other?.title ?? null;
}

/** Create or update a blog post from the editor form. Redirects to the list on success. */
export async function saveBlogPost(_prev: BlogFormState, formData: FormData): Promise<BlogFormState> {
    const user = await requireEditor();

    const idRaw = (formData.get("id") as string) || "";
    const id = idRaw ? parseInt(idRaw, 10) : undefined;
    const title = ((formData.get("title") as string) || "").trim();
    const slug = ((formData.get("slug") as string) || "").trim().toLowerCase() || blogSlug(title);
    const excerpt = ((formData.get("excerpt") as string) || "").trim() || null;
    const content = sanitizeBlogHtml((formData.get("content") as string) || "<p></p>");
    const imageUrl = ((formData.get("imageUrl") as string) || "").trim() || null;
    const tags = ((formData.get("tags") as string) || "").split(",").map((t) => t.trim()).filter(Boolean);
    const metaTitle = ((formData.get("metaTitle") as string) || "").trim() || null;
    const metaDescription = ((formData.get("metaDescription") as string) || "").trim() || null;
    const published = formData.get("published") === "on";
    const publishedAtRaw = ((formData.get("publishedAt") as string) || "").trim();

    const fieldErrors: BlogFormState["fieldErrors"] = {};
    if (!title) fieldErrors.title = "Title is required.";
    else if (title.length > MAX_TITLE) fieldErrors.title = `Keep the title under ${MAX_TITLE} characters.`;
    if (!slug) fieldErrors.slug = "Slug is required.";
    else if (!BLOG_SLUG_PATTERN.test(slug)) fieldErrors.slug = "Use lowercase letters, numbers and single hyphens only (e.g. lawn-care-tips).";
    if (metaTitle && metaTitle.length > MAX_META_TITLE) fieldErrors.metaTitle = `Keep it under ${MAX_META_TITLE} characters.`;
    if (metaDescription && metaDescription.length > MAX_META_DESCRIPTION) fieldErrors.metaDescription = `Keep it under ${MAX_META_DESCRIPTION} characters.`;
    let publishedAt: Date | null = null;
    if (publishedAtRaw) {
        publishedAt = new Date(publishedAtRaw);
        if (isNaN(publishedAt.getTime())) fieldErrors.publishedAt = "Invalid date.";
    }
    if (id !== undefined && isNaN(id)) return { error: "Invalid post id." };

    if (!fieldErrors.slug && slug) {
        const conflict = await findSlugConflict(slug, id);
        if (conflict) fieldErrors.slug = `This slug is already used by “${conflict}”.`;
    }
    if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

    const existing = id ? await prisma.blogPost.findUnique({ where: { id } }) : null;
    if (id && !existing) return { error: "This post no longer exists." };

    if (published && !publishedAt) publishedAt = existing?.publishedAt ?? new Date();

    // Keep the old URL working when a published post's slug changes.
    let previousSlugs = (existing?.previousSlugs ?? []).filter((s) => s !== slug);
    if (existing && existing.slug !== slug && existing.published && !previousSlugs.includes(existing.slug)) {
        previousSlugs = [...previousSlugs, existing.slug];
    }

    const data = {
        title, slug, excerpt, content, imageUrl, tags, metaTitle, metaDescription,
        published, publishedAt, previousSlugs,
    };

    try {
        if (existing) {
            const after = await prisma.blogPost.update({ where: { id: existing.id }, data });
            await audit(user, {
                action: "blog.update", entity: "BlogPost", entityId: existing.id, summary: `Edited post “${title}”`,
                changes: diff(existing, after, ["title", "slug", "published", "publishedAt", "excerpt", "imageUrl", "tags", "metaTitle", "metaDescription"]),
            });
        } else {
            const created = await prisma.blogPost.create({ data });
            await audit(user, { action: "blog.create", entity: "BlogPost", entityId: created.id, summary: `Created post “${title}”` });
        }
    } catch (error) {
        console.error("Failed to save blog post:", error);
        return { error: "Could not save the post. Please try again." };
    }

    revalidatePath("/admin/blog");
    revalidatePath("/admin");
    revalidatePath("/blog");
    revalidatePath(`/blog/${slug}`);
    if (existing && existing.slug !== slug) revalidatePath(`/blog/${existing.slug}`);
    redirect("/admin/blog");
}
