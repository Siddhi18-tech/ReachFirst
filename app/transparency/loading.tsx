import { Skeleton } from "@/components/ui/Skeleton";

export default function TransparencyLoading() {
  return (
    <div className="section max-w-7xl mx-auto py-8 px-4 space-y-10 animate-in fade-in duration-300">
      <div className="space-y-2 pb-4 border-b border-outline-variant/40">
        <Skeleton className="h-5 w-40 rounded-pill" />
        <Skeleton className="h-10 w-96 max-w-full rounded-md" />
        <Skeleton className="h-4 w-3/4 rounded-md" />
      </div>

      {/* 4 Metric Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-28 rounded-card" />
      </div>

      {/* Proof Gallery Skeletons */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-64 rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-72 rounded-card" />
          <Skeleton className="h-72 rounded-card" />
          <Skeleton className="h-72 rounded-card" />
        </div>
      </div>

      {/* Disbursement Table Skeleton */}
      <Skeleton className="h-64 w-full rounded-card" />
    </div>
  );
}

