import { NextResponse } from "next/server";
import { getAgricultureCategories } from "@/lib/api";

/** Agriculture module: returns only categories with isAgriculture = true */
export async function GET() {
  const categories = await getAgricultureCategories();
  return NextResponse.json(categories);
}
