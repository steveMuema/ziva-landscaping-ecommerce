"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PencilSquareIcon, TrashIcon, EyeIcon } from "@heroicons/react/24/outline";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function BlogActions({ id, slug }: { id: number; slug: string }) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    async function handleConfirmDelete() {
        setErrorMsg("");
        setIsDeleting(true);

        try {
            const res = await fetch(`/api/admin/blog/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error("Failed to delete post");
            }

            setIsConfirmOpen(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            setErrorMsg("Failed to delete the blog post. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className="flex items-center gap-2">
            <Link
                href={`/blog/${slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <EyeIcon className="h-4 w-4" />
                View
            </Link>
            <Link
                href={`/admin/blog/${id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
                <PencilSquareIcon className="h-4 w-4" />
                Edit
            </Link>
            <button
                onClick={() => setIsConfirmOpen(true)}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            >
                <TrashIcon className="h-4 w-4" />
                Delete
            </button>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                onClose={() => {
                    if (isDeleting) return;
                    setIsConfirmOpen(false);
                    setErrorMsg("");
                }}
                onConfirm={handleConfirmDelete}
                title="Delete Blog Post"
                description={errorMsg || "Are you sure you want to permanently delete this blog post? This action cannot be undone."}
                confirmText={isDeleting ? "Deleting..." : "Yes, delete"}
                cancelText="Cancel"
                isLoading={isDeleting}
            />
        </div>
    );
}
