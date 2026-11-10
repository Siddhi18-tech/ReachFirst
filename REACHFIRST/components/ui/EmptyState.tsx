import React from "react";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-card border border-dashed border-outline-variant bg-surface-low/50",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-outline mb-3.5 shadow-xs">
        {icon ?? <Inbox className="w-6 h-6 stroke-[1.75]" />}
      </div>
      <h4 className="text-base font-bold text-on-surface tracking-tight">{title}</h4>
      {description && (
        <p className="mt-1 text-xs text-on-surface-variant max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

