import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import type { NextAuthOptions } from "next-auth";
import { isStaffRole } from "@/lib/roles";
import { SignInError, verifyCredentials } from "@/lib/credentials-auth";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const useGoogle = Boolean(googleClientId && googleClientSecret);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    ...(useGoogle
      ? [
        GoogleProvider({
          clientId: googleClientId!,
          clientSecret: googleClientSecret!,
        }),
      ]
      : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "2FA Code (Optional)", type: "text" },
      },
      async authorize(credentials) {
        // Password (+ authenticator code when 2FA is on), or the code alone for
        // authenticator-only accounts. See verifyCredentials for the rules and lockout.
        const { email, password, totpCode } = (credentials ?? {}) as {
          email?: string;
          password?: string;
          totpCode?: string;
        };
        try {
          return await verifyCredentials({ email, password, totpCode });
        } catch (error) {
          if (error instanceof SignInError) throw new Error(error.message);
          console.error("Sign-in failed:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async signIn({ user }) {
      if (isStaffRole(user.role)) {
        return true;
      }
      throw new Error("Only staff accounts (admins and editors) can sign in.");
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.signedInAt = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      session.signedInAt = token.signedInAt;
      return session;
    },
  },
};