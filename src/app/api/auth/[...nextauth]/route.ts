import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcryptjs from "bcryptjs";

const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials as {
          email?: string;
          password?: string;
        };

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: email || undefined },
        });

        if (
          user &&
          user.password &&
          (await bcryptjs.compare(password, user.password))
        ) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role, // Include role from Prisma User
          };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async signIn({ user }) {
      // Only allow admins to sign in
      if (user.role === "admin") {
        return true;
      }
      throw new Error("Only admin users are allowed to sign in.");
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to /admin after sign-in
      return "/admin";
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role; // Safely access role due to type extension
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string; // Safely access role
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, authOptions };