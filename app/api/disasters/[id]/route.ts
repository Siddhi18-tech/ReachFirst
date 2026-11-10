import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { disasters } from "@/lib/db/schema";
import { toDisaster } from "@/lib/mappers";
import { mockDisasters } from "@/lib/mock/data";

const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    if (UUID.test(id)) {
      const [row] = await db.select().from(disasters).where(eq(disasters.id, id)).limit(1);
      if (row) return NextResponse.json(toDisaster(row));
    }
  } catch (err) {
    console.warn(`GET /api/disasters/${id} fallback to mock:`, err);
  }

  const found = mockDisasters.find((d) => d.id === id) ?? mockDisasters[0];
  if (found) return NextResponse.json(found);

  return NextResponse.json({ error: "Disaster not found" }, { status: 404 });
}
