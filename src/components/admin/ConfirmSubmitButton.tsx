"use client";

import { useRef, useState } from "react";
import { TrashIcon } from "@heroicons/react/24/outline";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/** A submit button for a server-action form that asks for confirmation first. */
export function ConfirmSubmitButton({
    title,
    description,
    label = "Delete",
    confirmText = "Yes, delete",
    disabled,
    disabledReason,
}: {
    title: string;
    description: string;
    label?: string;
    confirmText?: string;
    disabled?: boolean;
    disabledReason?: string;
}) {
    const ref = useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    return (
        <>
            <button
                ref={ref}
                type="button"
                disabled={disabled || submitting}
                title={disabled ? disabledReason : undefined}
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <TrashIcon className="h-4 w-4" />
                {submitting ? "Deleting…" : label}
            </button>
            <ConfirmDialog
                isOpen={open}
                onClose={() => setOpen(false)}
                onConfirm={() => {
                    setOpen(false);
                    setSubmitting(true);
                    ref.current?.form?.requestSubmit();
                }}
                title={title}
                description={description}
                confirmText={confirmText}
                cancelText="Cancel"
            />
        </>
    );
}
