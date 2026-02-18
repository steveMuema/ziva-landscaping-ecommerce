"use client";

import { useRouter } from "next/navigation";

const OPTIONS = [
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
] as const;

type Props = { currentDays: number };

export function RevenueRangeSelect({ currentDays }: Props) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    router.push(`/admin/finance?days=${value}`);
  }

  return (
    <select
      value={String(currentDays)}
      onChange={handleChange}
      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      aria-label="Revenue chart range"
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
