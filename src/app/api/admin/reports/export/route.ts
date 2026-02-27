import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import prisma from "@/lib/prisma";

const MAX_DAYS = 365;
const REPORT_TYPES = ["orders", "payments", "sales-summary", "products"] as const;

async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

function parseDateRange(body: unknown): { from: Date; to: Date } | NextResponse {
  const b = body as { from?: string; to?: string } | null;
  const fromStr = typeof b?.from === "string" ? b.from.trim() : "";
  const toStr = typeof b?.to === "string" ? b.to.trim() : "";
  if (!fromStr || !toStr) {
    return NextResponse.json(
      { error: "Missing date range: from and to (YYYY-MM-DD) required" },
      { status: 400 }
    );
  }
  const from = new Date(fromStr + "T00:00:00.000Z");
  const to = new Date(toStr + "T23:59:59.999Z");
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
  }
  if (from > to) {
    return NextResponse.json({ error: "From date must be before or equal to to date." }, { status: 400 });
  }
  const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (days > MAX_DAYS) {
    return NextResponse.json(
      { error: `Date range cannot exceed ${MAX_DAYS} days (${days} days requested).` },
      { status: 400 }
    );
  }
  return { from, to };
}

export async function POST(request: NextRequest) {
  try {
    const unauth = await requireAdmin(request);
    if (unauth) return unauth;

    const body = await request.json().catch(() => ({}));
    const type = typeof body.type === "string" ? body.type.trim().toLowerCase() : "";
    if (!REPORT_TYPES.includes(type as (typeof REPORT_TYPES)[number])) {
      return NextResponse.json(
        { error: `Invalid report type. Use one of: ${REPORT_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Products report has no date filter; others require from/to
    let from: Date;
    let to: Date;
    if (type === "products") {
      const now = new Date();
      to = now;
      from = new Date(now);
      from.setFullYear(from.getFullYear() - 1);
    } else {
      const range = parseDateRange(body);
      if (range instanceof NextResponse) return range;
      from = range.from;
      to = range.to;
    }

    const wb = XLSX.utils.book_new();

    if (type === "orders") {
      const orders = await prisma.order.findMany({
        where: { createdAt: { gte: from, lte: to } },
        orderBy: { createdAt: "asc" },
        include: {
          orderItems: {
            include: { product: { select: { name: true } } },
          },
        },
      });
      const rows = orders.map((o) => {
        const total = Number(o.subtotal) + (o.transportFee ?? 0);
        return {
          "Order ID": o.id,
          Date: o.createdAt.toISOString().slice(0, 19).replace("T", " "),
          Phone: o.phone ?? "",
          Location: o.location ?? "",
          Name: o.fullname ?? "",
          "Subtotal (KSH)": Number(o.subtotal),
          "Delivery (KSH)": o.transportFee ?? 0,
          "Total (KSH)": total,
          Status: o.status,
          "Payment method": o.paymentMethod ?? "",
          "Amount paid (KSH)": o.amountPaid ?? 0,
        };
      });
      const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{}]);
      XLSX.utils.book_append_sheet(wb, ws, "Orders");
    } else if (type === "payments") {
      const refs = await prisma.orderPaymentRef.findMany({
        where: { createdAt: { gte: from, lte: to } },
        orderBy: { createdAt: "asc" },
        include: { order: { select: { id: true, phone: true, subtotal: true, transportFee: true } } },
      });
      const rows = refs.map((r) => ({
        "Order ID": r.orderId,
        Date: r.createdAt.toISOString().slice(0, 19).replace("T", " "),
        "Ref / Receipt": r.value,
        "Amount (KSH)": r.amount ?? 0,
        "Order phone": r.order?.phone ?? "",
      }));
      const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{}]);
      XLSX.utils.book_append_sheet(wb, ws, "Payments");
    } else if (type === "sales-summary") {
      const orders = await prisma.order.findMany({
        where: { status: "COMPLETED", createdAt: { gte: from, lte: to } },
        select: {
          createdAt: true,
          subtotal: true,
          transportFee: true,
          amountPaid: true,
        },
      });
      const byDay = new Map<string, { orders: number; revenue: number; delivery: number; paid: number }>();
      for (const o of orders) {
        const day = o.createdAt.toISOString().slice(0, 10);
        const cur = byDay.get(day) ?? { orders: 0, revenue: 0, delivery: 0, paid: 0 };
        cur.orders += 1;
        cur.revenue += Number(o.subtotal);
        cur.delivery += o.transportFee ?? 0;
        cur.paid += o.amountPaid ?? 0;
        byDay.set(day, cur);
      }
      const sortedDays = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));
      const rows = sortedDays.map(([date, d]) => ({
        Date: date,
        "Order count": d.orders,
        "Revenue (KSH)": d.revenue,
        "Delivery (KSH)": d.delivery,
        "Paid (KSH)": d.paid,
      }));
      const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{}]);
      XLSX.utils.book_append_sheet(wb, ws, "Sales summary");
    } else {
      // products: full catalog; optional "sold in range" can be added later
      const products = await prisma.product.findMany({
        orderBy: [{ subCategory: { category: { name: "asc" } } }, { subCategory: { name: "asc" } }, { name: "asc" }],
        include: {
          subCategory: { include: { category: { select: { name: true } } } },
        },
      });
      const rows = products.map((p) => ({
        "Product ID": p.id,
        Name: p.name,
        "Price (KSH)": p.price,
        "Cost (KSH)": p.cost ?? "",
        Stock: p.stock,
        Category: p.subCategory?.category?.name ?? "",
        Subcategory: p.subCategory?.name ?? "",
      }));
      const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{}]);
      XLSX.utils.book_append_sheet(wb, ws, "Products");
    }

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const filename =
      type === "products"
        ? "products-report.xlsx"
        : `${type}-report-${from.toISOString().slice(0, 10)}-to-${to.toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error("Reports export error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Export failed" },
      { status: 500 }
    );
  }
}
