import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { PaymentsFilters } from "@/components/admin/PaymentsFilters";

export const dynamic = "force-dynamic";

const fmt = (n: number) =>
  Number(n).toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function toDateOnly(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/auth/signin");
  }

  const params = await searchParams;
  const dateFrom = typeof params.dateFrom === "string" ? params.dateFrom : undefined;
  const dateTo = typeof params.dateTo === "string" ? params.dateTo : undefined;
  const ref = typeof params.ref === "string" ? params.ref.trim() : undefined;
  const mobile = typeof params.mobile === "string" ? params.mobile.trim() : undefined;

  const where: {
    OR?: Array<{ amountPaid?: { gt: number }; orderPaymentRefs?: { some: object } }>;
    orderPaymentRefs?: { some: { value: { contains: string; mode: "insensitive" } } };
    phone?: { contains: string; mode: "insensitive" };
    createdAt?: { gte?: Date; lte?: Date };
  } = {};

  // Only show orders that have some payment info (amount paid > 0 or at least one ref)
  where.OR = [
    { amountPaid: { gt: 0 } },
    { orderPaymentRefs: { some: {} } },
  ];

  if (ref) {
    where.orderPaymentRefs = { some: { value: { contains: ref, mode: "insensitive" } } };
  }
  if (mobile) {
    where.phone = { contains: mobile, mode: "insensitive" };
  }
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom + "T00:00:00.000Z");
    if (dateTo) where.createdAt.lte = new Date(dateTo + "T23:59:59.999Z");
  }

  const orders = await prisma.order.findMany({
    where,
    select: {
      id: true,
      phone: true,
      amountPaid: true,
      subtotal: true,
      paymentMethod: true,
      orderPaymentRefs: { orderBy: { createdAt: "asc" }, select: { value: true, amount: true } },
      status: true,
      createdAt: true,
      completedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payments</h1>
        <p className="mt-1 text-sm text-slate-500">
          All transactions with payment reference or amount paid. Filter by date, receipt/ref number, or mobile.
        </p>
      </div>

      <PaymentsFilters
        dateFrom={dateFrom}
        dateTo={dateTo}
        ref={ref}
        mobile={mobile}
      />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-800">Order</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Date</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Mobile</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Method</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Amount paid</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Ref / Receipt</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No transactions match the filters.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders?highlight=${o.id}`}
                        className="font-medium text-emerald-600 hover:underline"
                      >
                        #{o.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{toDateOnly(o.createdAt)}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">{o.phone}</td>
                    <td className="px-4 py-3 text-slate-600">{o.paymentMethod ?? "—"}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{fmt(Number(o.amountPaid ?? 0))} KSH</td>
                    <td className="px-4 py-3 text-slate-700">
                      {o.orderPaymentRefs.length > 0 ? (
                        <div className="space-y-0.5">
                          {o.orderPaymentRefs.map((r, i) => (
                            <div key={i} className="flex justify-between gap-2 font-mono text-xs">
                              <span>{r.value}</span>
                              {r.amount != null && <span>{fmt(Number(r.amount))}</span>}
                            </div>
                          ))}
                          <div className="text-slate-500 text-xs border-t border-slate-100 pt-0.5">
                            Total refs: {fmt(o.orderPaymentRefs.reduce((s, r) => s + (r.amount ?? 0), 0))}
                          </div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          o.status === "COMPLETED"
                            ? "text-emerald-600"
                            : o.status === "CANCELLED"
                              ? "text-red-600"
                              : "text-slate-600"
                        }
                      >
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
