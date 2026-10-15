import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      name?: string | null;
      email?: string | null;
      role?: string;
    } & DefaultSession["user"];
    /** When this sign-in happened (ms). Used to end sessions after a password/role change. */
    signedInAt?: number;
  }

  interface User extends DefaultUser {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string;
    /** Set once at sign-in; unlike iat it doesn't change when the session is refreshed. */
    signedInAt?: number;
  }
}