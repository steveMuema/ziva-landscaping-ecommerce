import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";

export type AdminUser = { id: string; name: string | null; email: string | null };

/**
 * Returns the signed-in admin, or null. The role is re-checked against the DB
 * because the JWT carries a role for 30 days — a demoted or deleted user would
 * otherwise keep admin access until their token expires.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id || session.user.role !== "admin") return null;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user || user.role !== "admin") return null;
  return { id: user.id, name: user.name, email: user.email };
}

/** For admin pages and server actions: redirects to sign-in when not an admin. */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect("/auth/signin");
  return user;
}

/** For admin route handlers: `if ("response" in auth) return auth.response;` */
export async function requireAdminApi(): Promise<{ user: AdminUser } | { response: NextResponse }> {
  const user = await getAdminUser();
  if (!user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { user };
}
