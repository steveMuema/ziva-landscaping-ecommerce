"use server";

import prisma from "@/lib/prisma";
import { PAGE_SIZE } from "@/lib/pagination";

export async function getMoreBlogPosts(page: number) {
    const skip = (page - 1) * PAGE_SIZE;

    const posts = await prisma.blogPost.findMany({
        where: { published: true },
        orderBy: { publishedAt: "desc" },
        skip,
        take: PAGE_SIZE,
        select: {
            id: true,
            title: true,
            slug: true,
            tags: true,
            imageUrl: true,
            excerpt: true,
            publishedAt: true,
        },
    });

    return posts;
}
