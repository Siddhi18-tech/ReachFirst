import { Skeleton } from "@/components/ui/Skeleton";

export default function DisasterRankingLoading() {
  return (
    <div className="section max-w-7xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-300">
      <Skeleton className="h-4 w-36 rounded-md" />

      {/* Disaster Header Skeleton */}
      <div className="p-6 rounded-card border border-outline-variant/60 bg-surface space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-28 rounded-pill" />
          <Skeleton className="h-5 w-20 rounded-pill" />
        </div>
        <Skeleton className="h-9 w-96 max-w-full rounded-md" />
        <Skeleton className="h-4 w-72 max-w-full rounded-md" />
      </div>

      {/* Ranked NGO Cards Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48 rounded-md" />
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-card" />
          <Skeleton className="h-48 w-full rounded-card" />
          <Skeleton className="h-48 w-full rounded-card" />
        </div>
      </div>
    </div>
  );
}

