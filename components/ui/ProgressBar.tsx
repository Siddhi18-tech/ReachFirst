import React from "react";
import { cn } from "@/lib/utils";

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showLabel?: boolean;
  label?: string;
  variant?: "primary" | "secondary" | "tertiary" | "urgent";
  size?: "sm" | "md" | "lg";
}

export function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  label,
  variant = "primary",
  size = "md",
  className,
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / (max || 1)) * 100)));

  const variantStyles = {
    primary: "bg-primary",
    secondary: "bg-secondary-container",
    tertiary: "bg-tertiary",
    urgent: "bg-urgent",
  };

  const sizeStyles = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  return (
    <div className={cn("w-full space-y-1.5", className)} {...props}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium">
          <span>{label ?? "Progress"}</span>
          <span className="font-mono tabular">{percentage}%</span>
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={cn(
          "w-full bg-surface-container overflow-hidden rounded-full border border-outline-variant/40",
          sizeStyles[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            variantStyles[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

