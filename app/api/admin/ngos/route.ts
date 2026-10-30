import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ngos, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth-guard";

// GET /api/admin/ngos — list all pending NGOs with user email
export async function GET(req: NextRequest) {
  const guard = await requireRole("admin");
  if (guard) return guard;

  const url = new URL(req.url);
  const status = (url.searchParams.get("status") ?? "pending") as "pending" | "approved" | "rejected";

  const rows = await db
    .select({
      id: ngos.id,
      name: ngos.name,
      badge: ngos.badge,
      status: ngos.status,
      address: ngos.address,
      registrationNumber: ngos.registrationNumber,
      docs: ngos.docs,
      createdAt: ngos.createdAt,
      rejectionReason: ngos.rejectionReason,
      userEmail: users.email,
      userName: users.name,
    })
    .from(ngos)
    .leftJoin(users, eq(ngos.userId, users.id))
    .where(eq(ngos.status, status))
    .orderBy(ngos.createdAt);

  return NextResponse.json({ ngos: rows });
}
