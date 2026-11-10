import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["donor", "ngo"]),
});

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password, role } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 12);

    // ── Mock mode: use in-memory store ────────────────────────────────────────
    if (USE_MOCK) {
      const { mockUserStore } = await import("@/lib/mock/user-store");
      const existing = mockUserStore.findByEmail(email);
      if (existing) {
        return NextResponse.json({ error: "Email already registered" }, { status: 409 });
      }
      const user = mockUserStore.create({ name, email, passwordHash, role });
      return NextResponse.json(
        { success: true, user: { id: user.id, email: user.email, role: user.role } },
        { status: 201 }
      );
    }

    // ── Live mode: use real Neon DB ────────────────────────────────────────────
    try {
      const { db } = await import("@/lib/db");
      const { users } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");

      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existing) {
        return NextResponse.json({ error: "Email already registered" }, { status: 409 });
      }

      const [user] = await db
        .insert(users)
        .values({ name, email, passwordHash, role })
        .returning({ id: users.id, email: users.email, role: users.role });

      return NextResponse.json({ success: true, user }, { status: 201 });
    } catch (dbErr) {
      console.error("DB unavailable, falling back to mock store:", dbErr);
      // DB not configured — fall back gracefully to mock store
      const { mockUserStore } = await import("@/lib/mock/user-store");
      const existing = mockUserStore.findByEmail(email);
      if (existing) {
        return NextResponse.json({ error: "Email already registered" }, { status: 409 });
      }
      const user = mockUserStore.create({ name, email, passwordHash, role });
      return NextResponse.json(
        { success: true, user: { id: user.id, email: user.email, role: user.role } },
        { status: 201 }
      );
    }
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
