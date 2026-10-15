"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PAGE_SIZE } from "@/lib/pagination";
import { requireAdmin } from "@/lib/admin-auth";

export async function getMoreAdminProducts(page: number) {
    await requireAdmin();
    const skip = (page - 1) * PAGE_SIZE;

    const products = await prisma.product.findMany({
        include: { subCategory: { include: { category: true } } },
        orderBy: { id: "desc" },
        skip,
        take: PAGE_SIZE,
    });

    return products;
}

export async function updateProductStockAction(formData: FormData) {
    await requireAdmin();
    const productId = parseInt(formData.get("productId") as string, 10);
    const stock = parseInt(formData.get("stock") as string, 10);
    if (isNaN(productId) || isNaN(stock) || stock < 0) return;

    await prisma.product.update({
        where: { id: productId },
        data: { stock },
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin");
    revalidatePath("/shop");
    revalidatePath("/shop", "layout");
    revalidatePath("/");
}
