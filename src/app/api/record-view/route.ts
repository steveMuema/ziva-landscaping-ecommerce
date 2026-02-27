import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Records a page view for dashboard analytics. Called by middleware (fire-and-forget).
 * Only records GET requests to page paths (not /api, /_next, admin, or static).
 */
export async function GET(request: NextRequest) {
  try {
    const path = request.nextUrl.searchParams.get("path");
    if (!path || typeof path !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const safePath = path.slice(0, 500);
    await prisma.pageView.create({ data: { path: safePath } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
