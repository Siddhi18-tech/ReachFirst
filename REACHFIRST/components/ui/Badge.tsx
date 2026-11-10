import React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "govt"
  | "GOVT"
  | "platform"
  | "PLATFORM"
  | "none"
  | "NONE"
  | "urgent"
  | "URGENT"
  | "critical"
  | "CRITICAL"
  | "high"
  | "HIGH"
  | "moderate"
  | "MODERATE"
  | "low"
  | "LOW"
  | "outline"
  | "default";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
  children: React.ReactNode;
}

export function Badge({
  variant = "default",
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  const norm = String(variant).toLowerCase();

  const variantStyles: Record<string, string> = {
    // Stitch Tertiary (Govt Accredited - Forest Green)
    govt: "bg-tertiary-container text-white border border-tertiary/40 font-semibold shadow-xs",
    // Stitch Primary (Platform Verified - Deep Teal)
    platform: "bg-primary-container text-white border border-primary/40 font-semibold shadow-xs",
    // Stitch Urgency (Urgent / Level 4 Crisis - Crimson Red)
    urgent: "bg-urgent-container text-urgent font-bold border border-urgent/30",
    critical: "bg-urgent-container text-urgent font-bold border border-urgent/30",
    // Stitch Secondary (High Severity / Level 3 - Warm Amber)
    high: "bg-secondary-container text-secondary-900 font-semibold border border-secondary/30",
    // Moderate / Level 2
    moderate: "bg-surface-container-high text-on-surface border border-outline/30 font-medium",
    // Low / Level 1
    low: "bg-surface-container text-on-surface-variant border border-outline/20 font-medium",
    // Neutral none / unbadged
    none: "bg-surface-container-high text-on-surface-variant border border-outline-variant font-medium",
    // Outline
    outline: "border border-outline text-on-surface bg-transparent font-medium",
    // Default
    default: "bg-surface-container-high text-on-surface font-medium border border-outline-variant/60",
  };

  const dotColors: Record<string, string> = {
    govt: "bg-tertiary",
    platform: "bg-primary",
    urgent: "bg-urgent animate-pulse",
    critical: "bg-urgent animate-pulse",
    high: "bg-secondary",
    moderate: "bg-slate-500",
    low: "bg-teal-600",
    none: "bg-slate-400",
    outline: "bg-outline",
    default: "bg-outline",
  };

  const selectedStyle = variantStyles[norm] ?? variantStyles.default;
  const dotColor = dotColors[norm] ?? "bg-current";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-xs tracking-wide transition-colors select-none",
        selectedStyle,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
