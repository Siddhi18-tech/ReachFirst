import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { donations, campaigns, ngos, disasters } from "@/lib/db/schema";
import { eq, sum } from "drizzle-orm";
import Link from "next/link";
import { ArrowRight, TrendingUp, Heart, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DonorImpactPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  let myDonations: typeof donations.$inferSelect[] = [];
  let totalGiven = "0";

  try {
    myDonations = await db
      .select()
      .from(donations)
      .where(eq(donations.donorId, session.user.id));
    const [agg] = await db
      .select({ total: sum(donations.amount) })
      .from(donations)
      .where(eq(donations.donorId, session.user.id));
    totalGiven = agg?.total ?? "0";
  } catch { }

  return (
    <div className="section animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">My Impact Dashboard</h1>
        <p className="text-sm text-on-surface-variant mt-1">Track where your donations went and see proof of impact</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {[
          { label: "Total Donated", value: formatCurrency(Number(totalGiven)), icon: TrendingUp, color: "text-primary" },
          { label: "Campaigns Supported", value: myDonations.length.toString(), icon: Heart, color: "text-secondary-500" },
          { label: "Disasters Aided", value: "3", icon: MapPin, color: "text-red-600" },
        ].map((s) => (
          <div key={s.label} className="card p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-card bg-surface-container flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-on-surface metric tabular">{s.value}</p>
              <p className="text-xs text-on-surface-variant">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Donations */}
      {myDonations.length === 0 ? (
        <div className="card p-10 text-center">
          <Heart className="w-12 h-12 mx-auto mb-3 text-outline opacity-40" />
          <p className="font-medium text-on-surface mb-2">No donations yet</p>
          <p className="text-sm text-on-surface-variant mb-5">Make your first donation to a verified NGO</p>
          <Link href="/disasters" className="btn-primary">
            Browse Disasters <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {myDonations.map((d) => (
            <div key={d.id} className="card p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-on-surface metric tabular">{formatCurrency(Number(d.amount), d.currency)}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {new Date(d.createdAt).toLocaleDateString("en-IN")} · {d.status}
                </p>
              </div>
              <span className={`badge text-xs ${d.status === "confirmed" ? "badge-govt" : "badge-severity-2"}`}>
                {d.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
