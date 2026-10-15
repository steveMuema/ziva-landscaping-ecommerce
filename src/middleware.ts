import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { EDITOR_HOME, canAccessAdminPath, isStaffRole } from "@/lib/roles";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    // Use NextAuth's getToken to properly check session in production
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Check if user is signed in as staff (admin or editor)
    if (!token || !isStaffRole(token.role)) {
      const signInUrl = new URL("/auth/signin", request.url);
      // Add callback URL so user returns to intended page after login
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Editors only see catalog, blog and content sections
    if (!canAccessAdminPath(token.role, pathname)) {
      return NextResponse.redirect(new URL(EDITOR_HOME, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};