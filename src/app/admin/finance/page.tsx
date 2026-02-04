import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export default async function AdminFinancePage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    redirect("/auth/signin");
  }

  const orders = await prisma.order.findMany({
    include: {
      orderItems: {
        include: {
          product: {
            select: { id: true, name: true, price: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  async function recordCashPayment(formData: FormData) {
    "use server";
    const orderId = parseInt(formData.get("orderId") as string, 10);
    const amount = parseFloat(formData.get("amount") as string);
    if (isNaN(orderId) || isNaN(amount) || amount < 0) return;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return;
    await prisma.order.update({
      where: { id: orderId },
      data: {
        amountPaid: amount,
        paymentMethod: "CASH",
        status: amount >= order.subtotal ? "COMPLETED" : "PROCESSING",
      },
    });
    revalidatePath("/admin/finance");
  }

  function formatAddress(order: (typeof orders)[0]) {
    const parts = [
      order.address,
      order.apartment,
      order.city,
      order.state,
      order.postalCode,
      order.country,
    ].filter(Boolean);
    return parts.join(", ");
  }

  function mapsUrl(order: (typeof orders)[0]) {
    const q = encodeURIComponent(formatAddress(order));
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Finance</h1>
        <p className="mt-1 text-sm text-slate-500">{orders.length} orders</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">#</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Address</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">KSH</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Paid</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {orders.map((order) => {
                const paid = order.amountPaid ?? 0;
                const balance = Math.max(0, order.subtotal - paid);
                const isCash = order.paymentMethod === "CASH" || !order.paymentMethod;
                return (
                  <tr key={order.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-mono text-sm font-medium text-slate-900">{order.id}</td>
                    <td className="px-5 py-3 text-sm text-slate-700 max-w-xs">
                      <a
                        href={mapsUrl(order)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--accent)] hover:underline truncate block"
                        title={formatAddress(order)}
                      >
                        {formatAddress(order) || "—"}
                      </a>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-slate-900">
                      {Number(order.subtotal).toLocaleString("en-KE", { minimumFractionDigits: 0 })}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-slate-900">
                      {paid.toLocaleString("en-KE", { minimumFractionDigits: 0 })}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          order.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : order.status === "PROCESSING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {isCash && balance > 0 && (
                        <form action={recordCashPayment} className="flex items-center gap-2">
                          <input type="hidden" name="orderId" value={order.id} />
                          <input
                            type="number"
                            name="amount"
                            step="0.01"
                            min="0"
                            placeholder="0"
                            className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <button
                            type="submit"
                            className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                            title="Save payment"
                          >
                            ✓
                          </button>
                        </form>
                      )}
                      {isCash && balance === 0 && paid > 0 && (
                        <span className="text-emerald-600">✓</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-slate-500">No orders yet.</p>
        )}
      </div>
    </div>
  );
}
