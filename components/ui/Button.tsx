import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const variantStyles = {
      primary: "bg-primary text-on-primary hover:bg-primary-hover shadow-sm active:translate-y-px",
      secondary: "bg-secondary-container text-on-secondary-container hover:opacity-90 active:translate-y-px",
      outline: "border border-outline text-on-surface hover:bg-surface-container active:translate-y-px",
      ghost: "text-on-surface hover:bg-surface-container/60 active:bg-surface-container",
      danger: "bg-error text-on-error hover:opacity-90 active:translate-y-px",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs rounded-input",
      md: "h-10 px-4 text-sm rounded-input font-medium",
      lg: "h-12 px-6 text-base rounded-input font-semibold",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
