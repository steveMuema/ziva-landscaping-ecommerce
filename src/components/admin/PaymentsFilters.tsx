"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

type Props = {
  dateFrom?: string;
  dateTo?: string;
  ref?: string;
  mobile?: string;
};

export function PaymentsFilters({ dateFrom, dateTo, ref: refFilter, mobile }: Props) {
  const router = useRouter();

  const apply = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const fd = new FormData(form);
      const dateFromVal = (fd.get("dateFrom") as string)?.trim() || "";
      const dateToVal = (fd.get("dateTo") as string)?.trim() || "";
      const refVal = (fd.get("ref") as string)?.trim() || "";
      const mobileVal = (fd.get("mobile") as string)?.trim() || "";
      const params = new URLSearchParams();
      if (dateFromVal) params.set("dateFrom", dateFromVal);
      if (dateToVal) params.set("dateTo", dateToVal);
      if (refVal) params.set("ref", refVal);
      if (mobileVal) params.set("mobile", mobileVal);
      router.push(`/admin/payments?${params.toString()}`);
    },
    [router]
  );

  const clear = useCallback(() => {
    router.push("/admin/payments");
  }, [router]);

  const hasFilters = dateFrom || dateTo || refFilter || mobile;

  return (
    <form onSubmit={apply} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-600">Date from</span>
        <input
          type="date"
          name="dateFrom"
          defaultValue={dateFrom}
          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-600">Date to</span>
        <input
          type="date"
          name="dateTo"
          defaultValue={dateTo}
          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-600">Ref / Receipt no.</span>
        <input
          type="text"
          name="ref"
          placeholder="Search by ref or receipt"
          defaultValue={refFilter}
          className="min-w-[140px] rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-600">Mobile</span>
        <input
          type="text"
          name="mobile"
          placeholder="Search by mobile"
          defaultValue={mobile}
          className="min-w-[140px] rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Apply
        </button>
        {hasFilters && (
          <button
            type="button"
            onClick={clear}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
