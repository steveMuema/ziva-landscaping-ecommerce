"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitComment(postId: number, authorName: string, content: string) {
    try {
        if (!authorName.trim() || !content.trim()) {
            return { success: false, error: "Name and comment are required." };
        }

        const postExists = await prisma.blogPost.findUnique({
            where: { id: postId, published: true }, // Ensure comments only go on published posts
        });

        if (!postExists) {
            return { success: false, error: "Blog post not found or not published." };
        }

        await prisma.comment.create({
            data: {
                postId,
                authorName: authorName.trim(),
                content: content.trim(),
            },
        });

        // Revalidate the specific blog post page so the new comment appears immediately
        revalidatePath(`/blog/${postExists.slug}`);

        return { success: true };
    } catch (error) {
        console.error("Failed to submit comment:", error);
        return { success: false, error: "An unexpected error occurred." };
    }
}
