import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { mockUserStore } from "@/lib/mock/user-store";

const schema = z.object({
  name: z.string().min(2, "Full name or organisation name is required (min 2 characters)"),
  email: z.string().email("Valid email address is required"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  role: z.enum(["donor", "ngo"]),
});

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
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check fallback mock store first
    const existingMock = mockUserStore.findByEmail(normalizedEmail);
    if (existingMock) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Try to save to live DB if configured and reachable
    let registeredUser = null;
    try {
      const dbUrl = process.env.DATABASE_URL || "";
      const isPlaceholder = !dbUrl || dbUrl.includes("user:password@host") || dbUrl.includes("placeholder");

      if (!isPlaceholder) {
        const [existingDb] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1);

        if (existingDb) {
          return NextResponse.json({ error: "Email already registered" }, { status: 409 });
        }

        const [newUser] = await db
          .insert(users)
          .values({ name: name.trim(), email: normalizedEmail, passwordHash, role })
          .returning({ id: users.id, email: users.email, role: users.role, name: users.name });
        registeredUser = newUser;
      }
    } catch (dbErr) {
      console.warn("Database unavailable during registration, saving to fallback user store:", dbErr);
    }

    // 4. If DB was unavailable, placeholder, or threw, persist in mockUserStore
    if (!registeredUser) {
      registeredUser = mockUserStore.create({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role,
      });
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: registeredUser.id,
          email: registeredUser.email,
          name: registeredUser.name,
          role: registeredUser.role,
        },
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json(
      { error: "Failed to create account. Please check your details and try again." },
      { status: 500 }
    );
  }
}
