import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const WINDOW_MS = 60_000;
const MAX_LOOKUPS = 20;
// Best-effort, per-instance limiter (like the comments one): slows down scripted email probing.
const recent = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5000) {
    for (const [k, v] of recent) if (v.every((t) => now - t >= WINDOW_MS)) recent.delete(k);
  }
  return hits.length > MAX_LOOKUPS;
}

/**
 * How an email signs in, so the sign-in page can show the right field.
 * Returns "authenticator" only for authenticator-only accounts (2FA on, no password).
 * Unknown emails get the same "password" answer as password accounts, so this can't be
 * used to discover which emails have accounts.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254) return NextResponse.json({ method: "password" });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { password: true, twoFactorEnabled: true, twoFactorSecret: true },
  });
  const authenticatorOnly = Boolean(user && !user.password && user.twoFactorEnabled && user.twoFactorSecret);
  return NextResponse.json(
    { method: authenticatorOnly ? "authenticator" : "password" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
