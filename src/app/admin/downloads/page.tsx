"use client";

import { useState } from "react";
import { ArrowDownTrayIcon, DocumentArrowDownIcon } from "@heroicons/react/24/outline";

const REPORT_OPTIONS = [
  { value: "orders", label: "Orders", description: "All orders in date range (ID, date, contact, amounts, status)" },
  { value: "payments", label: "Payments", description: "Payment references (M-Pesa / receipts) in date range" },
  { value: "sales-summary", label: "Sales summary", description: "Daily totals: order count, revenue, delivery, paid" },
  { value: "products", label: "Products catalog", description: "Full product list (no date filter)" },
] as const;

const MAX_DAYS = 365;

function getDefaultDates() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 29); // default last 30 days
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export default function AdminDownloadsPage() {
  const defaults = getDefaultDates();
  const [reportType, setReportType] = useState<string>("orders");
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isProducts = reportType === "products";
  const needsDateRange = !isProducts;

  function validateRange(): string | null {
    if (!needsDateRange) return null;
    const fromD = new Date(from + "T00:00:00.000Z");
    const toD = new Date(to + "T23:59:59.999Z");
    if (Number.isNaN(fromD.getTime()) || Number.isNaN(toD.getTime())) {
      return "Please enter valid dates (YYYY-MM-DD).";
    }
    if (fromD > toD) return "From date must be before or equal to To date.";
    const days = Math.ceil((toD.getTime() - fromD.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (days > MAX_DAYS) {
      return `Date range cannot exceed ${MAX_DAYS} days (you selected ${days} days).`;
    }
    return null;
  }

  async function handleDownload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const err = validateRange();
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: reportType,
          from: needsDateRange ? from : undefined,
          to: needsDateRange ? to : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Download failed (${res.status})`);
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="?([^";]+)"?/);
      const name = match?.[1] ?? `${reportType}-report.xlsx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Report downloads</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Export reports as Excel (.xlsx). Date range is limited to 1 year.
        </p>
      </div>

      <form onSubmit={handleDownload} className="max-w-2xl space-y-6 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="report-type" className="block text-sm font-medium text-[var(--foreground)]">
            Report type
          </label>
          <select
            id="report-type"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            {REPORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {REPORT_OPTIONS.find((o) => o.value === reportType)?.description}
          </p>
        </div>

        {needsDateRange && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="date-from" className="block text-sm font-medium text-[var(--foreground)]">
                From
              </label>
              <input
                id="date-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label htmlFor="date-to" className="block text-sm font-medium text-[var(--foreground)]">
                To
              </label>
              <input
                id="date-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Preparing…
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="h-5 w-5" />
                Download Excel
              </>
            )}
          </button>
        </div>
      </form>

      <div className="flex items-start gap-3 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
        <DocumentArrowDownIcon className="h-6 w-6 shrink-0 text-[var(--muted)]" />
        <div className="text-sm text-[var(--muted)]">
          <p className="font-medium text-[var(--foreground)]">What you get</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            <li><strong>Orders</strong> — one row per order: ID, date, phone, location, name, subtotal, delivery, total, status, payment method, amount paid.</li>
            <li><strong>Payments</strong> — one row per payment ref: order ID, date, ref/receipt number, amount.</li>
            <li><strong>Sales summary</strong> — one row per day: date, order count, revenue, delivery, paid (completed orders only).</li>
            <li><strong>Products catalog</strong> — one row per product: ID, name, price, cost, stock, category, subcategory.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
