import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ngos, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireRole, getSessionUser } from "@/lib/auth-guard";
import { z } from "zod";

const applySchema = z.object({
  name: z.string().min(2, "Organisation name required"),
  registrationNumber: z.string().optional(),
  description: z.string().min(20, "Please describe your organisation (min 20 chars)"),
  address: z.string().min(5, "Address required"),
  baseLat: z.string().optional(),
  baseLng: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  phone: z.string().optional(),
  registrationType: z.enum(["govt", "platform"]),
  docs: z.object({
    certificate: z.string().optional(),
    taxDoc: z.string().optional(),
    disasterHistory: z.string().optional(),
  }).optional(),
});

// POST /api/ngo/apply — submit NGO application
export async function POST(req: NextRequest) {
  const guard = await requireRole("ngo");
  if (guard) return guard;

  const user = await getSessionUser();
  if (!user || !user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = applySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    // Check if user already has an NGO
    const [existing] = await db.select({ id: ngos.id }).from(ngos).where(eq(ngos.userId, user.id)).limit(1);
    if (existing) {
      return NextResponse.json({ error: "You already have an NGO application on file" }, { status: 409 });
    }

    const [ngo] = await db
      .insert(ngos)
      .values({
        userId: user.id,
        name: data.name,
        registrationNumber: data.registrationNumber,
        description: data.description,
        address: data.address,
        baseLat: data.baseLat,
        baseLng: data.baseLng,
        website: data.website || null,
        phone: data.phone,
        badge: data.registrationType,
        docs: data.docs ?? {},
        status: "pending",
      })
      .returning();

    return NextResponse.json({ success: true, ngo }, { status: 201 });
  } catch (e) {
    console.error("NGO apply error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/ngo/apply — get current user's NGO
export async function GET() {
  const guard = await requireRole(["ngo", "admin"]);
  if (guard) return guard;

  const user = await getSessionUser();
  if (!user || !user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [ngo] = await db.select().from(ngos).where(eq(ngos.userId, user.id)).limit(1);
  if (!ngo) return NextResponse.json({ ngo: null }, { status: 200 });

  return NextResponse.json({ ngo });
}
