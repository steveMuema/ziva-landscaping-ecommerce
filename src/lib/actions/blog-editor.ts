"use server";

import prisma from "@/lib/prisma";
import { sanitizeBlogHtml } from "@/lib/sanitize";
import { requireEditor } from "@/lib/admin-auth";
import { BLOG_SLUG_PATTERN, blogSlug } from "@/lib/slug";

export type AutoSaveData = {
    id?: number | null;
    title: string;
    slug?: string;
    tags?: string;
    excerpt?: string;
    content: string;
    imageUrl?: string;
    metaTitle?: string;
    metaDescription?: string;
};

export type AutoSaveResult = { success: boolean; id?: number; slug?: string; skipped?: "published" };

async function slugIsFree(slug: string, excludeId?: number): Promise<boolean> {
    const other = await prisma.blogPost.findFirst({
        where: {
            OR: [{ slug }, { previousSlugs: { has: slug } }],
            ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
        select: { id: true },
    });
    return !other;
}

/**
 * Background save for drafts. Published (or scheduled) posts are never auto-saved,
 * so half-finished edits don't go live — those changes are saved with the Save button.
 * An invalid or taken slug is ignored here; the Save button reports it.
 */
export async function autoSaveDraft(data: AutoSaveData): Promise<AutoSaveResult> {
    await requireEditor();
    try {
        const tagsArray = data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
        const fields = {
            title: data.title,
            tags: tagsArray,
            excerpt: data.excerpt || null,
            content: sanitizeBlogHtml(data.content || "<p></p>"),
            imageUrl: data.imageUrl || null,
            metaTitle: data.metaTitle?.trim() || null,
            metaDescription: data.metaDescription?.trim() || null,
        };
        const requestedSlug = data.slug?.trim().toLowerCase() || "";

        if (data.id) {
            const post = await prisma.blogPost.findUnique({ where: { id: data.id } });
            if (!post) return { success: false };
            if (post.published) return { success: false, id: post.id, slug: post.slug, skipped: "published" };

            const slug = requestedSlug && requestedSlug !== post.slug && BLOG_SLUG_PATTERN.test(requestedSlug)
                && (await slugIsFree(requestedSlug, post.id))
                ? requestedSlug
                : post.slug;

            await prisma.blogPost.update({ where: { id: post.id }, data: { ...fields, slug } });
            return { success: true, id: post.id, slug };
        }

        // Otherwise create a new draft
        const base = BLOG_SLUG_PATTERN.test(requestedSlug) ? requestedSlug : blogSlug(data.title) || "untitled";
        const slug = (await slugIsFree(base)) ? base : `${base}-${Date.now()}`;

        const newPost = await prisma.blogPost.create({
            data: { ...fields, slug, published: false, publishedAt: null },
        });

        return { success: true, id: newPost.id, slug: newPost.slug };
    } catch (error) {
        console.error("Auto-save failed", error);
        return { success: false };
    }
}
