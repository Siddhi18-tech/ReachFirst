import Link from "next/link";
import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-inverse-surface text-inverse-on-surface mt-auto">
      <div className="max-w-8xl mx-auto px-gutter py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <Shield className="w-5 h-5 text-primary-200" />
              <span>Relief<span className="text-secondary-container">Track</span></span>
            </Link>
            <p className="text-sm text-white/60 max-w-sm leading-relaxed">
              Verified disaster-relief capital routing. Every donation tracked from collection to field delivery with full fiscal transparency.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">Platform</h4>
            <ul className="space-y-2">
              {[
                { href: "/map", label: "Disaster Map" },
                { href: "/disasters", label: "Active Disasters" },
                { href: "/transparency", label: "Transparency" },
                { href: "/ngo/apply", label: "Register NGO" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">Legal</h4>
            <ul className="space-y-2">
              {[
                { href: "#", label: "Privacy Policy" },
                { href: "#", label: "Terms of Service" },
                { href: "#", label: "Cookie Policy" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/40">
          <p>© 2024 ReliefTrack. All rights reserved. Free tiers only.</p>
          <p>
            Map data ©{" "}
            <a href="https://www.openstreetmap.org/copyright" className="underline hover:text-white/70" target="_blank" rel="noreferrer">
              OpenStreetMap
            </a>{" "}
            contributors
          </p>
        </div>
      </div>
    </footer>
  );
}
