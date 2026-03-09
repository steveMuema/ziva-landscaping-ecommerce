"use server";

import prisma from "@/lib/prisma";
import { PAGE_SIZE } from "@/lib/pagination";
import { slugToName } from "@/lib/slug";

export async function getMoreProducts({
    categorySlug,
    subCategorySlug,
    tag,
    page,
}: {
    categorySlug: string;
    subCategorySlug: string;
    tag?: string;
    page: number;
}) {
    const categoryName = slugToName(categorySlug);
    const subCategoryName = slugToName(subCategorySlug);
    const skip = (page - 1) * PAGE_SIZE;

    const subCategory = await prisma.subCategory.findFirst({
        where: {
            name: { equals: subCategoryName, mode: "insensitive" },
            category: { name: { equals: categoryName, mode: "insensitive" } },
        },
    });

    if (!subCategory) return [];

    const products = await prisma.product.findMany({
        where: {
            subCategoryId: subCategory.id,
            ...(tag ? { tags: { has: tag } } : {}),
        },
        orderBy: { id: "asc" },
        skip,
        take: PAGE_SIZE,
    });

    return products;
}
