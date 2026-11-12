import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { donations } from "@/lib/db/schema";
import { addMoney, paypalCharge, type Currency } from "@/lib/money";

type Result = { ok: true; donationId: string } | { ok: false; status: number; error: string };
const fail = (status: number, error: string): Result => ({ ok: false, status, error });

async function paypalToken(clientId: string, clientSecret: string): Promise<string | null> {
  const res = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token ?? null;
}

export async function captureOrder(orderId: string, user: { id: string; role: string }): Promise<Result> {
  const [donation] = await db.select().from(donations).where(eq(donations.paypalOrderId, orderId)).limit(1);
  if (!donation) return fail(404, "Donation order not found");
  if (donation.donorId !== user.id && user.role !== "admin") return fail(403, "Forbidden");
  if (donation.status === "confirmed") return { ok: true, donationId: donation.id };
  if (donation.status !== "pending") return fail(409, "Donation is not pending");

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_SECRET;
  const isDemoOrder = orderId.startsWith("DEMO-ORDER-");
  if (isDemoOrder && (clientId || clientSecret)) return fail(400, "Demo orders cannot be used when PayPal is configured");
  if (!isDemoOrder && (!clientId || !clientSecret)) return fail(503, "PayPal is not configured for this order");

  if (!isDemoOrder) {
    const token = await paypalToken(clientId!, clientSecret!);
    if (!token) return fail(502, "Unable to authorize PayPal capture");

    const capRes = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    const capData = await capRes.json();
    if (!capRes.ok || capData.status !== "COMPLETED") return fail(400, "PayPal payment capture failed");

    const captured = capData.purchase_units?.[0]?.payments?.captures?.[0]?.amount;
    const expected = paypalCharge(addMoney(donation.amount, donation.tipAmount), donation.currency as Currency);
    if (captured?.currency_code !== expected.currency_code || captured?.value !== expected.value) {
      return fail(400, "Captured payment does not match the donation order");
    }
  }

  // One statement: status change + campaign credit (donation amount only, not the tip). Atomic and idempotent.
  await db.execute(sql`
    WITH confirmed AS (
      UPDATE donations
      SET status = 'confirmed', confirmed_at = now()
      WHERE paypal_order_id = ${orderId} AND status = 'pending'
      RETURNING campaign_id, amount, currency
    )
    UPDATE campaigns
      SET raised = cast(campaigns.raised as numeric) + cast(confirmed.amount as numeric) *
            CASE WHEN confirmed.currency = 'USD' THEN 83 ELSE 1 END,
          updated_at = now()
    FROM confirmed
    WHERE campaigns.id = confirmed.campaign_id
  `);

  return { ok: true, donationId: donation.id };
}