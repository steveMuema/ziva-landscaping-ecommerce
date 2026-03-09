"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitComment(postId: number, authorName: string, content: string, parentId?: number) {
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
                parentId: parentId || null,
            },
        });

        // Revalidate the specific blog post page
        revalidatePath(`/blog/${postExists.slug}`);

        return { success: true };
    } catch (error) {
        console.error("Failed to submit comment:", error);
        return { success: false, error: "An unexpected error occurred." };
    }
}

export async function likeComment(commentId: number) {
    try {
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            include: { post: true },
        });

        if (!comment) {
            return { success: false, error: "Comment not found." };
        }

        await prisma.comment.update({
            where: { id: commentId },
            data: { likes: { increment: 1 } },
        });

        // Revalidate the specific blog post page
        if (comment.post) {
            revalidatePath(`/blog/${comment.post.slug}`);
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to like comment:", error);
        return { success: false, error: "An unexpected error occurred." };
    }
}
