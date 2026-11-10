import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // ── Mock / DB-fallback path ───────────────────────────────────────────
        const tryMockAuth = async () => {
          const { mockUserStore } = await import("@/lib/mock/user-store");
          const user = mockUserStore.findByEmail(email);
          if (!user) return null;
          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) return null;
          return { id: user.id, email: user.email, name: user.name, role: user.role };
        };

        if (USE_MOCK) return tryMockAuth();

        // ── Live DB path ──────────────────────────────────────────────────────
        try {
          const { db } = await import("@/lib/db");
          const { users } = await import("@/lib/db/schema");
          const { eq } = await import("drizzle-orm");

          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!user) return null;
          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) return null;
          return { id: user.id, email: user.email, name: user.name, role: user.role };
        } catch (dbErr) {
          console.warn("DB unavailable during auth, falling back to mock store:", dbErr);
          return tryMockAuth();
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: "donor" | "ngo" | "admin" }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "donor" | "ngo" | "admin";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
