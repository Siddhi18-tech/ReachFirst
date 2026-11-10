import { Skeleton } from "@/components/ui/Skeleton";

export default function DonorImpactLoading() {
  return (
    <div className="section max-w-5xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-300">
      <div className="space-y-2 pb-4 border-b border-outline-variant/40">
        <Skeleton className="h-5 w-32 rounded-pill" />
        <Skeleton className="h-9 w-72 rounded-md" />
        <Skeleton className="h-4 w-96 max-w-full rounded-md" />
      </div>

      {/* 3 Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-28 rounded-card" />
      </div>

      {/* Feed Cards Skeleton */}
      <div className="space-y-4 pt-4">
        <Skeleton className="h-6 w-48 rounded-md" />
        <Skeleton className="h-44 w-full rounded-card" />
        <Skeleton className="h-44 w-full rounded-card" />
      </div>
    </div>
  );
}

