import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { donations, campaigns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createOrderSchema = z.object({
  campaignId: z.string().uuid(),
  amount: z.number().positive().max(1_000_000),
  currency: z.enum(["INR", "USD"]).default("INR"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid donation parameters", details: parsed.error.flatten() }, { status: 400 });
    }

    const { campaignId, amount, currency } = parsed.data;

    // Verify campaign exists and is active
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    if (campaign.status !== "active") {
      return NextResponse.json({ error: "This campaign is not active for donations" }, { status: 400 });
    }
    if (Math.round(amount * 100) !== amount * 100) {
      return NextResponse.json({ error: "Amount must have no more than two decimal places" }, { status: 400 });
    }
    const amountInr = currency === "INR" ? amount : amount * 83;
    if (campaign.cap && Number(campaign.raised) + amountInr > Number(campaign.cap)) {
      return NextResponse.json({ error: "This donation would exceed the campaign funding cap" }, { status: 400 });
    }

    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_SECRET;

    let paypalOrderId = `DEMO-ORDER-${crypto.randomUUID()}`;
    let paypalApprovalUrl: string | null = null;

    // If real PayPal credentials provided, call PayPal Sandbox Orders API
    if (clientId && clientSecret) {
      try {
        const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
        const tokenRes = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
          method: "POST",
          headers: {
            Authorization: `Basic ${authHeader}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: "grant_type=client_credentials",
        });

        if (!tokenRes.ok) return NextResponse.json({ error: "Unable to authorize PayPal order" }, { status: 502 });
        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        if (accessToken) {
          // PayPal sandbox order create
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
                  amount: {
                    currency_code: currency === "INR" ? "USD" : currency, // PayPal sandbox works best in USD
                    value: (currency === "INR" ? Math.round(amount / 83) : amount).toFixed(2),
                  },
                  description: campaign?.title || "ReliefTrack Disaster Relief Donation",
                },
              ],
              application_context: {
                return_url: `${req.nextUrl.origin}/donate/confirmation?campaignId=${encodeURIComponent(campaignId)}&amount=${encodeURIComponent(amount.toFixed(2))}&currency=${currency}`,
                cancel_url: `${req.nextUrl.origin}/donate?campaignId=${encodeURIComponent(campaignId)}`,
              },
            }),
          });

          const orderData = await orderRes.json();
          const approvalUrl = orderData.links?.find((link: { rel: string }) => link.rel === "approve")?.href;
          if (orderData.id && approvalUrl) {
            paypalOrderId = orderData.id;
            paypalApprovalUrl = approvalUrl;
          } else {
            return NextResponse.json({ error: "Unable to create PayPal order" }, { status: 502 });
          }
        } else {
          return NextResponse.json({ error: "Unable to authorize PayPal order" }, { status: 502 });
        }
      } catch (err) {
        console.error("PayPal order create error:", err);
        return NextResponse.json({ error: "Unable to create PayPal order" }, { status: 502 });
      }
    }

    // Insert pending donation into DB
    let donationRecordId = `d-${Date.now()}`;
    try {
      const [inserted] = await db
        .insert(donations)
        .values({
          donorId: session?.user?.id || null,
          campaignId,
          amount: amount.toFixed(2),
          currency,
          paypalOrderId,
          status: "pending",
        })
        .returning({ id: donations.id });

      if (inserted) {
        donationRecordId = inserted.id;
      }
    } catch (err) {
      console.error("DB insert pending donation failed:", err);
      return NextResponse.json({ error: "Unable to save donation order" }, { status: 500 });
    }

    return NextResponse.json({
      orderId: paypalOrderId,
      donationId: donationRecordId,
      amount,
      currency,
      approvalUrl: paypalApprovalUrl,
    });
  } catch (error) {
    console.error("Create donation error:", error);
    return NextResponse.json({ error: "Failed to initialize donation order" }, { status: 500 });
  }
}
