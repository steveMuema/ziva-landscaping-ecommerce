"use client";

import { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { LoadMore } from "@/components/LoadMore";
import { getMoreAdminProducts, updateProductStockAction } from "@/lib/actions/admin";
import { PAGE_SIZE } from "@/lib/pagination";
import cloudinaryLoader from "@/lib/cloudinaryLoader";

const LOW_STOCK_THRESHOLD = 5;

// Extracted type so it matches Prisma return
type AdminProduct = {
    id: number;
    name: string;
    price: number;
    cost: number | null;
    stock: number;
    imageUrl: string | null;
    tags: string[];
    subCategory: {
        name: string;
        category: {
            name: string;
        };
    };
};

export function AdminProductList({
    initialProducts,
    totalCount,
}: {
    initialProducts: AdminProduct[];
    totalCount: number;
}) {
    const [page, setPage] = useState(1);
    const [appendedProducts, setAppendedProducts] = useState<AdminProduct[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialProducts.length === PAGE_SIZE);

    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore) return;
        setIsLoading(true);
        try {
            const nextPage = page + 1;
            const newProducts = (await getMoreAdminProducts(nextPage)) as AdminProduct[];

            if (newProducts.length > 0) {
                setAppendedProducts((prev) => [...prev, ...newProducts]);
                setPage(nextPage);
            }
            setHasMore(newProducts.length === PAGE_SIZE);
        } catch (error) {
            console.error("Failed to fetch more admin products:", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, isLoading, hasMore]);

    const allVisibleProducts = useMemo(() => {
        return [...initialProducts, ...appendedProducts];
    }, [initialProducts, appendedProducts]);

    const lowStockCount = allVisibleProducts.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length;
    const outOfStockCount = allVisibleProducts.filter((p) => p.stock === 0).length;
    const hasLowStock = lowStockCount > 0 || outOfStockCount > 0;

    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h2 className="font-semibold text-slate-900">All products</h2>
                    <p className="text-sm text-slate-500">{totalCount} total · Stock management: set new value and click Update</p>
                </div>
                {hasLowStock && (
                    <p className="text-sm text-amber-700 font-medium">
                        {outOfStockCount} out of stock · {lowStockCount} low stock (≤{LOW_STOCK_THRESHOLD})
                    </p>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Product</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Category</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Selling price</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Cost</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Stock</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Tags</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {allVisibleProducts.map((prod) => (
                            <tr key={prod.id} className="hover:bg-slate-50/50">
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-3">
                                        {prod.imageUrl ? (
                                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                                <Image
                                                    src={prod.imageUrl}
                                                    alt={prod.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="40px"
                                                    loader={prod.imageUrl?.startsWith("https://res.cloudinary.com") ? cloudinaryLoader : undefined}
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-200" />
                                        )}
                                        <span className="font-medium text-slate-900">{prod.name}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-3 text-sm text-slate-600">
                                    {prod.subCategory.category.name} / {prod.subCategory.name}
                                </td>
                                <td className="px-5 py-3 text-right font-medium text-slate-900">
                                    {Number(prod.price).toLocaleString()} KSH
                                </td>
                                <td className="px-5 py-3 text-right text-slate-600">
                                    {prod.cost != null ? `${Number(prod.cost).toLocaleString()} KSH` : "—"}
                                </td>
                                <td className="px-5 py-3">
                                    <form action={updateProductStockAction} className="flex items-center justify-end gap-2">
                                        <input type="hidden" name="productId" value={prod.id} />
                                        <input
                                            type="number"
                                            name="stock"
                                            min={0}
                                            defaultValue={prod.stock}
                                            className={`w-20 rounded-lg border px-2 py-1.5 text-right text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${prod.stock === 0
                                                    ? "border-red-300 bg-red-50 text-red-900"
                                                    : prod.stock <= LOW_STOCK_THRESHOLD
                                                        ? "border-amber-300 bg-amber-50 text-amber-900"
                                                        : "border-slate-300 text-slate-900"
                                                }`}
                                            aria-label={`Stock for ${prod.name}`}
                                        />
                                        <button
                                            type="submit"
                                            className="rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                                        >
                                            Update
                                        </button>
                                    </form>
                                </td>
                                <td className="px-5 py-3">
                                    {prod.tags && prod.tags.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {prod.tags.map((t, idx) => (
                                                <span
                                                    key={idx}
                                                    className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                                                >
                                                    {String(t)}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-slate-400">—</span>
                                    )}
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <Link
                                        href={`/admin/products/${prod.id}/edit`}
                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                    >
                                        <PencilSquareIcon className="h-4 w-4" />
                                        Edit
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {allVisibleProducts.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-slate-500">No products match your criteria. Add one above.</p>
            )}

            {/* Put LoadMore below the table so it isn't restricted by <tbody> */}
            <div className="px-5 py-2 relative">
                <LoadMore hasMore={hasMore} isLoading={isLoading} onLoadMore={loadMore} />
            </div>
        </div>
    );
}
