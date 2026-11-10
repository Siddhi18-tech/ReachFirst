import { db } from "@/lib/db";
import { disasters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { MapPin, ArrowRight, Zap } from "lucide-react";
import { severityLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DisastersPage() {
  let activeDisasters: typeof disasters.$inferSelect[] = [];
  try {
    activeDisasters = await db.select().from(disasters).where(eq(disasters.active, true));
  } catch { }

  return (
    <div className="section animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Active Disasters</h1>
        <p className="text-sm text-on-surface-variant mt-1">Select a disaster to view ranked NGOs and donate</p>
      </div>

      {activeDisasters.length === 0 ? (
        <div className="card p-10 text-center">
          <Zap className="w-12 h-12 mx-auto mb-3 text-outline opacity-40" />
          <p className="text-on-surface-variant">No active disasters at this time</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeDisasters.map((d) => {
            const sev = severityLabel(d.severity);
            return (
              <Link key={d.id} href={`/disasters/${d.id}`} className="card p-5 group hover:border-primary transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <span className={`badge text-xs font-semibold border ${sev.color} ${sev.bg} ${sev.border}`}>
                    {d.severity === 4 && <span className="w-1.5 h-1.5 rounded-full bg-red-500 pulse-dot mr-1 inline-block" />}
                    Level {d.severity} — {sev.label}
                  </span>
                  <span className="text-xs font-mono uppercase text-outline">{d.type}</span>
                </div>
                <h2 className="font-semibold text-on-surface group-hover:text-primary transition-colors mb-2">{d.name}</h2>
                <p className="flex items-center gap-1 text-xs text-on-surface-variant">
                  <MapPin className="w-3 h-3" /> {d.location}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-primary font-medium flex items-center gap-1">
                    View NGO Rankings <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
