import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { donations } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

const captureSchema = z.object({ orderId: z.string().min(1).max(128) });

export async function POST(req: NextRequest) {
  try {
    const parsed = captureSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });

    const [donation] = await db.select().from(donations)
      .where(eq(donations.paypalOrderId, parsed.data.orderId)).limit(1);
    if (!donation) return NextResponse.json({ error: "Donation order not found" }, { status: 404 });
    if (donation.status === "confirmed") {
      return NextResponse.json({ success: true, orderId: parsed.data.orderId, status: "confirmed" });
    }
    if (donation.status !== "pending") return NextResponse.json({ error: "Donation is not pending" }, { status: 409 });

    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_SECRET;
    const isDemoOrder = parsed.data.orderId.startsWith("DEMO-ORDER-");
    if (isDemoOrder && (clientId || clientSecret)) {
      return NextResponse.json({ error: "Demo orders cannot be used when PayPal is configured" }, { status: 400 });
    }
    if (!isDemoOrder && (!clientId || !clientSecret)) {
      return NextResponse.json({ error: "PayPal is not configured for this order" }, { status: 503 });
    }

    if (!isDemoOrder) {
      const authorization = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      const tokenResponse = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
        method: "POST",
        headers: { Authorization: `Basic ${authorization}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: "grant_type=client_credentials",
      });
      if (!tokenResponse.ok) return NextResponse.json({ error: "Unable to authorize PayPal capture" }, { status: 502 });
      const { access_token: accessToken } = await tokenResponse.json();
      if (!accessToken) return NextResponse.json({ error: "Unable to authorize PayPal capture" }, { status: 502 });

      const captureResponse = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${encodeURIComponent(parsed.data.orderId)}/capture`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      });
      const captureData = await captureResponse.json();
      if (!captureResponse.ok || captureData.status !== "COMPLETED") {
        return NextResponse.json({ error: "PayPal payment capture failed" }, { status: 400 });
      }
      const capturedAmount = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount;
      const expectedAmount = donation.currency === "INR"
        ? (Math.round(Number(donation.amount) / 83)).toFixed(2)
        : Number(donation.amount).toFixed(2);
      const expectedCurrency = donation.currency === "INR" ? "USD" : donation.currency;
      if (capturedAmount?.currency_code !== expectedCurrency || capturedAmount?.value !== expectedAmount) {
        return NextResponse.json({ error: "Captured payment does not match the donation order" }, { status: 400 });
      }
    }

    // One SQL statement makes the status transition and campaign credit atomic and idempotent.
    await db.execute(sql`
      WITH confirmed AS (
        UPDATE donations
        SET status = 'confirmed', confirmed_at = now()
        WHERE paypal_order_id = ${parsed.data.orderId} AND status = 'pending'
        RETURNING campaign_id, amount, currency
      )
      UPDATE campaigns
        SET raised = cast(cast(campaigns.raised as numeric) + cast(confirmed.amount as numeric) *
              CASE WHEN confirmed.currency = 'USD' THEN 83 ELSE 1 END as text),
          updated_at = now()
      FROM confirmed
      WHERE campaigns.id = confirmed.campaign_id
    `);

    return NextResponse.json({ success: true, orderId: parsed.data.orderId, status: "confirmed" });
  } catch (error) {
    console.error("Capture order error:", error);
    return NextResponse.json({ error: "Failed to capture donation" }, { status: 500 });
  }
}
