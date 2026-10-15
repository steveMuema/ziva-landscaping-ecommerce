"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { requireAdmin } from "@/lib/admin-auth";

const MAX_NAME_LENGTH = 60;
const MAX_CONTENT_LENGTH = 2000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const LIKED_COOKIE = "liked_comments";

// Best-effort, per-instance limiter: on serverless each instance keeps its own
// counts, so this slows down a single client rather than guaranteeing a cap.
const recentSubmissions = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
    const now = Date.now();
    const recent = (recentSubmissions.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (recent.length >= RATE_LIMIT_MAX) {
        recentSubmissions.set(key, recent);
        return true;
    }
    recent.push(now);
    recentSubmissions.set(key, recent);
    if (recentSubmissions.size > 5000) {
        for (const [k, times] of recentSubmissions) {
            if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) recentSubmissions.delete(k);
        }
    }
    return false;
}

async function clientIp(): Promise<string> {
    const h = await headers();
    return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function submitComment(postId: number, authorName: string, content: string, parentId?: number) {
    try {
        const name = typeof authorName === "string" ? authorName.trim() : "";
        const text = typeof content === "string" ? content.trim() : "";
        if (!name || !text) {
            return { success: false, error: "Name and comment are required." };
        }
        if (name.length > MAX_NAME_LENGTH) {
            return { success: false, error: `Name must be ${MAX_NAME_LENGTH} characters or fewer.` };
        }
        if (text.length > MAX_CONTENT_LENGTH) {
            return { success: false, error: `Comment must be ${MAX_CONTENT_LENGTH} characters or fewer.` };
        }
        if (!Number.isInteger(postId) || (parentId != null && !Number.isInteger(parentId))) {
            return { success: false, error: "Invalid request." };
        }

        if (isRateLimited(await clientIp())) {
            return { success: false, error: "You're commenting too quickly. Please wait a few minutes." };
        }

        const postExists = await prisma.blogPost.findUnique({
            where: { id: postId, published: true }, // Ensure comments only go on published posts
        });

        if (!postExists) {
            return { success: false, error: "Blog post not found or not published." };
        }

        if (parentId) {
            const parent = await prisma.comment.findUnique({ where: { id: parentId }, select: { postId: true } });
            if (!parent || parent.postId !== postId) {
                return { success: false, error: "The comment you're replying to no longer exists." };
            }
        }

        const duplicate = await prisma.comment.findFirst({
            where: {
                postId,
                authorName: name,
                content: text,
                createdAt: { gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) },
            },
            select: { id: true },
        });
        if (duplicate) {
            return { success: false, error: "You've already posted this comment." };
        }

        await prisma.comment.create({
            data: {
                postId,
                authorName: name,
                content: text,
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
        if (!Number.isInteger(commentId)) {
            return { success: false, error: "Invalid request." };
        }

        // One like per comment per browser, tracked in an httpOnly cookie.
        const cookieStore = await cookies();
        const liked = new Set(
            (cookieStore.get(LIKED_COOKIE)?.value ?? "").split(",").filter(Boolean)
        );
        if (liked.has(String(commentId))) {
            return { success: false, error: "You've already liked this comment." };
        }

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

        liked.add(String(commentId));
        cookieStore.set(LIKED_COOKIE, [...liked].slice(-500).join(","), {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24 * 365,
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

/** Admin: delete a comment (its replies are removed by the cascade). */
export async function deleteComment(formData: FormData): Promise<void> {
    await requireAdmin();
    const id = parseInt(formData.get("id") as string, 10);
    if (isNaN(id)) return;
    const comment = await prisma.comment.findUnique({
        where: { id },
        select: { post: { select: { slug: true } } },
    });
    if (!comment) return;
    await prisma.comment.delete({ where: { id } });
    revalidatePath("/admin/comments");
    revalidatePath(`/blog/${comment.post.slug}`);
}
