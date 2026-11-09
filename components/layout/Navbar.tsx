"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import {
  Shield,
  Menu,
  X,
  ChevronDown,
  LogOut,
  MapPin,
  TrendingUp,
  FileCheck2,
  SlidersHorizontal,
  Building2,
  HeartHandshake,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const role = session?.user?.role as "donor" | "ngo" | "admin" | undefined;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Role-specific navigation links
  const roleNavLinks = {
    donor: [
      { href: "/map", label: "Live Map", icon: MapPin },
      { href: "/disasters", label: "Active Crises", icon: TrendingUp },
      { href: "/donor/impact", label: "My Impact", icon: HeartHandshake },
      { href: "/transparency", label: "Transparency Ledger", icon: FileCheck2 },
    ],
    ngo: [
      { href: "/ngo/profile", label: "NGO Portal", icon: Building2 },
      { href: "/ngo/proof", label: "Upload Proof", icon: FileCheck2 },
      { href: "/ngo/apply", label: "Apply / Accreditation", icon: Shield },
      { href: "/disasters", label: "Active Crises", icon: TrendingUp },
    ],
    admin: [
      { href: "/admin", label: "Admin Console", icon: SlidersHorizontal },
      { href: "/map", label: "Live Map", icon: MapPin },
      { href: "/disasters", label: "Crises", icon: TrendingUp },
      { href: "/transparency", label: "Transparency", icon: FileCheck2 },
    ],
  };

  const publicLinks = [
    { href: "/map", label: "Live Map", icon: MapPin },
    { href: "/disasters", label: "Active Crises", icon: TrendingUp },
    { href: "/transparency", label: "Transparency Ledger", icon: FileCheck2 },
  ];

  const currentLinks = role ? (roleNavLinks[role] ?? publicLinks) : publicLinks;

  const roleBadgeVariant: Record<string, "govt" | "platform" | "high" | "default"> = {
    admin: "high",
    ngo: "govt",
    donor: "platform",
  };

  return (
    <header className="sticky top-0 z-50 bg-primary border-b border-primary-container shadow-md">
      <nav className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-white group focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container rounded-input p-1"
        >
          <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-primary-on-container group-hover:scale-105 transition-transform shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Relief
            <span className="text-secondary-container font-extrabold ml-0.5">
              Track
            </span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-1.5">
          {currentLinks.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-input transition-all duration-150",
                  isActive
                    ? "bg-white/15 text-white font-semibold shadow-xs"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-secondary-container" : "text-white/70")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Desktop Auth / User Session Area */}
        <div className="hidden md:flex items-center gap-3">
          {status === "loading" ? (
            <div className="w-24 h-9 bg-white/10 rounded-input animate-pulse" />
          ) : session ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-input bg-white/10 hover:bg-white/15 border border-white/15 text-white transition-colors cursor-pointer select-none"
                aria-expanded={userDropdownOpen}
                aria-label="User account menu"
              >
                <div className="w-7 h-7 rounded-full bg-secondary-container text-secondary-900 flex items-center justify-center text-xs font-bold font-mono uppercase shadow-xs">
                  {session.user?.name ? session.user.name.charAt(0) : "U"}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-semibold leading-tight max-w-[120px] truncate text-white">
                    {session.user?.name ?? "User"}
                  </p>
                  <p className="text-[10px] text-primary-on-container uppercase font-mono tracking-wider">
                    {role}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-white/70" />
              </button>

              {/* User Dropdown Popover */}
              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-card border border-outline-variant shadow-modal py-2 z-50 animate-slide-up">
                  <div className="px-4 py-2.5 border-b border-outline-variant/60">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-on-surface-variant font-medium">Signed in as</p>
                      {role && (
                        <Badge variant={roleBadgeVariant[role] ?? "default"}>
                          {role.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-bold text-on-surface truncate">
                      {session.user?.name}
                    </p>
                    <p className="text-xs text-on-surface-variant font-mono truncate">
                      {session.user?.email}
                    </p>
                  </div>

                  <div className="py-1">
                    {role === "donor" && (
                      <Link
                        href="/donor/impact"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-on-surface hover:bg-surface-container transition-colors"
                      >
                        <HeartHandshake className="w-4 h-4 text-primary" />
                        <span>My Donations & Impact</span>
                      </Link>
                    )}
                    {role === "ngo" && (
                      <Link
                        href="/ngo/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-on-surface hover:bg-surface-container transition-colors"
                      >
                        <Building2 className="w-4 h-4 text-primary" />
                        <span>NGO Verification & Profile</span>
                      </Link>
                    )}
                    {role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-on-surface hover:bg-surface-container transition-colors"
                      >
                        <SlidersHorizontal className="w-4 h-4 text-primary" />
                        <span>Admin Queue & Controls</span>
                      </Link>
                    )}
                  </div>

                  <div className="pt-1 border-t border-outline-variant/60">
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-urgent hover:bg-urgent-container/30 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4 text-urgent" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center h-9 px-3.5 text-xs font-semibold rounded-input text-white hover:bg-white/10 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center h-9 px-4 text-xs font-bold rounded-input bg-secondary-container text-secondary-900 hover:opacity-90 shadow-xs transition-all active:translate-y-px"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white p-2 rounded-input hover:bg-white/10 transition-colors"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-primary-800 border-t border-white/10 px-4 py-4 space-y-3 animate-slide-up">
          {session && (
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="w-8 h-8 rounded-full bg-secondary-container text-secondary-900 flex items-center justify-center text-xs font-bold font-mono">
                {session.user?.name ? session.user.name.charAt(0) : "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{session.user?.name}</p>
                <p className="text-xs text-primary-on-container font-mono truncate">{session.user?.email}</p>
              </div>
              {role && (
                <Badge variant={roleBadgeVariant[role] ?? "default"}>
                  {role.toUpperCase()}
                </Badge>
              )}
            </div>
          )}

          <div className="space-y-1">
            {currentLinks.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-input text-sm font-medium transition-colors",
                    isActive
                      ? "bg-white/15 text-white font-bold"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  )}
                >
                  <Icon className="w-4 h-4 text-secondary-container" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
            {session ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-input bg-urgent text-white text-xs font-bold shadow-xs"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center h-10 rounded-input border border-white/30 text-white text-xs font-semibold hover:bg-white/10 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center h-10 rounded-input bg-secondary-container text-secondary-900 text-xs font-bold hover:opacity-90 transition-opacity shadow-xs"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
