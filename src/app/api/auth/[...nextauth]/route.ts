import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import prisma from "@/lib/prisma"; // Assuming a global prisma instance

// Extend the User type to include the role field
declare module "next-auth" {
  interface User {
    role?: string;
    id: string;
  }
  interface Session {
    user: User & { role?: string; id: string };
  }
  interface JWT {
    role?: string;
    sub?: string; // Explicitly type sub as string or undefined
  }
}

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
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (user && user.role === "admin" && user.password === credentials.password) {
          return { id: user.id, email: user.email, role: user.role } as const; // Type-safe return
        }
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.sub = user.id; // Set sub to user.id, ensuring it's a string
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.role = token.role;
        session.user.id = token.sub; // Safely assign sub as string
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };