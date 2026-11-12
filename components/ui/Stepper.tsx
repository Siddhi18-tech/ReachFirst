import React from "react";
import { cn } from "@/lib/utils";
import { Check, Clock } from "lucide-react";
import type { Milestone } from "@/types/api";

export interface StepperProps {
  steps: (Milestone | { step: number; label: string; done: boolean; at?: string; description?: string })[];
  currentStep?: number;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function Stepper({
  steps,
  currentStep,
  orientation = "horizontal",
  className,
}: StepperProps) {
  const isVertical = orientation === "vertical";

  return (
    <div
      className={cn(
        "w-full",
        isVertical ? "flex flex-col space-y-6" : "flex items-start justify-between relative",
        className
      )}
    >
      {steps.map((step, idx) => {
        const isDone = Boolean(step.done);
        const isCurrent = currentStep ? currentStep === step.step : !isDone && (idx === 0 || steps[idx - 1]?.done);
        const isPending = !isDone && !isCurrent;
        const isLast = idx === steps.length - 1;

        const formattedDate = step.at
          ? new Date(step.at).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : null;

        return (
          <div
            key={step.step}
            className={cn(
              "flex group",
              isVertical ? "flex-row items-start gap-4 relative" : "flex-1 flex-col items-center text-center relative"
            )}
          >
            {/* Connecting line */}
            {!isLast && (
              isVertical ? (
                <div
                  className={cn(
                    "absolute left-4 top-8 bottom--4 w-0.5 -ml-px transition-colors duration-300",
                    isDone ? "bg-primary" : "bg-outline-variant/60"
                  )}
                  style={{ height: "calc(100% + 1.25rem)" }}
                  aria-hidden="true"
                />
              ) : (
                <div
                  className={cn(
                    "absolute top-4 left-1/2 w-full h-0.5 transition-colors duration-300 -z-0",
                    isDone ? "bg-primary" : "bg-outline-variant/60"
                  )}
                  aria-hidden="true"
                />
              )
            )}

            {/* Step Icon Badge */}
            <div
              className={cn(
                "relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 shrink-0",
                isDone && "bg-primary text-white shadow-xs",
                isCurrent && "bg-secondary-container text-secondary-900 ring-4 ring-secondary-container/30 shadow-xs animate-pulse-dot",
                isPending && "bg-surface-container text-outline border border-outline-variant/80"
              )}
            >
              {isDone ? (
                <Check className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <span>{step.step}</span>
              )}
            </div>

            {/* Step Content */}
            <div className={cn(isVertical ? "flex-1 pt-0.5" : "mt-2.5 px-2")}>
              <p
                className={cn(
                  "text-xs font-semibold tracking-tight transition-colors",
                  isDone && "text-on-surface font-bold",
                  isCurrent && "text-primary font-bold",
                  isPending && "text-on-surface-variant/70 font-medium"
                )}
              >
                {step.label}
              </p>

              {formattedDate && (
                <p className="mt-0.5 text-[11px] font-mono text-outline flex items-center gap-1 justify-center sm:justify-start">
                  <Clock className="w-3 h-3 inline" />
                  {formattedDate}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

