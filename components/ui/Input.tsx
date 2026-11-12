import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-on-surface uppercase tracking-wider"
          >
            {label}
            {props.required && <span className="text-urgent ml-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-outline">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            type={type}
            disabled={disabled}
            className={cn(
              "w-full h-10 px-3.5 bg-white border rounded-input text-sm text-on-surface placeholder:text-outline-variant/80 transition-all outline-none",
              "border-outline-variant hover:border-outline focus:border-primary focus:ring-2 focus:ring-primary/20",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-urgent text-urgent focus:border-urgent focus:ring-urgent/20",
              disabled && "bg-surface-container opacity-60 cursor-not-allowed",
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 flex items-center pointer-events-none text-outline">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs font-medium text-urgent flex items-center gap-1 animate-fade-in">
            <span>•</span>
            {error}
          </p>
        )}

        {!error && helperText && (
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

