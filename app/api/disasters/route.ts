import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { disasters } from "@/lib/db/schema";
import { toDisaster } from "@/lib/mappers";

export async function GET() {
  try {
    const rows = await db.select().from(disasters).orderBy(desc(disasters.severity), desc(disasters.createdAt));
    return NextResponse.json(rows.map(toDisaster));
  } catch (err) {
    console.error("GET /api/disasters", err);
    return NextResponse.json({ error: "Failed to load disasters" }, { status: 500 });
  }
}