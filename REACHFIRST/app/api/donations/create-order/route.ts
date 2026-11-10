import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createOrderSchema = z.object({
  campaignId: z.string().min(1),
  amount: z.number().positive().max(1_000_000),
  tipAmount: z.number().min(0).max(100_000).default(0),
  currency: z.enum(["INR", "USD"]).default("INR"),
});

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

function twoDecimals(n: number) {
  return Math.abs(n * 100 - Math.round(n * 100)) < 1e-6;
}

/** Convert INR/USD to PayPal-safe USD value */
function toUsdValue(amount: number, currency: "INR" | "USD"): string {
  const usd = currency === "USD" ? amount : amount / 83;
  return usd.toFixed(2);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid donation parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { campaignId, amount, tipAmount, currency } = parsed.data;

    if (!twoDecimals(amount) || !twoDecimals(tipAmount)) {
      return NextResponse.json(
        { error: "Amounts must have no more than two decimal places" },
        { status: 400 }
      );
    }

    const total = amount + tipAmount;
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_SECRET;

    // ── Mock / Demo mode (no PayPal credentials) ──────────────────────────────
    if (USE_MOCK || !clientId || !clientSecret) {
      const demoOrderId = `DEMO-${crypto.randomUUID()}`;
      return NextResponse.json({
        orderId: demoOrderId,
        donationId: `MOCK-DON-${Date.now()}`,
        amount,
        tipAmount,
        currency,
        approvalUrl: null,
        demo: true,
      });
    }

    // ── Live PayPal path ──────────────────────────────────────────────────────
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
      return NextResponse.json({ error: "Unable to authorize PayPal order" }, { status: 502 });
    }
    const { access_token: accessToken } = await tokenRes.json();

    const orderRes = await fetch("https://api-m.sandbox.paypal.com/v2/checkout/orders", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: campaignId,
            amount: { currency_code: "USD", value: toUsdValue(total, currency) },
            description: "ReliefTrack Disaster Relief Donation",
          },
        ],
        application_context: {
          return_url: `${req.nextUrl.origin}/donate/confirmation?campaignId=${encodeURIComponent(campaignId)}&amount=${amount}&currency=${currency}`,
          cancel_url: `${req.nextUrl.origin}/donate?campaignId=${encodeURIComponent(campaignId)}`,
        },
      }),
      signal: AbortSignal.timeout(15000),
    });

    const orderData = await orderRes.json();
    const approvalLink = orderData.links?.find((l: { rel: string }) => l.rel === "approve")?.href;
    if (!orderData.id || !approvalLink) {
      return NextResponse.json({ error: "Unable to create PayPal order" }, { status: 502 });
    }

    return NextResponse.json({
      orderId: orderData.id,
      donationId: null,
      amount,
      tipAmount,
      currency,
      approvalUrl: approvalLink,
    });
  } catch (error) {
    console.error("Create donation order error:", error);
    return NextResponse.json({ error: "Failed to initialize donation order" }, { status: 500 });
  }
}
