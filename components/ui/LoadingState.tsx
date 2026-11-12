import React from "react";
import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";

export interface LoadingStateProps {
  message?: string;
  subtext?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingState({
  message = "Loading ReliefTrack...",
  subtext = "Verifying session and security clearance",
  fullScreen = true,
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-6 bg-surface",
        fullScreen ? "min-h-[calc(100vh-4rem)] w-full" : "py-16 w-full",
        className
      )}
    >
      <div className="relative flex items-center justify-center mb-6">
        {/* Pulsing ring */}
        <div className="absolute w-16 h-16 rounded-full bg-primary/20 animate-ping" />
        <div className="relative w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-on-container shadow-md">
          <Shield className="w-7 h-7 animate-pulse" />
        </div>
      </div>

      <h3 className="text-lg font-bold text-on-surface tracking-tight">{message}</h3>
      {subtext && (
        <p className="mt-1.5 text-xs text-on-surface-variant max-w-sm leading-relaxed">
          {subtext}
        </p>
      )}

      {/* Progress dots */}
      <div className="mt-5 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
      </div>
    </div>
  );
}

