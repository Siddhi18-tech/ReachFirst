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
    // Government Accredited — Muted Sage/Forest Green
    govt: "bg-tertiary-container text-tertiary-on-container border border-tertiary/25 font-medium shadow-2xs",
    // Platform Verified — Deep Slate-Navy Accent
    platform: "bg-primary-50 text-primary-800 border border-primary-200 font-medium shadow-2xs",
    // Urgent / Critical — Soft Muted Rose-Crimson
    urgent: "bg-urgent-container text-urgent-on-container font-semibold border border-urgent/25",
    critical: "bg-urgent-container text-urgent-on-container font-semibold border border-urgent/25",
    // High Severity — Soft Warm Amber
    high: "bg-secondary-container text-secondary-on-container font-medium border border-secondary/25",
    // Moderate / Level 2 — Soft Slate Neutral
    moderate: "bg-surface-low text-on-surface border border-outline-variant font-medium",
    // Low / Level 1 — Subtle Neutral
    low: "bg-surface-low text-on-surface-variant border border-outline-variant/60 font-medium",
    // Neutral none / unbadged
    none: "bg-surface-low text-on-surface-variant border border-outline-variant font-medium",
    // Outline
    outline: "border border-outline text-on-surface bg-transparent font-medium",
    // Default
    default: "bg-surface-low text-on-surface font-medium border border-outline-variant",
  };

  const dotColors: Record<string, string> = {
    govt: "bg-tertiary",
    platform: "bg-primary",
    urgent: "bg-urgent animate-pulse",
    critical: "bg-urgent animate-pulse",
    high: "bg-secondary",
    moderate: "bg-slate-500",
    low: "bg-slate-400",
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
