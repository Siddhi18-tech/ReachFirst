import { Skeleton } from "@/components/ui/Skeleton";

export default function NgoProfileLoading() {
  return (
    <div className="section max-w-5xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-300">
      {/* Status Hero Banner Skeleton */}
      <Skeleton className="h-32 w-full rounded-card" />

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <Skeleton className="h-56 w-full rounded-card" />
          <Skeleton className="h-44 w-full rounded-card" />
        </div>
        <div className="lg:col-span-5 space-y-6">
          <Skeleton className="h-40 w-full rounded-card" />
          <Skeleton className="h-32 w-full rounded-card" />
        </div>
      </div>

      {/* AI Parser Skeleton */}
      <Skeleton className="h-64 w-full rounded-card" />
    </div>
  );
}

