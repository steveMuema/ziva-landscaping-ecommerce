import { getServerSession, type Session } from "next-auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { EDITOR_HOME, isAdminRole, isStaffRole, type StaffRole } from "@/lib/roles";

export type AdminUser = { id: string; name: string | null; email: string | null; role: StaffRole };

/**
 * Returns the signed-in staff member (admin or editor), or null. The role is re-checked
 * against the DB because the JWT carries a role for 30 days — a demoted or deleted user
 * would otherwise keep access until their token expires.
 */
export async function getStaffUser(): Promise<AdminUser | null> {
  return staffFromSession(await getServerSession(authOptions));
}

async function staffFromSession(session: Session | null): Promise<AdminUser | null> {
  const id = session?.user?.id;
  if (!id || !isStaffRole(session.user.role)) return null;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, sessionsValidAfter: true },
  });
  if (!user || !isStaffRole(user.role)) return null;
  // Sign-ins from before a password/2FA/role reset are no longer valid. Sessions created before
  // signedInAt existed count as old, so they end the first time an account is reset.
  if (user.sessionsValidAfter && (session?.signedInAt ?? 0) < user.sessionsValidAfter.getTime()) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

/** The signed-in admin, or null (editors don't count). */
export async function getAdminUser(): Promise<AdminUser | null> {
  const user = await getStaffUser();
  return user && isAdminRole(user.role) ? user : null;
}

/**
 * Staff user for a page or server action, or a redirect to sign-in. When a login cookie
 * exists but the account was deleted or demoted, the sign-in page is told so it clears the
 * stale session instead of sending the browser straight back here (a redirect loop).
 */
async function staffOrSignIn(): Promise<AdminUser> {
  const session = await getServerSession(authOptions);
  const user = await staffFromSession(session);
  if (!user) redirect(session?.user ? "/auth/signin?error=SessionExpired" : "/auth/signin");
  return user;
}

/** Admin-only pages and server actions: redirects everyone else. */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await staffOrSignIn();
  if (!isAdminRole(user.role)) redirect(EDITOR_HOME);
  return user;
}

/** Catalog, blog and content pages and actions: admins and editors. */
export async function requireEditor(): Promise<AdminUser> {
  return staffOrSignIn();
}

type ApiAuth = { user: AdminUser } | { response: NextResponse };

/** Admin-only route handlers: `if ("response" in auth) return auth.response;` */
export async function requireAdminApi(): Promise<ApiAuth> {
  const user = await getStaffUser();
  if (!user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!isAdminRole(user.role)) return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { user };
}

/** Route handlers open to admins and editors. */
export async function requireEditorApi(): Promise<ApiAuth> {
  const user = await getStaffUser();
  if (!user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { user };
}
