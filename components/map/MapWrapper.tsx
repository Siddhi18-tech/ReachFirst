"use client";

import dynamic from "next/dynamic";

export const DynamicDisasterMap = dynamic(() => import("./DisasterMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] bg-surface-container flex items-center justify-center rounded-card border border-outline-variant/60">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-on-surface-variant font-medium">Loading Map...</span>
      </div>
    </div>
  ),
});
