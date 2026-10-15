"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { PhotoIcon, XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

type MediaItem = { id: number; url: string; filename: string | null; width: number | null; height: number | null };

/** "Choose from library" button that opens a modal of uploaded images and returns the chosen URL. */
export function MediaPicker({ onSelect, label = "Library" }: { onSelect: (url: string) => void; label?: string }) {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<MediaItem[]>([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (q: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/media?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to load images");
            setItems(data.items);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load images");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!open) return;
        const t = setTimeout(() => load(query), 250);
        return () => clearTimeout(t);
    }, [open, query, load]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
                <PhotoIcon className="h-4 w-4" />
                {label}
            </button>
            {open && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Choose an image"
                        className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 border-b border-slate-200 p-4">
                            <h2 className="font-semibold text-slate-900">Media library</h2>
                            <div className="relative ml-auto w-full max-w-xs">
                                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="search"
                                    autoFocus
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search file name"
                                    aria-label="Search images"
                                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded p-1 text-slate-500 hover:bg-slate-100">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-4">
                            {error && <p className="text-sm text-red-600">{error}</p>}
                            {loading && items.length === 0 && <p className="text-sm text-slate-500">Loading…</p>}
                            {!loading && !error && items.length === 0 && (
                                <p className="text-sm text-slate-500">No images yet. Upload some in Admin → Media.</p>
                            )}
                            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                                {items.map((item) => (
                                    <li key={item.id}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onSelect(item.url);
                                                setOpen(false);
                                            }}
                                            className="group block w-full text-left"
                                        >
                                            <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100 ring-emerald-500 group-hover:ring-2 group-focus-visible:ring-2">
                                                <Image src={item.url} alt={item.filename ?? ""} fill className="object-cover" sizes="160px" />
                                            </div>
                                            <p className="mt-1 truncate text-xs text-slate-500">{item.filename ?? "Untitled"}</p>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
