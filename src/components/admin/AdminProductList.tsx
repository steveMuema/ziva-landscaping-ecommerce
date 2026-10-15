"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { LoadMore } from "@/components/LoadMore";
import { getMoreAdminProducts, updateProductStockAction, type AdminProductFilter } from "@/lib/actions/admin";
import { bulkUpdateProducts } from "@/lib/actions/products-admin";
import { PAGE_SIZE } from "@/lib/pagination";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: "Active", className: "bg-emerald-100 text-emerald-800" },
    DRAFT: { label: "Draft", className: "bg-amber-100 text-amber-800" },
    ARCHIVED: { label: "Archived", className: "bg-slate-200 text-slate-700" },
};

const LOW_STOCK_THRESHOLD = 5;

// Extracted type so it matches Prisma return
type AdminProduct = {
    id: number;
    name: string;
    price: number;
    compareAtPrice: number | null;
    cost: number | null;
    sku: string | null;
    status: string;
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
    filter,
    returnTo,
}: {
    initialProducts: AdminProduct[];
    totalCount: number;
    filter: AdminProductFilter;
    returnTo: string;
}) {
    const bulkFormRef = useRef<HTMLFormElement>(null);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [bulkAction, setBulkAction] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(false);

    const [page, setPage] = useState(1);
    const [appendedProducts, setAppendedProducts] = useState<AdminProduct[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialProducts.length === PAGE_SIZE);

    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore) return;
        setIsLoading(true);
        try {
            const nextPage = page + 1;
            const newProducts = (await getMoreAdminProducts(nextPage, filter)) as AdminProduct[];

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
    }, [page, isLoading, hasMore, filter]);

    const allVisibleProducts = useMemo(() => {
        return [...initialProducts, ...appendedProducts];
    }, [initialProducts, appendedProducts]);

    const lowStockCount = allVisibleProducts.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length;
    const outOfStockCount = allVisibleProducts.filter((p) => p.stock === 0).length;
    const hasLowStock = lowStockCount > 0 || outOfStockCount > 0;

    const allSelected = allVisibleProducts.length > 0 && allVisibleProducts.every((p) => selected.has(p.id));
    const toggle = (id: number) =>
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    const toggleAll = () =>
        setSelected(allSelected ? new Set() : new Set(allVisibleProducts.map((p) => p.id)));

    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h2 className="font-semibold text-slate-900">All products</h2>
                    <p className="text-sm text-slate-500">{totalCount} {filter.q || filter.status ? "matching" : "total"} · Stock management: set new value and click Update</p>
                </div>
                <form
                    id="bulk-form"
                    ref={bulkFormRef}
                    action={bulkUpdateProducts}
                    onSubmit={(e) => {
                        if (bulkAction === "DELETE" && !confirmDelete) {
                            e.preventDefault();
                            setConfirmDelete(true);
                        }
                    }}
                    className="flex flex-wrap items-center gap-2"
                >
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <span className="text-sm text-slate-500">{selected.size} selected</span>
                    <select
                        name="bulkAction"
                        value={bulkAction}
                        onChange={(e) => setBulkAction(e.target.value)}
                        aria-label="Bulk action"
                        className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                        <option value="">Bulk action…</option>
                        <option value="ACTIVE">Set Active (show in shop)</option>
                        <option value="DRAFT">Set Draft</option>
                        <option value="ARCHIVED">Archive</option>
                        <option value="DELETE">Delete</option>
                    </select>
                    <button
                        type="submit"
                        disabled={selected.size === 0 || !bulkAction}
                        className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Apply
                    </button>
                </form>
                <ConfirmDialog
                    isOpen={confirmDelete}
                    onClose={() => setConfirmDelete(false)}
                    onConfirm={() => {
                        bulkFormRef.current?.requestSubmit();
                    }}
                    title="Delete products"
                    description={`Permanently delete ${selected.size} product${selected.size === 1 ? "" : "s"}? Products that appear in orders are kept — archive those instead.`}
                    confirmText="Yes, delete"
                    cancelText="Cancel"
                />
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
                            <th className="w-10 py-3 pl-5">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={toggleAll}
                                    aria-label="Select all products"
                                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Product</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Status</th>
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
                            <tr key={prod.id} className={selected.has(prod.id) ? "bg-emerald-50/40" : "hover:bg-slate-50/50"}>
                                <td className="py-3 pl-5">
                                    <input
                                        type="checkbox"
                                        form="bulk-form"
                                        name="ids"
                                        value={prod.id}
                                        checked={selected.has(prod.id)}
                                        onChange={() => toggle(prod.id)}
                                        aria-label={`Select ${prod.name}`}
                                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                </td>
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
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-200" />
                                        )}
                                        <div>
                                            <span className="font-medium text-slate-900">{prod.name}</span>
                                            {prod.sku && <p className="font-mono text-xs text-slate-400">{prod.sku}</p>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-3">
                                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[prod.status]?.className ?? ""}`}>
                                        {STATUS_BADGE[prod.status]?.label ?? prod.status}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-sm text-slate-600">
                                    {prod.subCategory.category.name} / {prod.subCategory.name}
                                </td>
                                <td className="px-5 py-3 text-right font-medium text-slate-900">
                                    {Number(prod.price).toLocaleString()} KSH
                                    {prod.compareAtPrice != null && (
                                        <p className="text-xs font-normal text-slate-400 line-through">
                                            {Number(prod.compareAtPrice).toLocaleString()} KSH
                                        </p>
                                    )}
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
                <p className="px-5 py-8 text-center text-sm text-slate-500">
                    {filter.q || filter.status ? "No products match this filter." : "No products yet. Add one above."}
                </p>
            )}

            {/* Put LoadMore below the table so it isn't restricted by <tbody> */}
            <div className="px-5 py-2 relative">
                <LoadMore hasMore={hasMore} isLoading={isLoading} onLoadMore={loadMore} />
            </div>
        </div>
    );
}
