"use client";

import { useState } from "react";
import Image from "next/image";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { MediaPicker } from "@/components/admin/MediaPicker";

/**
 * Lets a plain server-action form take images from the media library: the chosen URLs
 * are submitted as hidden inputs named `name`.
 */
export function LibraryImageInput({ name, multiple = false }: { name: string; multiple?: boolean }) {
    const [urls, setUrls] = useState<string[]>([]);
    return (
        <div className="flex flex-wrap items-center gap-2">
            <MediaPicker
                label={multiple ? "Add from library" : "Choose from library"}
                onSelect={(url) => setUrls((prev) => (multiple ? (prev.includes(url) ? prev : [...prev, url]) : [url]))}
            />
            {urls.map((url) => (
                <span key={url} className="relative h-12 w-12 overflow-hidden rounded-lg bg-slate-100">
                    <input type="hidden" name={name} value={url} />
                    <Image src={url} alt="" fill className="object-cover" sizes="48px" />
                    <button
                        type="button"
                        onClick={() => setUrls((prev) => prev.filter((u) => u !== url))}
                        aria-label="Remove chosen image"
                        className="absolute right-0 top-0 rounded-bl bg-black/60 p-0.5 text-white"
                    >
                        <XMarkIcon className="h-3 w-3" />
                    </button>
                </span>
            ))}
        </div>
    );
}
