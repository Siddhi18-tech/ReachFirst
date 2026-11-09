import React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      options,
      children,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-on-surface uppercase tracking-wider"
          >
            {label}
            {props.required && <span className="text-urgent ml-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={cn(
              "w-full h-10 pl-3.5 pr-10 bg-white border rounded-input text-sm text-on-surface appearance-none transition-all outline-none cursor-pointer",
              "border-outline-variant hover:border-outline focus:border-primary focus:ring-2 focus:ring-primary/20",
              error && "border-urgent text-urgent focus:border-urgent focus:ring-urgent/20",
              disabled && "bg-surface-container opacity-60 cursor-not-allowed",
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <div className="absolute right-3.5 flex items-center pointer-events-none text-outline">
            <ChevronDown className="w-4 h-4" />
          </div>
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

Select.displayName = "Select";

