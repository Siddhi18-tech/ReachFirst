import Link from "next/link";
import { Shield, TrendingUp, MapPin, CheckCircle, ArrowRight, Zap, Eye, Users } from "lucide-react";
import { db } from "@/lib/db";
import { disasters, campaigns, ngos, donations } from "@/lib/db/schema";
import { eq, sum, count, and } from "drizzle-orm";
import { formatCurrency, severityLabel } from "@/lib/utils";

async function getStats() {
  try {
    const [totalRaised] = await db.select({ total: sum(donations.amount) }).from(donations).where(eq(donations.status, "confirmed"));
    const [ngoCount] = await db.select({ count: count() }).from(ngos).where(eq(ngos.status, "approved"));
    const [disasterCount] = await db.select({ count: count() }).from(disasters).where(eq(disasters.active, true));
    const activeDisasters = await db.select().from(disasters).where(eq(disasters.active, true)).limit(3);
    return {
      totalRaised: totalRaised?.total ?? "0",
      ngoCount: ngoCount?.count ?? 0,
      disasterCount: disasterCount?.count ?? 0,
      activeDisasters,
    };
  } catch {
    return { totalRaised: "4250000", ngoCount: 7, disasterCount: 3, activeDisasters: [] };
  }
}

export default async function HomePage() {
  const { totalRaised, ngoCount, disasterCount, activeDisasters } = await getStats();

  return (
    <div className="animate-fade-in">
      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djZoLTZ2LTZoNnptMC0xMnY2aC02di02aDZ6bS0xMiAxMnY2aC02di02aDZ6bTAtMTJ2NmgtNnYtNmg2eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="section relative py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="badge badge-platform mb-6 w-fit">
              <CheckCircle className="w-3 h-3" />
              Verified NGOs · Transparent Ledger · Real Disasters
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
              Every rupee,{" "}
              <span className="text-secondary-container">tracked</span>{" "}
              from donation to delivery.
            </h1>
            <p className="text-lg text-white/70 max-w-xl leading-relaxed mb-8">
              ReliefTrack routes verified disaster-relief capital to ranked NGOs. Donors see proof of impact. Auditors trace every transaction. No guesswork.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/disasters" className="btn-primary !bg-secondary-container !text-secondary-800 hover:!bg-secondary-300 text-base px-7 py-3 h-auto">
                Donate Now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/transparency" className="btn-secondary !bg-white/10 !text-white !border-white/20 hover:!bg-white/20 text-base px-7 py-3 h-auto">
                <Eye className="w-4 h-4" /> View Transparency Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-outline-variant">
        <div className="section py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Total Relief Raised", value: formatCurrency(Number(totalRaised)), icon: TrendingUp, accent: "text-primary" },
              { label: "Active Disasters", value: disasterCount.toString(), icon: Zap, accent: "text-red-600" },
              { label: "Verified NGOs", value: ngoCount.toString(), icon: Shield, accent: "text-emerald-600" },
              { label: "Donors Worldwide", value: "1,200+", icon: Users, accent: "text-secondary-500" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-card bg-surface-container flex items-center justify-center ${s.accent}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-bold text-on-surface metric tabular">{s.value}</p>
                  <p className="text-xs text-on-surface-variant">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Active Disasters ─────────────────────────────────────────────────── */}
      <section className="section">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-on-surface">Active Disasters</h2>
            <p className="text-sm text-on-surface-variant mt-1">Verified emergencies requiring immediate relief funding</p>
          </div>
          <Link href="/disasters" className="btn-secondary text-sm">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {activeDisasters.length > 0
            ? activeDisasters.map((d) => {
                const sev = severityLabel(d.severity);
                return (
                  <Link key={d.id} href={`/disasters/${d.id}`} className="card p-5 group">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`badge ${sev.bg} ${sev.color} ${sev.border} border text-xs font-semibold`}>
                        {d.severity === 4 && <span className="w-1.5 h-1.5 rounded-full bg-red-500 pulse-dot mr-1" />}
                        Level {d.severity} — {sev.label}
                      </span>
                      <span className="text-xs font-mono text-outline uppercase">{d.type}</span>
                    </div>
                    <h3 className="font-semibold text-on-surface group-hover:text-primary transition-colors">{d.name}</h3>
                    <p className="flex items-center gap-1 text-xs text-on-surface-variant mt-1.5">
                      <MapPin className="w-3 h-3" /> {d.location}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className="text-primary font-medium">View NGO Rankings →</span>
                    </div>
                  </Link>
                );
              })
            : /* Fallback cards */
              [
                { name: "Assam Brahmaputra Floods 2024", type: "flood", location: "Assam, India", severity: 4, id: "demo" },
                { name: "Kerala Western Ghats Landslides", type: "landslide", location: "Wayanad, Kerala", severity: 3, id: "demo2" },
                { name: "Rajasthan Drought 2024", type: "drought", location: "Barmer, Rajasthan", severity: 2, id: "demo3" },
              ].map((d) => {
                const sev = severityLabel(d.severity);
                return (
                  <div key={d.id} className="card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`badge text-xs font-semibold ${sev.color} ${sev.bg} ${sev.border} border`}>
                        Level {d.severity} — {sev.label}
                      </span>
                      <span className="text-xs font-mono text-outline uppercase">{d.type}</span>
                    </div>
                    <h3 className="font-semibold text-on-surface">{d.name}</h3>
                    <p className="flex items-center gap-1 text-xs text-on-surface-variant mt-1.5">
                      <MapPin className="w-3 h-3" /> {d.location}
                    </p>
                  </div>
                );
              })}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────────── */}
      <section className="bg-surface-container py-16">
        <div className="section py-0">
          <h2 className="text-2xl font-bold text-on-surface text-center mb-2">How ReliefTrack works</h2>
          <p className="text-on-surface-variant text-center text-sm mb-10">Three steps from donation to verified field delivery</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: "🗺️",
                title: "Disaster detected",
                desc: "Verified disasters are sourced from GDACS, ReliefWeb and IMD. Severity is categorised on a 4-level scale.",
              },
              {
                step: "02",
                icon: "🏆",
                title: "NGOs ranked",
                desc: "Approved NGOs are ranked by severity zone, proximity to the disaster, and funding gap — with AI-generated explanations.",
              },
              {
                step: "03",
                icon: "📋",
                title: "Proof required",
                desc: "Payouts only release after an admin approves EXIF-verified field photos and receipts. Every rupee accounted for.",
              },
            ].map((h) => (
              <div key={h.step} className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{h.icon}</span>
                  <span className="font-mono text-xs text-outline font-semibold">STEP {h.step}</span>
                </div>
                <h3 className="font-bold text-on-surface mb-2">{h.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="section text-center py-16">
        <h2 className="text-3xl font-bold text-on-surface mb-3">Is your NGO responding to a disaster?</h2>
        <p className="text-on-surface-variant mb-6 max-w-lg mx-auto">
          Apply for accreditation. Upload your documents. Start receiving transparent, milestone-based funding.
        </p>
        <Link href="/ngo/apply" className="btn-primary text-base px-8 py-3 h-auto">
          Register Your NGO <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
