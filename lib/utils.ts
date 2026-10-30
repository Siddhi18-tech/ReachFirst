import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency = "INR") {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatPercent(raised: number | string, goal: number | string) {
  const r = typeof raised === "string" ? parseFloat(raised) : raised;
  const g = typeof goal === "string" ? parseFloat(goal) : goal;
  if (g === 0) return 0;
  return Math.min(Math.round((r / g) * 100), 100);
}

export function severityLabel(level: number) {
  const map: Record<number, { label: string; color: string; bg: string; border: string }> = {
    1: { label: "Low", color: "text-primary-700", bg: "bg-primary-50", border: "border-primary-200" },
    2: { label: "Moderate", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
    3: { label: "High", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
    4: { label: "Critical", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  };
  return map[level] ?? map[1];
}

export function badgeLabel(badge: string) {
  if (badge === "govt") {
    return { label: "Government Verified", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: "🏛️" };
  }
  return { label: "Platform Verified", color: "text-primary-700", bg: "bg-primary-50", border: "border-primary-200", icon: "✅" };
}
