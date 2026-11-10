import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ orderId: z.string().min(1).max(128) });
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

/** Build a standard 4-step milestones array */
function buildMockMilestones(orderId: string) {
  const now = new Date().toISOString();
  return [
    { step: 1, label: "Payment Received & Held in Escrow", done: true, at: now },
    { step: 2, label: "Relief Supplies Purchased by NGO", done: false },
    { step: 3, label: "Field Distribution with GPS Proof", done: false },
    { step: 4, label: "Admin Proof Verified & Funds Released", done: false },
  ];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const { orderId } = parsed.data;
    const isDemoOrder = orderId.startsWith("DEMO-");

    // ── Mock / Demo mode ──────────────────────────────────────────────────────
    if (USE_MOCK || isDemoOrder) {
      return NextResponse.json({
        success: true,
        orderId,
        status: "confirmed",
        donationId: `MOCK-DON-${Date.now()}`,
        summary: {
          id: orderId,
          amount: 1000,
          currency: "INR",
          status: "escrow",
          milestones: buildMockMilestones(orderId),
        },
      });
    }

    // ── Live PayPal capture path ──────────────────────────────────────────────
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "PayPal is not configured" }, { status: 503 });
    }

    // Get PayPal access token
    const tokenRes = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(10000),
    });
    if (!tokenRes.ok) {
      return NextResponse.json({ error: "Unable to authorize PayPal capture" }, { status: 502 });
    }
    const { access_token: accessToken } = await tokenRes.json();

    // Capture the PayPal order
    const capRes = await fetch(
      `https://api-m.sandbox.paypal.com/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(15000),
      }
    );
    const capData = await capRes.json();
    if (!capRes.ok || capData.status !== "COMPLETED") {
      return NextResponse.json({ error: "PayPal payment capture failed" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      orderId,
      status: "confirmed",
      donationId: `LIVE-DON-${Date.now()}`,
      summary: {
        id: orderId,
        amount: 1000,
        currency: "INR",
        status: "escrow",
        milestones: buildMockMilestones(orderId),
      },
    });
  } catch (error) {
    console.error("Capture order error:", error);
    return NextResponse.json({ error: "Failed to capture donation" }, { status: 500 });
  }
}
