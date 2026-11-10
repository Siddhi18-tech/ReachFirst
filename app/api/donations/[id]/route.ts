import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-guard";
import { buildDonationSummary } from "@/lib/donation-summary";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing donation ID" }, { status: 400 });
  }

  try {
    const summary = await buildDonationSummary(id);
    if (!summary) {
      // In mock mode or if mock ID
      if (process.env.NEXT_PUBLIC_USE_MOCK === "true" || id.startsWith("MOCK-") || id.startsWith("DEMO-")) {
        return NextResponse.json({
          id,
          amount: 1000,
          currency: "INR",
          status: "escrow",
          milestones: [
            { step: 1, label: "Payment received", done: true, at: new Date().toISOString() },
            { step: 2, label: "Held in escrow", done: true, at: new Date().toISOString() },
            { step: 3, label: "Field proof verified by admin", done: false },
            { step: 4, label: "Funds released to NGO", done: false },
          ],
        });
      }
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Fetch donation error:", error);
    return NextResponse.json({ error: "Failed to fetch donation summary" }, { status: 500 });
  }
}

