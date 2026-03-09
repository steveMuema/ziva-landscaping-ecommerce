"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { getFeaturedImageUrl } from "@/components/blog/FeaturedImage";
import { LoadMore } from "@/components/LoadMore";
import { getMoreBlogPosts } from "@/lib/actions/blog";
import { PAGE_SIZE } from "@/lib/pagination";

type BlogPostForList = {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    publishedAt: Date | null;
};

// Extracted from original Blog page to avoid hydration mismatches
function formatDate(d: Date | null) {
    if (!d) return null;
    const dateObj = new Date(d);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${months[dateObj.getUTCMonth()]} ${dateObj.getUTCDate()}, ${dateObj.getUTCFullYear()}`;
}

export function BlogList({ initialPosts }: { initialPosts: BlogPostForList[] }) {
    const [page, setPage] = useState(1);
    const [appendedPosts, setAppendedPosts] = useState<BlogPostForList[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialPosts.length === PAGE_SIZE);

    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore) return;
        setIsLoading(true);
        try {
            const nextPage = page + 1;
            const newPosts = await getMoreBlogPosts(nextPage);

            if (newPosts.length > 0) {
                setAppendedPosts((prev) => [...prev, ...newPosts]);
                setPage(nextPage);
            }
            setHasMore(newPosts.length === PAGE_SIZE);
        } catch (error) {
            console.error("Failed to fetch more blog posts:", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, isLoading, hasMore]);

    const allPosts = useMemo(() => {
        return [...initialPosts, ...appendedPosts];
    }, [initialPosts, appendedPosts]);

    const [featured, ...rest] = allPosts;

    return (
        <div className="space-y-10">
            {featured && (
                <Link href={`/blog/${featured.slug}`} className="block group">
                    <article className="rounded-2xl overflow-hidden border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm hover:shadow-md transition-shadow">
                        <div className="aspect-[21/10] relative bg-[var(--muted-bg)]">
                            <Image
                                src={getFeaturedImageUrl(null)}
                                alt=""
                                fill
                                className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                                sizes="(max-width: 1024px) 100vw, 800px"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                <time suppressHydrationWarning className="text-sm text-white/90" dateTime={featured.publishedAt?.toISOString() ?? undefined}>
                                    {formatDate(featured.publishedAt)}
                                </time>
                                <h2 className="text-2xl sm:text-3xl font-bold mt-1 font-[family-name:var(--font-quicksand)] group-hover:text-[var(--ziva-green-light)] transition-colors">
                                    {featured.title}
                                </h2>
                                {featured.excerpt && (
                                    <p className="mt-2 text-white/90 line-clamp-2 text-sm sm:text-base">{featured.excerpt}</p>
                                )}
                            </div>
                        </div>
                    </article>
                </Link>
            )}

            {rest.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2">
                    {rest.map((post) => (
                        <Link key={post.id} href={`/blog/${post.slug}`} className="block group">
                            <article className="rounded-xl overflow-hidden border border-[var(--card-border)] bg-[var(--card-bg)] h-full flex flex-col shadow-sm hover:shadow-md transition-shadow">
                                <div className="aspect-[16/10] relative bg-[var(--muted-bg)] shrink-0">
                                    <Image
                                        src={getFeaturedImageUrl(null)}
                                        alt=""
                                        fill
                                        className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                                        sizes="(max-width: 640px) 100vw, 50vw"
                                    />
                                </div>
                                <div className="p-4 flex-1 flex flex-col">
                                    {post.publishedAt && (
                                        <time suppressHydrationWarning className="text-xs text-[var(--muted)]" dateTime={post.publishedAt.toISOString()}>
                                            {formatDate(post.publishedAt)}
                                        </time>
                                    )}
                                    <h3 className="mt-1 text-lg font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] font-[family-name:var(--font-quicksand)]">
                                        {post.title}
                                    </h3>
                                    {post.excerpt && (
                                        <p className="mt-2 text-sm text-[var(--muted)] line-clamp-2">{post.excerpt}</p>
                                    )}
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>
            )}

            {allPosts.length === 0 && (
                <p className="text-[var(--muted)] py-8">No posts yet. Check back later.</p>
            )}

            <LoadMore hasMore={hasMore} isLoading={isLoading} onLoadMore={loadMore} />
        </div>
    );
}
