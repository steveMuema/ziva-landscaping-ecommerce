"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpTrayIcon, LinkIcon, MagnifyingGlassIcon, PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { normalizeImageUrl } from "@/components/rich-text/urls";

type MediaItem = { id: number; url: string; filename: string | null };
type Source = "library" | "upload" | "url";

export type ChosenImage = { src: string; alt: string };

const MAX_BYTES = 10 * 1024 * 1024;

/** Upload one image through the admin API (which also records it in the media library). */
export async function uploadImageFile(file: File): Promise<string> {
    if (!file.type.startsWith("image/")) throw new Error(`“${file.name}” is not an image.`);
    if (file.size > MAX_BYTES) throw new Error(`“${file.name}” is larger than 10 MB.`);
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) throw new Error(data.error || "Upload failed.");
    return data.url as string;
}

/**
 * One place to pick an image: from the media library, uploaded from this device,
 * or by URL. Calls `onSelect` with the chosen URL and alt text.
 */
export function ImageSourceDialog({
    open,
    onClose,
    onSelect,
    title = "Insert image",
    askAlt = true,
    initialAlt = "",
}: {
    open: boolean;
    onClose: () => void;
    onSelect: (image: ChosenImage) => void;
    title?: string;
    askAlt?: boolean;
    initialAlt?: string;
}) {
    const [source, setSource] = useState<Source>("library");
    const [alt, setAlt] = useState(initialAlt);
    const [error, setError] = useState<string | null>(null);

    // library
    const [items, setItems] = useState<MediaItem[]>([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);

    // upload
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);

    // url
    const [url, setUrl] = useState("");
    const [previewOk, setPreviewOk] = useState<boolean | null>(null);

    useEffect(() => {
        if (!open) return;
        setError(null);
        setSelected(null);
        setUrl("");
        setPreviewOk(null);
        setAlt(initialAlt);
    }, [open, initialAlt]);

    const loadLibrary = useCallback(async (q: string) => {
        setLoading(true);
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
        if (!open || source !== "library") return;
        const t = setTimeout(() => loadLibrary(query), 250);
        return () => clearTimeout(t);
    }, [open, source, query, loadLibrary]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    const finish = (src: string, fallbackAlt = "") => {
        onSelect({ src, alt: alt.trim() || fallbackAlt });
        onClose();
    };

    const handleFiles = async (files: FileList | File[] | null) => {
        const file = files ? Array.from(files)[0] : undefined;
        if (!file) return;
        setError(null);
        setUploading(true);
        try {
            const src = await uploadImageFile(file);
            finish(src, file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Upload failed.");
        } finally {
            setUploading(false);
        }
    };

    const insertFromUrl = () => {
        const result = normalizeImageUrl(url);
        if ("error" in result) {
            setError(result.error);
            return;
        }
        if (previewOk === false) {
            setError("That image couldn't be loaded. Check the URL.");
            return;
        }
        finish(result.href);
    };

    const tabs: { id: Source; label: string; icon: typeof PhotoIcon }[] = [
        { id: "library", label: "Media library", icon: PhotoIcon },
        { id: "upload", label: "Upload from device", icon: ArrowUpTrayIcon },
        { id: "url", label: "From URL", icon: LinkIcon },
    ];
    const urlCheck = url.trim() ? normalizeImageUrl(url) : null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onMouseDown={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl bg-white text-slate-900 shadow-xl"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <h2 className="font-semibold">{title}</h2>
                    <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-slate-500 hover:bg-slate-100">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <div role="tablist" className="flex gap-1 border-b border-slate-200 px-4 pt-2">
                    {tabs.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            type="button"
                            role="tab"
                            aria-selected={source === id}
                            onClick={() => {
                                setSource(id);
                                setError(null);
                            }}
                            className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium ${source === id ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </button>
                    ))}
                </div>

                <div className="min-h-[280px] flex-1 overflow-y-auto p-4" role="tabpanel">
                    {source === "library" && (
                        <div className="space-y-3">
                            <div className="relative">
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
                            {loading && items.length === 0 && <p className="text-sm text-slate-500">Loading…</p>}
                            {!loading && items.length === 0 && (
                                <p className="text-sm text-slate-500">
                                    {query ? "No images match this search." : "The library is empty. Upload an image from your device to start it."}
                                </p>
                            )}
                            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                                {items.map((item) => (
                                    <li key={item.id}>
                                        <button
                                            type="button"
                                            onClick={() => setSelected(item.url)}
                                            onDoubleClick={() => finish(item.url, item.filename?.replace(/\.[^.]+$/, "") ?? "")}
                                            aria-pressed={selected === item.url}
                                            className="block w-full text-left"
                                        >
                                            <span className={`relative block aspect-square overflow-hidden rounded-lg bg-slate-100 ${selected === item.url ? "ring-2 ring-emerald-500 ring-offset-2" : "hover:ring-2 hover:ring-slate-300"}`}>
                                                <Image src={item.url} alt={item.filename ?? ""} fill className="object-cover" sizes="140px" />
                                            </span>
                                            <span className="mt-1 block truncate text-xs text-slate-500">{item.filename ?? "Untitled"}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {source === "upload" && (
                        <div
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragOver(true);
                            }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setDragOver(false);
                                handleFiles(e.dataTransfer.files);
                            }}
                            className={`flex h-full min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center ${dragOver ? "border-emerald-500 bg-emerald-50" : "border-slate-300"}`}
                        >
                            <ArrowUpTrayIcon className="h-8 w-8 text-slate-400" />
                            <p className="text-sm text-slate-600">
                                {uploading ? "Uploading…" : "Drag an image here, or choose one from this computer or phone."}
                            </p>
                            <button
                                type="button"
                                disabled={uploading}
                                onClick={() => fileInput.current?.click()}
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                                Choose file
                            </button>
                            <input
                                ref={fileInput}
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(e) => {
                                    handleFiles(e.target.files);
                                    e.target.value = "";
                                }}
                            />
                            <p className="text-xs text-slate-400">JPG, PNG, WebP or GIF up to 10 MB. Uploads are added to the media library.</p>
                        </div>
                    )}

                    {source === "url" && (
                        <div className="space-y-3">
                            <label htmlFor="image-url" className="block text-sm font-medium text-slate-700">Image URL</label>
                            <input
                                id="image-url"
                                type="url"
                                autoFocus
                                value={url}
                                onChange={(e) => {
                                    setUrl(e.target.value);
                                    setPreviewOk(null);
                                    setError(null);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        insertFromUrl();
                                    }
                                }}
                                placeholder="https://example.com/photo.jpg"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            {urlCheck?.ok && (
                                <div className="flex h-48 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                                    {/* eslint-disable-next-line @next/next/no-img-element -- previewing an arbitrary external URL */}
                                    <img
                                        src={urlCheck.href}
                                        alt=""
                                        className="max-h-full max-w-full object-contain"
                                        onLoad={() => setPreviewOk(true)}
                                        onError={() => setPreviewOk(false)}
                                    />
                                </div>
                            )}
                            {previewOk === false && <p className="text-sm text-amber-700">This image couldn&apos;t be loaded. Check the URL.</p>}
                            <p className="text-xs text-slate-500">
                                The image stays on the other site. If it&apos;s removed there, it disappears here too — uploading is safer.
                            </p>
                        </div>
                    )}
                </div>

                <div className="space-y-3 border-t border-slate-200 p-4">
                    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
                    {askAlt && (
                        <div>
                            <label htmlFor="image-alt" className="block text-sm font-medium text-slate-700">
                                Alt text <span className="font-normal text-slate-400">(describes the image for screen readers and Google)</span>
                            </label>
                            <input
                                id="image-alt"
                                type="text"
                                value={alt}
                                maxLength={200}
                                onChange={(e) => setAlt(e.target.value)}
                                placeholder="e.g. Drought-resistant garden with gravel paths"
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>
                    )}
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                            Cancel
                        </button>
                        {source === "library" && (
                            <button
                                type="button"
                                disabled={!selected}
                                onClick={() => selected && finish(selected, items.find((i) => i.url === selected)?.filename?.replace(/\.[^.]+$/, "") ?? "")}
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                                Use selected image
                            </button>
                        )}
                        {source === "url" && (
                            <button
                                type="button"
                                disabled={!url.trim()}
                                onClick={insertFromUrl}
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                                Use this URL
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
