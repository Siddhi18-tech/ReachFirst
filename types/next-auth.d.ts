import { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id?: string;
    role?: "donor" | "ngo" | "admin";
  }

  interface Session {
    user: {
      id: string;
      role: "donor" | "ngo" | "admin";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "donor" | "ngo" | "admin";
  }
}
