import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { donations, milestones, proofs } from "@/lib/db/schema";
import type { DonationSummary, Milestone } from "@/types/api";

const iso = (v: unknown): string | undefined => {
  if (!v) return undefined;
  const d = new Date(v as string);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

/** Builds the contract DonationSummary. Steps 3 and 4 are campaign-level (proof verified, funds released). */
export async function buildDonationSummary(donationId: string): Promise<DonationSummary | null> {
  const [d] = await db.select().from(donations).where(eq(donations.id, donationId)).limit(1);
  if (!d) return null;

  const [proofRow] = await db
    .select({ n: sql<number>`count(*)::int`, at: sql<string | null>`min(${proofs.createdAt})` })
    .from(proofs)
    .where(and(eq(proofs.campaignId, d.campaignId), eq(proofs.verified, true)));

  const [paidRow] = await db
    .select({ n: sql<number>`count(*)::int`, at: sql<string | null>`min(${milestones.approvedAt})` })
    .from(milestones)
    .where(and(eq(milestones.campaignId, d.campaignId), eq(milestones.status, "paid")));

  const confirmed = d.status === "confirmed";
  const proofDone = confirmed && (proofRow?.n ?? 0) > 0;
  const releasedDone = confirmed && (paidRow?.n ?? 0) > 0;
  const confirmedAt = d.confirmedAt ? d.confirmedAt.toISOString() : undefined;

  const steps: Milestone[] = [
    { step: 1, label: "Payment received", done: confirmed, at: confirmedAt },
    { step: 2, label: "Held in escrow", done: confirmed, at: confirmedAt },
    { step: 3, label: "Field proof verified by admin", done: proofDone, at: proofDone ? iso(proofRow?.at) : undefined },
    { step: 4, label: "Funds released to NGO", done: releasedDone, at: releasedDone ? iso(paidRow?.at) : undefined },
  ];

  const status: DonationSummary["status"] =
    d.status === "failed" ? "failed" : d.status === "pending" ? "pending" : releasedDone ? "released" : "escrow";

  return {
    id: d.id,
    amount: Number(d.amount),
    currency: d.currency === "INR" ? "INR" : "USD",
    status,
    milestones: steps,
  };
}