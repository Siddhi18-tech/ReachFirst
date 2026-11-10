import { Skeleton } from "@/components/ui/Skeleton";

export default function RootLoading() {
  return (
    <div className="section max-w-7xl mx-auto py-10 px-4 space-y-8 animate-in fade-in duration-300">
      {/* Top Banner Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-36 rounded-pill" />
        <Skeleton className="h-10 w-96 max-w-full rounded-md" />
        <Skeleton className="h-4 w-72 max-w-full rounded-md" />
      </div>

      {/* Grid of Skeleton Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-48 rounded-card" />
        <Skeleton className="h-48 rounded-card" />
        <Skeleton className="h-48 rounded-card" />
      </div>

      {/* Content Skeleton */}
      <div className="space-y-4 pt-4">
        <Skeleton className="h-8 w-64 rounded-md" />
        <Skeleton className="h-32 w-full rounded-card" />
      </div>
    </div>
  );
}

