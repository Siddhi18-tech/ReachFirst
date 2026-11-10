import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { disasters } from "@/lib/db/schema";
import { toDisaster } from "@/lib/mappers";
import { mockDisasters } from "@/lib/mock/data";

export async function GET() {
  try {
    const rows = await db.select().from(disasters).orderBy(desc(disasters.severity), desc(disasters.createdAt));
    if (rows.length > 0) {
      return NextResponse.json(rows.map(toDisaster));
    }
  } catch (err) {
    console.warn("GET /api/disasters fallback to mock:", err);
  }
  return NextResponse.json(mockDisasters);
}
