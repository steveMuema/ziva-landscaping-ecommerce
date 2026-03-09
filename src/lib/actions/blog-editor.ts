"use server";

import prisma from "@/lib/prisma";

function slugFromTitle(title: string) {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}

export type AutoSaveData = {
    id?: number | null;
    title: string;
    slug?: string;
    excerpt?: string;
    content: string;
    imageUrl?: string;
    published?: boolean;
};

export async function autoSaveDraft(data: AutoSaveData): Promise<{ success: boolean; id?: number; slug?: string }> {
    try {
        const slugInput = data.slug?.trim();
        const slug = slugInput || slugFromTitle(data.title);

        // If we have an ID, we update the existing post
        if (data.id) {
            const post = await prisma.blogPost.findUnique({ where: { id: data.id } });
            if (!post) return { success: false };

            await prisma.blogPost.update({
                where: { id: data.id },
                data: {
                    title: data.title,
                    slug: data.slug?.trim() || post.slug,
                    excerpt: data.excerpt || null,
                    content: data.content || "<p></p>",
                    imageUrl: data.imageUrl || null,
                    updatedAt: new Date(),
                },
            });
            return { success: true, id: data.id, slug: data.slug?.trim() || post.slug };
        }

        // Otherwise create a new draft
        const existing = await prisma.blogPost.findUnique({ where: { slug } });
        const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

        const newPost = await prisma.blogPost.create({
            data: {
                title: data.title,
                slug: finalSlug,
                excerpt: data.excerpt || null,
                content: data.content || "<p></p>",
                published: false,
                publishedAt: null,
                imageUrl: data.imageUrl || null,
            },
        });

        return { success: true, id: newPost.id, slug: newPost.slug };
    } catch (error) {
        console.error("Auto-save failed", error);
        return { success: false };
    }
}
