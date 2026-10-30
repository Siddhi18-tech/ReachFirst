import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processedWebhookEvents } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

async function verifyPayPalWebhook(req: NextRequest, event: unknown) {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_SECRET;
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!clientId || !clientSecret || !webhookId) return false;

  const authorization = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenResponse = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: { Authorization: `Basic ${authorization}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!tokenResponse.ok) return false;
  const { access_token: accessToken } = await tokenResponse.json();
  if (!accessToken) return false;

  const verificationResponse = await fetch("https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_algo: req.headers.get("paypal-auth-algo"),
      cert_url: req.headers.get("paypal-cert-url"),
      transmission_id: req.headers.get("paypal-transmission-id"),
      transmission_sig: req.headers.get("paypal-transmission-sig"),
      transmission_time: req.headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: event,
    }),
  });
  if (!verificationResponse.ok) return false;
  const verification = await verificationResponse.json();
  return verification.verification_status === "SUCCESS";
}

export async function POST(req: NextRequest) {
  try {
    const event = await req.json();
    if (!event?.id || typeof event.id !== "string") {
      return NextResponse.json({ error: "Missing webhook event ID" }, { status: 400 });
    }
    if (!(await verifyPayPalWebhook(req, event))) {
      return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 401 });
    }

    const eventId = event.id;
    const eventType = event.event_type;
    const resource = event.resource;
    const orderId = resource?.supplementary_data?.related_ids?.order_id;

    if (eventType === "PAYMENT.CAPTURE.COMPLETED" && typeof orderId === "string") {
      // A single database statement records the event and applies a one-time credit.
      const result = await db.execute(sql`
        WITH received AS (
          INSERT INTO processed_webhook_events (id) VALUES (${eventId})
          ON CONFLICT (id) DO NOTHING
          RETURNING id
        ), confirmed AS (
          UPDATE donations
          SET status = 'confirmed', confirmed_at = now()
          WHERE paypal_order_id = ${orderId} AND status = 'pending'
            AND EXISTS (SELECT 1 FROM received)
          RETURNING campaign_id, amount, currency
        ), credited AS (
          UPDATE campaigns
          SET raised = cast(cast(campaigns.raised as numeric) + cast(confirmed.amount as numeric) *
                CASE WHEN confirmed.currency = 'USD' THEN 83 ELSE 1 END as text),
              updated_at = now()
          FROM confirmed
          WHERE campaigns.id = confirmed.campaign_id
          RETURNING campaigns.id
        )
        SELECT id FROM received
      `);
      const rows = Array.isArray(result) ? result : result.rows;
      if (rows.length === 0) return NextResponse.json({ status: "already_processed" });
    } else {
      const inserted = await db.insert(processedWebhookEvents).values({ id: eventId })
        .onConflictDoNothing().returning({ id: processedWebhookEvents.id });
      if (inserted.length === 0) return NextResponse.json({ status: "already_processed" });
    }

    return NextResponse.json({ status: "processed", eventId });
  } catch (error) {
    console.error("PayPal webhook error:", error);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}
