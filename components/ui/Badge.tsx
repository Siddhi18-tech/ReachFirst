import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "govt" | "platform" | "critical" | "high" | "moderate" | "low" | "outline" | "default";
  children: React.ReactNode;
}

export function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  const variantStyles = {
    govt: "bg-tertiary-container text-on-tertiary-container border border-tertiary/30 font-semibold",
    platform: "bg-primary-container text-on-primary-container border border-primary/30 font-semibold",
    critical: "bg-error-container text-on-error-container border border-error/30 font-bold",
    high: "bg-secondary-container text-on-secondary-container border border-secondary/30 font-semibold",
    moderate: "bg-surface-container-high text-on-surface border border-outline/30 font-medium",
    low: "bg-surface-container text-on-surface-variant border border-outline/20 font-medium",
    outline: "border border-outline text-on-surface bg-transparent font-medium",
    default: "bg-surface-container-high text-on-surface font-medium",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-xs tracking-wide transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
