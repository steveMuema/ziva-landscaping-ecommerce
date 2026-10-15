"use server";

import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PAGE_SIZE } from "@/lib/pagination";
import { requireEditor } from "@/lib/admin-auth";
import { isProductStatus } from "@/lib/product-fields";
import { audit } from "@/lib/audit";

export type AdminProductFilter = { q?: string; status?: string };

/** Shared by the products page and "load more" so both apply the same filter. */
function adminProductWhere(filter: AdminProductFilter = {}): Prisma.ProductWhereInput {
    const q = filter.q?.trim();
    return {
        ...(isProductStatus(filter.status) ? { status: filter.status } : {}),
        ...(q
            ? {
                OR: [
                    { name: { contains: q, mode: "insensitive" } },
                    { sku: { contains: q, mode: "insensitive" } },
                ],
            }
            : {}),
    };
}

export async function getAdminProducts(page: number, filter: AdminProductFilter = {}) {
    await requireEditor();
    const where = adminProductWhere(filter);
    const [totalCount, products] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({
            where,
            include: { subCategory: { include: { category: true } } },
            orderBy: { id: "desc" },
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
        }),
    ]);
    return { totalCount, products };
}

export async function getMoreAdminProducts(page: number, filter: AdminProductFilter = {}) {
    const { products } = await getAdminProducts(page, filter);
    return products;
}

export async function updateProductStockAction(formData: FormData) {
    const user = await requireEditor();
    const productId = parseInt(formData.get("productId") as string, 10);
    const stock = parseInt(formData.get("stock") as string, 10);
    if (isNaN(productId) || isNaN(stock) || stock < 0) return;

    const before = await prisma.product.findUnique({ where: { id: productId }, select: { name: true, stock: true } });
    if (!before) return;
    await prisma.product.update({
        where: { id: productId },
        data: { stock },
    });
    if (before.stock !== stock) {
        await audit(user, {
            action: "product.stock", entity: "Product", entityId: productId,
            summary: `Stock for “${before.name}”: ${before.stock} → ${stock}`,
            changes: { stock: { from: before.stock, to: stock } },
        });
    }

    revalidatePath("/admin/products");
    revalidatePath("/admin");
    revalidatePath("/shop");
    revalidatePath("/shop", "layout");
    revalidatePath("/");
}
