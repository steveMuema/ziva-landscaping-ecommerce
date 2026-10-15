import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireEditorApi } from "@/lib/admin-auth";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

/** All products as CSV. The same file can be edited and re-imported to update products. */
export async function GET() {
  const auth = await requireEditorApi();
  if ("response" in auth) return auth.response;

  const products = await prisma.product.findMany({
    orderBy: { id: "asc" },
    include: { subCategory: { include: { category: true } } },
  });

  const header = ["id", "sku", "name", "category", "subcategory", "status", "price", "compareAtPrice", "cost", "stock", "tags"];
  const rows = products.map((p) => [
    p.id,
    p.sku,
    p.name,
    p.subCategory.category.name,
    p.subCategory.name,
    p.status,
    p.price,
    p.compareAtPrice,
    p.cost,
    p.stock,
    p.tags.join("; "),
  ]);
  const csv = toCsv(header, rows, ["sku", "name", "category", "subcategory", "tags"]);
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="products-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
