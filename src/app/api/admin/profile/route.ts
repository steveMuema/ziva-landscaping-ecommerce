import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcryptjs from "bcryptjs";

async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== "admin" || typeof token.sub !== "string") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const unauth = await requireAdmin(request);
    if (unauth) return unauth;
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    const userId = token!.sub!;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({
      name: user.name ?? "",
      email: user.email ?? "",
    });
  } catch (err) {
    console.error("GET /api/admin/profile error:", err);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const unauth = await requireAdmin(request);
    if (unauth) return unauth;
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    const userId = token!.sub!;
    let body: { name?: string; email?: string; currentPassword?: string; newPassword?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const updates: { name?: string; email?: string; password?: string } = {};
    if (typeof body.name === "string") updates.name = body.name.trim() || null;
    if (typeof body.email === "string") {
      const email = body.email.trim().toLowerCase();
      if (email && !/^\S+@\S+\.\S+$/.test(email)) {
        return NextResponse.json({ error: "Invalid email" }, { status: 400 });
      }
      updates.email = email || null;
    }
    if (typeof body.newPassword === "string" && body.newPassword.trim() !== "") {
      const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
      });
      if (!user?.password) {
        return NextResponse.json(
          { error: "Password change not supported for this account" },
          { status: 400 }
        );
      }
      const valid = await bcryptjs.compare(currentPassword, user.password);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
      updates.password = await bcryptjs.hash(body.newPassword.trim(), 10);
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: userId },
      data: updates,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/admin/profile error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update profile" },
      { status: 500 }
    );
  }
}
