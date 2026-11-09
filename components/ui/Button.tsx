import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary" | "outline" | "ghost" | "danger" | "urgent";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  loadingText?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      iconLeft,
      iconRight,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      primary:
        "bg-primary text-white hover:bg-primary-hover shadow-sm active:translate-y-px focus-visible:ring-primary",
      secondary:
        "bg-secondary-container text-secondary-900 hover:opacity-90 active:translate-y-px shadow-sm focus-visible:ring-secondary",
      tertiary:
        "bg-tertiary text-white hover:bg-tertiary-400 active:translate-y-px shadow-sm focus-visible:ring-tertiary",
      outline:
        "border border-outline-variant bg-white text-on-surface hover:bg-surface-container active:translate-y-px focus-visible:ring-primary",
      ghost:
        "text-on-surface hover:bg-surface-container/70 active:bg-surface-container focus-visible:ring-primary",
      danger:
        "bg-urgent text-white hover:opacity-90 active:translate-y-px shadow-sm focus-visible:ring-urgent",
      urgent:
        "bg-urgent text-white hover:opacity-90 active:translate-y-px shadow-sm focus-visible:ring-urgent",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs rounded-input font-medium",
      md: "h-10 px-4 text-sm rounded-input font-semibold",
      lg: "h-12 px-6 text-base rounded-input font-semibold",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <span
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
            {loadingText ?? children}
          </>
        ) : (
          <>
            {iconLeft && <span className="inline-flex shrink-0">{iconLeft}</span>}
            {children}
            {iconRight && <span className="inline-flex shrink-0">{iconRight}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
