"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

interface LoadMoreProps {
    hasMore: boolean;
    onLoadMore: () => void;
    isLoading: boolean;
}

export function LoadMore({ hasMore, onLoadMore, isLoading }: LoadMoreProps) {
    const { ref, inView } = useInView({
        // Trigger when the element comes within 200px of the viewport
        rootMargin: "200px",
    });

    useEffect(() => {
        if (inView && hasMore && !isLoading) {
            onLoadMore();
        }
    }, [inView, hasMore, isLoading, onLoadMore]);

    if (!hasMore) return null;

    return (
        <div ref={ref} className="col-span-full py-8 flex justify-center items-center">
            {isLoading ? (
                <div className="flex items-center gap-2 text-[var(--muted)]">
                    <svg className="animate-spin h-5 w-5 text-[var(--accent)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm font-medium font-[family-name:var(--font-quicksand)]">Loading more...</span>
                </div>
            ) : (
                <div className="h-5" /> // Empty placeholder to trigger observer
            )}
        </div>
    );
}
