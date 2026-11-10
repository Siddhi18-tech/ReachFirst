"use client";

import React, { useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastProps {
  id?: string;
  type?: "info" | "success" | "error" | "warning";
  title?: string;
  message: string;
  onClose: () => void;
  duration?: number;
  className?: string;
}

export function Toast({
  type = "info",
  title,
  message,
  onClose,
  duration = 5000,
  className,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeConfig = {
    info: {
      icon: Info,
      bgColor: "bg-surface border-primary/30 text-on-surface",
      iconColor: "text-primary",
      indicator: "bg-primary",
    },
    success: {
      icon: CheckCircle2,
      bgColor: "bg-surface border-tertiary/30 text-on-surface",
      iconColor: "text-tertiary",
      indicator: "bg-tertiary",
    },
    error: {
      icon: AlertCircle,
      bgColor: "bg-surface border-error/30 text-on-surface",
      iconColor: "text-error",
      indicator: "bg-error",
    },
    warning: {
      icon: AlertTriangle,
      bgColor: "bg-surface border-secondary/30 text-on-surface",
      iconColor: "text-secondary",
      indicator: "bg-secondary",
    },
  };

  const config = typeConfig[type];
  const IconComponent = config.icon;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 p-4 rounded-card border shadow-lg transition-all animate-in fade-in slide-in-from-top-4 duration-300 max-w-md w-full relative overflow-hidden",
        config.bgColor,
        className
      )}
    >
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", config.indicator)} />
      <IconComponent className={cn("w-5 h-5 shrink-0 mt-0.5", config.iconColor)} />
      <div className="flex-1 min-w-0 pr-2">
        {title && <h5 className="text-sm font-bold tracking-tight mb-0.5">{title}</h5>}
        <p className="text-xs text-on-surface-variant leading-relaxed">{message}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-on-surface-variant hover:text-on-surface p-1 rounded-sm transition-colors cursor-pointer"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

