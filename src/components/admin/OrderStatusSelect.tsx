"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending", className: "bg-slate-100 text-slate-700" },
  { value: "PROCESSING", label: "Processing", className: "bg-amber-100 text-amber-800" },
  { value: "COMPLETED", label: "Completed", className: "bg-emerald-100 text-emerald-800" },
  { value: "CANCELLED", label: "Cancelled", className: "bg-red-100 text-red-800" },
] as const;

type Status = (typeof STATUS_OPTIONS)[number]["value"];

type Props = {
  orderId: number;
  currentStatus: string;
  canComplete?: boolean; // true when payment is CASH or has payment ref (e.g. M-Pesa receipt)
  onUpdate: (orderId: number, status: Status) => Promise<{ ok: boolean; error?: string }>;
};

export function OrderStatusSelect({ orderId, currentStatus, canComplete = true, onUpdate }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as Status;
    if (value === currentStatus) return;
    setError(null);
    startTransition(async () => {
      const result = await onUpdate(orderId, value);
      if (result?.ok) {
        router.refresh();
      } else if (result?.error) {
        setError(result.error);
      }
    });
  };

  const current = STATUS_OPTIONS.find((s) => s.value === currentStatus) ?? STATUS_OPTIONS[0];

  return (
    <div className="relative inline-block min-w-[120px]">
      <select
        value={currentStatus}
        onChange={handleChange}
        disabled={isPending}
        className={`block w-full appearance-none rounded-lg border-0 px-3 py-1.5 pr-8 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-60 ${current.className}`}
        aria-label={`Order ${orderId} status`}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            disabled={opt.value === "COMPLETED" && !canComplete}
          >
            {opt.label}
            {opt.value === "COMPLETED" && !canComplete ? " (need payment)" : ""}
          </option>
        ))}
      </select>
      {error && (
        <p className="absolute left-0 top-full z-10 mt-1 w-64 rounded border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-800 shadow-sm">
          {error}
        </p>
      )}
      <span
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-current opacity-70"
        aria-hidden
      >
        {isPending ? (
          <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </span>
    </div>
  );
}
