import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaigns, ngos, disasters } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

const FALLBACK_CAMPAIGNS = [
  {
    id: "c1000000-0000-0000-0000-000000000001",
    title: "Emergency Food & Shelter — Wayanad Landslides",
    status: "active" as const,
    raised: 1250000,
    cap: 2500000,
    goal: 2000000,
    ngoId: "n1000000-0000-0000-0000-000000000001",
    ngoName: "Assam Rapid Relief & Rescue",
    disasterId: "d1000000-0000-0000-0000-000000000001",
    disasterName: "Wayanad Landslides Crisis",
    updatedAt: new Date(),
  },
  {
    id: "c1000000-0000-0000-0000-000000000002",
    title: "Brahmaputra Flood Evacuation & Clean Water",
    status: "active" as const,
    raised: 450000,
    cap: 1200000,
    goal: 1000000,
    ngoId: "n1000000-0000-0000-0000-000000000002",
    ngoName: "Kerala Emergency Flood Support",
    disasterId: "d1000000-0000-0000-0000-000000000002",
    disasterName: "Assam Brahmaputra Inundation",
    updatedAt: new Date(),
  },
];

export async function GET() {
  try {
    const rows = await db
      .select({
        id: campaigns.id,
        title: campaigns.title,
        status: campaigns.status,
        raised: campaigns.raised,
        cap: campaigns.cap,
        goal: campaigns.goal,
        ngoId: campaigns.ngoId,
        ngoName: ngos.name,
        disasterId: campaigns.disasterId,
        disasterName: disasters.name,
        updatedAt: campaigns.updatedAt,
      })
      .from(campaigns)
      .leftJoin(ngos, eq(campaigns.ngoId, ngos.id))
      .leftJoin(disasters, eq(campaigns.disasterId, disasters.id))
      .orderBy(desc(campaigns.updatedAt));

    if (rows.length > 0) {
      return NextResponse.json({ campaigns: rows });
    }
  } catch (err) {
    console.warn("GET /api/campaigns fallback to demo list:", err);
  }

  return NextResponse.json({ campaigns: FALLBACK_CAMPAIGNS });
}
