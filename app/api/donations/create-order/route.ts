import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { donations, campaigns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireRole, getSessionUser } from "@/lib/auth-guard";
import { addMoney, paypalCharge, toInr } from "@/lib/money";
import { z } from "zod";

const createOrderSchema = z.object({
  campaignId: z.string().uuid(),
  amount: z.number().positive().max(1_000_000),
  tipAmount: z.number().min(0).max(100_000).default(0),
  currency: z.enum(["INR", "USD"]).default("INR"),
});

const twoDecimals = (n: number) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6;

export async function POST(req: NextRequest) {
  const guard = await requireRole(["donor", "admin"]);
  if (guard) return guard;
  const user = await getSessionUser();
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const parsed = createOrderSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid donation parameters", details: parsed.error.flatten() }, { status: 400 });
    }
    const { campaignId, amount, tipAmount, currency } = parsed.data;

    if (!twoDecimals(amount) || !twoDecimals(tipAmount)) {
      return NextResponse.json({ error: "Amounts must have no more than two decimal places" }, { status: 400 });
    }

    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    if (campaign.status !== "active") {
      return NextResponse.json({ error: "This campaign is not active for donations" }, { status: 400 });
    }
    if (campaign.cap && Number(campaign.raised) + toInr(amount, currency) > Number(campaign.cap)) {
      return NextResponse.json({ error: "This donation would exceed the campaign funding cap" }, { status: 400 });
    }

    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_SECRET;

    let paypalOrderId = `DEMO-ORDER-${crypto.randomUUID()}`;
    let approvalUrl: string | null = null;

    if (clientId && clientSecret && clientId !== "test") {
      try {
        const tokenRes = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: "grant_type=client_credentials",
          signal: AbortSignal.timeout(10000),
        });
        if (!tokenRes.ok) return NextResponse.json({ error: "Unable to authorize PayPal order" }, { status: 502 });
        const { access_token: accessToken } = await tokenRes.json();
        if (!accessToken) return NextResponse.json({ error: "Unable to authorize PayPal order" }, { status: 502 });

        const charge = paypalCharge(addMoney(amount, tipAmount), currency);
        const orderRes = await fetch("https://api-m.sandbox.paypal.com/v2/checkout/orders", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [
              {
                reference_id: campaignId,
                amount: { currency_code: charge.currency_code, value: charge.value },
                description: campaign.title || "ReliefTrack Disaster Relief Donation",
              },
            ],
            application_context: {
              return_url: `${req.nextUrl.origin}/donate/confirmation?campaignId=${encodeURIComponent(campaignId)}&amount=${encodeURIComponent(amount.toFixed(2))}&currency=${currency}`,
              cancel_url: `${req.nextUrl.origin}/donate?campaignId=${encodeURIComponent(campaignId)}`,
            },
          }),
          signal: AbortSignal.timeout(15000),
        });
        const orderData = await orderRes.json();
        const link = orderData.links?.find((l: { rel: string }) => l.rel === "approve")?.href;
        if (!orderData.id || !link) return NextResponse.json({ error: "Unable to create PayPal order" }, { status: 502 });
        paypalOrderId = orderData.id;
        approvalUrl = link;
      } catch (err) {
        console.error("PayPal order create error:", err);
        return NextResponse.json({ error: "Unable to create PayPal order" }, { status: 502 });
      }
    }

    const [inserted] = await db
      .insert(donations)
      .values({
        donorId: user.id,
        campaignId,
        amount: amount.toFixed(2),
        tipAmount: tipAmount.toFixed(2),
        currency,
        paypalOrderId,
        status: "pending",
      })
      .returning({ id: donations.id });
    if (!inserted) return NextResponse.json({ error: "Unable to save donation order" }, { status: 500 });

    return NextResponse.json({
      orderId: paypalOrderId,
      donationId: inserted.id,
      amount,
      tipAmount,
      currency,
      approvalUrl,
    });
  } catch (error) {
    console.error("Create donation error:", error);
    return NextResponse.json({ error: "Failed to initialize donation order" }, { status: 500 });
  }
}