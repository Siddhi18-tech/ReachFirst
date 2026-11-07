import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { disasters } from "@/lib/db/schema";
import { toDisaster } from "@/lib/mappers";

const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Invalid disaster id" }, { status: 400 });
  try {
    const [row] = await db.select().from(disasters).where(eq(disasters.id, id)).limit(1);
    if (!row) return NextResponse.json({ error: "Disaster not found" }, { status: 404 });
    return NextResponse.json(toDisaster(row));
  } catch (err) {
    console.error("GET /api/disasters/[id]", err);
    return NextResponse.json({ error: "Failed to load disaster" }, { status: 500 });
  }
}