"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import {
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

export type OrderListRow = {
  id: number;
  createdAt: string;
  phone: string;
  location: string;
  address?: string;
  city?: string;
  status: string;
  subtotal: number;
  transportFee: number | null;
  canComplete: boolean;
};

type Filters = {
  phone: string;
  status: string;
  dateFrom: string;
  dateTo: string;
};

type Props = {
  rows: OrderListRow[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  filters: Filters;
  updateOrderStatus: (orderId: number, status: string) => Promise<{ ok: boolean; error?: string }>;
};

function buildSearchParams(filters: Filters, page: number): string {
  const p = new URLSearchParams();
  if (filters.phone) p.set("phone", filters.phone);
  if (filters.status) p.set("status", filters.status);
  if (filters.dateFrom) p.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) p.set("dateTo", filters.dateTo);
  if (page > 1) p.set("page", String(page));
  const q = p.toString();
  return q ? `?${q}` : "";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(ksh: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(ksh);
}

export function OrdersListTable({
  rows,
  totalCount,
  currentPage,
  totalPages,
  pageSize,
  filters,
  updateOrderStatus,
}: Props) {
  const router = useRouter();
  const basePath = "/admin/orders/list";

  return (
    <div className="space-y-4">
      {/* Filters */}
      <form
        method="GET"
        action={basePath}
        className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30"
      >
        <input type="hidden" name="page" value="1" />
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            <label htmlFor="list-phone" className="sr-only">
              Search by phone
            </label>
            <input
              id="list-phone"
              type="search"
              name="phone"
              placeholder="Phone"
              defaultValue={filters.phone}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-40 dark:border-slate-600 dark:bg-[var(--card-bg)] dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
          <div>
            <label htmlFor="list-status" className="sr-only">
              Status
            </label>
            <select
              id="list-status"
              name="status"
              defaultValue={filters.status}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-[var(--card-bg)] dark:text-slate-100"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="list-dateFrom" className="sr-only">
              From date
            </label>
            <input
              id="list-dateFrom"
              type="date"
              name="dateFrom"
              defaultValue={filters.dateFrom}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-[var(--card-bg)] dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="list-dateTo" className="sr-only">
              To date
            </label>
            <input
              id="list-dateTo"
              type="date"
              name="dateTo"
              defaultValue={filters.dateTo}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-[var(--card-bg)] dark:text-slate-100"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          >
            <FunnelIcon className="h-4 w-4" />
            Apply
          </button>
          {(filters.phone || filters.status || filters.dateFrom || filters.dateTo) && (
            <Link
              href={basePath}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-[var(--card-bg)] dark:text-slate-200 dark:hover:bg-slate-600"
            >
              Clear filters
            </Link>
          )}
        </div>
      </form>

      {/* Summary */}
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalCount)} of {totalCount} orders
      </p>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[var(--card-bg)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  #
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Date
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Phone
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Location / Address
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Subtotal
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    No orders match your filters.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-sm font-medium text-slate-900 dark:text-slate-100">
                      {row.id}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                      {row.phone}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-sm text-slate-600 dark:text-slate-300" title={[row.location, row.address, row.city].filter(Boolean).join(", ")}>
                      {[row.location, row.address, row.city].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <OrderStatusSelect
                        orderId={row.id}
                        currentStatus={row.status}
                        canComplete={row.canComplete}
                        onUpdate={async (id, status) => {
                          const result = await updateOrderStatus(id, status);
                          router.refresh();
                          return result;
                        }}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-slate-900 dark:text-slate-100">
                      {formatMoney(row.subtotal)}
                      {row.transportFee != null && row.transportFee > 0 && (
                        <span className="ml-1 text-slate-500 dark:text-slate-400">
                          +{formatMoney(row.transportFee)}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link
                        href={`/shop/orders/${row.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-[var(--card-bg)] dark:text-slate-200 dark:hover:bg-slate-600"
                      >
                        <EyeIcon className="h-3.5 w-3.5" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4 dark:border-slate-700"
          aria-label="Orders pagination"
        >
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            {currentPage <= 1 ? (
              <span
                className="inline-flex cursor-not-allowed items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                aria-disabled
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Previous
              </span>
            ) : (
              <Link
                href={`${basePath}${buildSearchParams(filters, currentPage - 1)}`}
                className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-[var(--card-bg)] dark:text-slate-200 dark:hover:bg-slate-600"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Previous
              </Link>
            )}
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {currentPage} / {totalPages}
            </span>
            {currentPage >= totalPages ? (
              <span
                className="inline-flex cursor-not-allowed items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                aria-disabled
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </span>
            ) : (
              <Link
                href={`${basePath}${buildSearchParams(filters, currentPage + 1)}`}
                className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-[var(--card-bg)] dark:text-slate-200 dark:hover:bg-slate-600"
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
