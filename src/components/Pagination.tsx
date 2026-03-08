"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const PAGE_SIZE = 20;

interface PaginationProps {
    totalItems: number;
    /** Override items per page — default is 20 */
    pageSize?: number;
}

export function Pagination({ totalItems, pageSize = PAGE_SIZE }: PaginationProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentPage = Math.max(1, Number(searchParams.get("page") ?? 1));
    const totalPages = Math.ceil(totalItems / pageSize);

    if (totalPages <= 1) return null;

    function buildHref(page: number) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(page));
        return `${pathname}?${params.toString()}`;
    }

    const pages: (number | "…")[] = [];
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== "…") {
            pages.push("…");
        }
    }

    return (
        <nav
            aria-label="Pagination"
            className="flex items-center justify-center gap-1 pt-10 pb-4 flex-wrap"
        >
            {/* Prev */}
            {currentPage > 1 ? (
                <Link
                    href={buildHref(currentPage - 1)}
                    className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-[var(--foreground)] bg-[var(--card-bg)] border border-[var(--card-border)] hover:bg-[var(--muted-bg)] transition-colors font-[family-name:var(--font-quicksand)]"
                    aria-label="Previous page"
                >
                    ← Prev
                </Link>
            ) : (
                <span className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-[var(--muted)] bg-[var(--card-bg)] border border-[var(--card-border)] opacity-40 cursor-default font-[family-name:var(--font-quicksand)]">
                    ← Prev
                </span>
            )}

            {/* Page numbers */}
            {pages.map((p, i) =>
                p === "…" ? (
                    <span
                        key={`ellipsis-${i}`}
                        className="px-2 text-[var(--muted)] text-sm select-none"
                    >
                        …
                    </span>
                ) : (
                    <Link
                        key={p}
                        href={buildHref(p)}
                        aria-current={p === currentPage ? "page" : undefined}
                        className={`inline-flex items-center justify-center rounded-md w-9 h-9 text-sm font-semibold transition-colors font-[family-name:var(--font-quicksand)] ${p === currentPage
                                ? "bg-[var(--accent)] text-white border border-[var(--accent)] shadow-sm"
                                : "bg-[var(--card-bg)] text-[var(--foreground)] border border-[var(--card-border)] hover:bg-[var(--muted-bg)]"
                            }`}
                    >
                        {p}
                    </Link>
                )
            )}

            {/* Next */}
            {currentPage < totalPages ? (
                <Link
                    href={buildHref(currentPage + 1)}
                    className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-[var(--foreground)] bg-[var(--card-bg)] border border-[var(--card-border)] hover:bg-[var(--muted-bg)] transition-colors font-[family-name:var(--font-quicksand)]"
                    aria-label="Next page"
                >
                    Next →
                </Link>
            ) : (
                <span className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-[var(--muted)] bg-[var(--card-bg)] border border-[var(--card-border)] opacity-40 cursor-default font-[family-name:var(--font-quicksand)]">
                    Next →
                </span>
            )}
        </nav>
    );
}

/** Returns the slice of items for the current page. Pass the full array and current page number. */
export function paginate<T>(items: T[], page: number, pageSize = PAGE_SIZE): T[] {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
}

export { PAGE_SIZE };
