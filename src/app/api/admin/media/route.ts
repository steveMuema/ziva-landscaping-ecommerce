import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireEditorApi } from "@/lib/admin-auth";

const PAGE_SIZE = 48;

/** Media library listing for the image picker: ?q= filename search, ?page= (1-based). */
export async function GET(request: NextRequest) {
  const auth = await requireEditorApi();
  if ("response" in auth) return auth.response;

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
  const where = q ? { filename: { contains: q, mode: "insensitive" as const } } : {};

  const [total, items] = await Promise.all([
    prisma.media.count({ where }),
    prisma.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, url: true, filename: true, width: true, height: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({ items, total, page, pageSize: PAGE_SIZE });
}
