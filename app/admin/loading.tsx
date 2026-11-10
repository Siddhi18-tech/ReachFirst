import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminLoading() {
  return (
    <div className="section max-w-6xl mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-300">
      <div className="space-y-2 pb-4 border-b border-outline-variant/40">
        <Skeleton className="h-5 w-36 rounded-pill" />
        <Skeleton className="h-9 w-64 rounded-md" />
        <Skeleton className="h-4 w-96 max-w-full rounded-md" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-44 rounded-card" />
        <Skeleton className="h-10 w-44 rounded-card" />
        <Skeleton className="h-10 w-44 rounded-card" />
      </div>

      {/* Rows Skeleton */}
      <div className="space-y-3 pt-2">
        <Skeleton className="h-20 w-full rounded-card" />
        <Skeleton className="h-20 w-full rounded-card" />
        <Skeleton className="h-20 w-full rounded-card" />
      </div>
    </div>
  );
}

