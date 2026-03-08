import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcryptjs from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import speakeasy from "speakeasy";

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
        const { email, password, totpCode } = credentials as {
          email?: string;
          password?: string;
          totpCode?: string;
        };

        if (!email || !password) {
          return null;
        }

        const emailNorm = email.trim().toLowerCase();

        const user = await prisma.user.findUnique({
          where: { email: emailNorm },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValidCredentials = await bcryptjs.compare(password, user.password);

        if (!isValidCredentials) {
          return null;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const targetUser = user as any;

        if (targetUser.twoFactorEnabled) {
          if (!totpCode) throw new Error("2FA code required. Please check your Authenticator app.");
          if (!targetUser.twoFactorSecret) throw new Error("2FA is enabled but secret is missing from database.");
          const isValid = speakeasy.totp.verify({
            secret: targetUser.twoFactorSecret,
            encoding: "base32",
            token: totpCode,
          });
          if (!isValid) {
            throw new Error("Invalid 2FA code. Please try again.");
          }
        }

        return {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
        };
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
      if (user.role === "admin") {
        return true;
      }
      throw new Error("Only admin users are allowed to sign in.");
    },
    async redirect({ url, baseUrl }) {
      // Allow relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};