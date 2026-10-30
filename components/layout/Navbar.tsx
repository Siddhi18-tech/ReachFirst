"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Menu, X, Shield, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const role = session?.user?.role;

  const navLinks = {
    donor: [
      { href: "/map", label: "Disaster Map" },
      { href: "/disasters", label: "Active Disasters" },
      { href: "/donor/impact", label: "My Impact" },
      { href: "/transparency", label: "Transparency" },
    ],
    ngo: [
      { href: "/ngo/profile", label: "My NGO" },
      { href: "/disasters", label: "Active Crises" },
      { href: "/ngo/proof", label: "Upload Proof" },
    ],
    admin: [
      { href: "/admin", label: "Approvals" },
      { href: "/admin/campaigns", label: "Campaigns" },
      { href: "/admin/payouts", label: "Payouts" },
      { href: "/transparency", label: "Transparency" },
    ],
  };

  const links = role ? (navLinks[role as keyof typeof navLinks] ?? []) : [
    { href: "/map", label: "Disaster Map" },
    { href: "/disasters", label: "Active Disasters" },
    { href: "/transparency", label: "Transparency" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-primary shadow-md">
      <nav className="max-w-8xl mx-auto px-gutter h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 text-white font-bold text-lg">
          <Shield className="w-6 h-6 text-primary-on-container" />
          <span className="tracking-tight">
            Relief<span className="text-secondary-container font-extrabold">Track</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3.5 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-input transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Auth area */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-input transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-secondary-container text-secondary-600 flex items-center justify-center text-xs font-bold uppercase">
                  {session.user?.name?.charAt(0) ?? "U"}
                </div>
                <span className="max-w-[120px] truncate">{session.user?.name}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-card border border-outline-variant shadow-modal py-1 animate-fade-in">
                  <div className="px-3 py-2 border-b border-outline-variant">
                    <p className="text-xs text-outline font-mono uppercase tracking-wide">{role}</p>
                    <p className="text-sm font-medium text-on-surface truncate">{session.user?.email}</p>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="btn-secondary !text-primary !border-white/30 !bg-white/10 !text-white hover:!bg-white/20">
                Sign In
              </Link>
              <Link href="/register" className="btn-primary !bg-secondary-container !text-secondary-800 hover:!bg-secondary-300">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-primary-800 border-t border-white/10 px-gutter py-3 space-y-1 animate-slide-up">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block px-3 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-input transition-colors"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <div className={cn("pt-2 border-t border-white/10 flex flex-col gap-2")}>
            {session ? (
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="btn-danger w-full"
              >
                Sign Out
              </button>
            ) : (
              <>
                <Link href="/login" className="btn-secondary text-center !text-white !bg-white/10 !border-white/30" onClick={() => setOpen(false)}>Sign In</Link>
                <Link href="/register" className="btn-primary text-center !bg-secondary-container !text-secondary-800" onClick={() => setOpen(false)}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
